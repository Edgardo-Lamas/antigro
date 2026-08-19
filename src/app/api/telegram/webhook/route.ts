import { NextResponse } from "next/server";
import { repositorio } from "@/lib/datos";
import { codigoDeUnStart } from "@/lib/mensajeria/vinculacion";
import { tokenDeUnToque } from "@/lib/mensajeria/acuse";
import { TransporteTelegram } from "@/lib/mensajeria";
import { CODIGO_DEMO, CUPO, nombreDelRol, soltarCupo, tomarCupo } from "@/lib/mensajeria/cupo-demo";

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
  /**
   * 🔴 **Esto es nuevo (19/8) y hasta hoy el webhook NI LO MIRABA.** Escuchaba
   * sólo `message`, así que un toque de botón entraba, no encajaba con nada y
   * se contestaba 200 en silencio. Es lo que hacía imposible el acuse de
   * recibo: el botón se podía dibujar, pero apretarlo no llegaba a ningún lado.
   */
  callback_query?: {
    id?: string;
    data?: string;
    from?: { first_name?: string };
    message?: { message_id?: number; chat?: { id?: number } };
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

  /* ── 🔵 El toque del botón «Lo vi», ANTES que nada ──────────────────────────
     Va primero porque es otra clase de actualización: no trae texto ni `/start`
     y nada de lo de abajo aplica. */
  const toque = actualizacion.callback_query;
  if (toque) {
    const bot = new TransporteTelegram();
    const token = tokenDeUnToque(toque.data);
    const chatDelToque = toque.message?.chat?.id;

    if (!token) {
      if (toque.id) await bot.contestarToque(toque.id, "Este botón ya no hace nada.");
      return NextResponse.json({ ok: true });
    }

    const acusado = await repositorio().marcarAcuse(token, new Date().toISOString());

    /* 🔑 Que el token ya se haya usado NO es un error para el que aprieta: lo
       vio igual. Se le dice que ya estaba, no que algo falló. */
    if (toque.id) {
      await bot.contestarToque(
        toque.id,
        acusado ? "Listo, quedó registrado que lo viste." : "Esto ya estaba registrado.",
      );
    }

    /* ⚠ Se saca el botón. Un botón que sigue ahí después de usarse invita a
       apretarlo de nuevo para no recibir nada, y eso enseña a desconfiar. */
    if (chatDelToque && toque.message?.message_id) {
      await bot.marcarComoVisto(
        String(chatDelToque),
        toque.message.message_id,
        "✓ Dijiste que lo viste",
      );
    }

    return NextResponse.json({ ok: true, acuse: acusado ? "registrado" : "ya_estaba" });
  }

  const texto = actualizacion.message?.text ?? "";
  const chatId = actualizacion.message?.chat?.id;

  // A Telegram siempre se le contesta 200: un error acá lo hace reintentar
  // durante horas. Lo que no se pudo procesar, no se procesa y listo.
  if (!chatId) return NextResponse.json({ ok: true });

  const bot = new TransporteTelegram();
  const responder = (mensaje: string) =>
    bot.enviar({ canal: "telegram", destino: String(chatId), texto: mensaje });

  const codigo = codigoDeUnStart(texto);

  /* ── 🔐 El cupo de la demo, ANTES de tocar ninguna familia ─────────────────
     Se resuelve acá y se corta: este código sale de una página pública y no
     puede, bajo ninguna circunstancia, terminar buscándose entre los códigos
     de una familia real. Que no pueda colisionar por su forma ya lo garantiza
     `CODIGO_DEMO`; que ni siquiera se intente lo garantiza este `return`. */
  if (codigo === CODIGO_DEMO) {
    const quien = actualizacion.message?.from?.first_name?.trim() || "Hola";
    const resultado = await tomarCupo(String(chatId), quien);

    if (!resultado.ok) {
      await responder(
        `Por ahora hay ${CUPO} personas probando la demostración y es el máximo que ` +
          "se conectan a la vez. En un rato se libera un lugar: volvé a escanear el " +
          "código y entrás.",
      );
      return NextResponse.json({ ok: true, cupo: "lleno" });
    }

    const { cupo, yaEstaba } = resultado;
    await responder(
      yaEstaba
        ? `Ya estabas conectado, ${cupo.nombre}. Seguís en el lugar de ${nombreDelRol(cupo.rol)}.`
        : `Listo, ${cupo.nombre}. Estás viendo la demostración de AntiGro desde el lugar de ` +
            `${nombreDelRol(cupo.rol)}.\n\n` +
            "Cuando en la página se pida el aviso, te va a llegar acá el texto que le " +
            "llegaría a esa persona. Ana, Mariana y Carla son inventadas: no hay ninguna " +
            "chica real detrás de esto.\n\n" +
            "Si querés soltar el lugar para que lo use otro, escribí /chau.",
    );
    return NextResponse.json({ ok: true, cupo: cupo.rol });
  }

  if (/^\/chau\b/i.test(texto.trim())) {
    const solto = await soltarCupo(String(chatId));
    await responder(
      solto
        ? "Listo, soltaste el lugar. Gracias por probarlo."
        : "No tenías ningún lugar tomado.",
    );
    return NextResponse.json({ ok: true, solto });
  }

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
