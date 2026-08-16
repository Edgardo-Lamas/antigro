import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { enlaceDeVinculacion } from "@/lib/mensajeria/vinculacion";

/**
 * El QR con el que un referente se conecta.
 *
 * 🔐 **El código se valida contra la familia de la sesión antes de dibujar
 * nada.** Sin esa comprobación, cualquiera con una cuenta podría pedir el QR
 * de un código ajeno y meterse en el canal de otra casa — que es justo el
 * ataque que la vinculación por código de un solo uso viene a evitar.
 *
 * 🔑 El QR se dibuja acá, en el servidor. No se usa ningún generador de
 * terceros: mandarle a un servicio ajeno el enlace de vinculación de una
 * familia real sería una contradicción con todo lo demás.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string | null } | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const codigo = new URL(req.url).searchParams.get("codigo")?.trim().toUpperCase();
  if (!codigo) return NextResponse.json({ error: "sin_codigo" }, { status: 400 });

  const datos = await repositorio().familiaPorId(usuario.familiaId);
  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });

  const esDeEstaFamilia =
    datos.chicos.some((c) => c.canal.codigo === codigo) ||
    datos.adultos.some((a) => a.canal.codigo === codigo);

  // 404 y no 403: quien pregunta por un código ajeno no tiene por qué
  // enterarse de que existe.
  if (!esDeEstaFamilia) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });

  const enlace = enlaceDeVinculacion(codigo);
  if (!enlace) {
    return NextResponse.json({ error: "bot_sin_configurar" }, { status: 503 });
  }

  const qr = await QRCode.toString(enlace, {
    type: "svg",
    // Zona de silencio: sin margen, un lector pega el código contra el borde y falla.
    margin: 2,
    // Alto: muchas veces se escanea de una pantalla, no de un papel.
    errorCorrectionLevel: "H",
    // 🔴 Oscuro sobre CLARO aunque la página sea oscura: un QR en negativo
    // queda lindo y hay teléfonos que no lo leen.
    color: { dark: "#0D1117", light: "#FFFFFF" },
  });

  return NextResponse.json({ codigo, enlace, qr });
}
