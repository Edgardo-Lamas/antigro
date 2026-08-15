import { NextResponse } from "next/server";
import { repositorio } from "@/lib/datos";
import { codigoDeUnStart } from "@/lib/mensajeria/vinculacion";
import { TransporteTelegram } from "@/lib/mensajeria";

/**
 * Lo que Telegram le pega a AntiGro cuando alguien aprieta "Iniciar".
 *
 * Es el único lugar del sistema donde entra el `chat_id` de una persona, y es
 * lo que permite que una familia no configure absolutamente nada.
 *
 * 🔐 Este endpoint es público — Telegram tiene que poder llamarlo. Por eso
 * exige el secreto que se fija al registrar el webhook: sin eso, cualquiera
 * que descubra la URL puede hacerse pasar por Telegram y meterse en el canal
 * de una familia mandando códigos hasta pegarle a uno.
 */

export const dynamic = "force-dynamic";

interface ActualizacionDeTelegram {
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { first_name?: string };
  };
}

export async function POST(req: Request) {
  const esperado = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!esperado) {
    return NextResponse.json({ error: "Webhook sin secreto configurado" }, { status: 503 });
  }
  if (req.headers.get("x-telegram-bot-api-secret-token") !== esperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const actualizacion = (await req.json().catch(() => ({}))) as ActualizacionDeTelegram;
  const texto = actualizacion.message?.text ?? "";
  const chatId = actualizacion.message?.chat?.id;

  // A Telegram siempre se le contesta 200: un error acá lo hace reintentar
  // durante horas. Lo que no se pudo procesar, no se procesa y listo.
  if (!chatId) return NextResponse.json({ ok: true });

  const bot = new TransporteTelegram();
  const responder = (mensaje: string) =>
    bot.enviar({ canal: "telegram", destino: String(chatId), texto: mensaje });

  const codigo = codigoDeUnStart(texto);

  if (!codigo) {
    await responder(
      "Hola. Este es el canal de AntiGro. Para conectarte, abrí el enlace que te " +
        "pasaron cuando se dio de alta el sistema en tu casa.",
    );
    return NextResponse.json({ ok: true });
  }

  const vinculacion = await repositorio().vincularPorCodigo(codigo, String(chatId));

  if (!vinculacion) {
    await responder(
      "Ese código no es válido o ya se usó. Si te pasó algo raro, pedile a quien " +
        "dio de alta el sistema que te genere uno nuevo.",
    );
    return NextResponse.json({ ok: true });
  }

  await responder(
    vinculacion.quien === "chico"
      ? `Listo, ${vinculacion.nombre}. Desde acá te vamos a escribir si algo cambia. ` +
          "Y para que quede claro: no leemos tus conversaciones, ni las de nadie. " +
          "Vemos horarios y cuánto se usa, nada más."
      // Sin marca de género: no está cargado, y "conectado" a una tía queda
      // mal por una razón que se puede evitar escribiéndolo de otra forma.
      : `Listo, ${vinculacion.nombre}. Ya estás en el sistema como adulto responsable. ` +
          "Si hay algo que decir sobre la actividad de red, te llega por acá.",
  );

  return NextResponse.json({ ok: true, vinculado: vinculacion.quien });
}
