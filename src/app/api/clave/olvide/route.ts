import { NextResponse } from "next/server";
import { z } from "zod";
import { SITIO } from "@/lib/config";
import { deQuienViene, tomarTurno } from "@/lib/limite";
import { TransporteCorreo } from "@/lib/mensajeria";
import { correoDeRecuperacion } from "@/lib/recuperacion";
import { pedirRecuperacion } from "@/lib/recuperacion-datos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  «OLVIDÉ MI CONTRASEÑA» — pedir el enlace (24/9)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Contesta lo mismo exista o no el correo.** Si dijera «ese correo no
 *  tiene cuenta», cualquiera podría averiguar qué direcciones usan un sistema
 *  que cuida chicos. El que tiene cuenta recibe el correo; el que no, nada.
 *
 *  🔴 **La dirección del enlace sale de `SITIO`, nunca del pedido.** Si saliera
 *  del encabezado `Host`, alguien podría pedir la recuperación de otra persona
 *  con un `Host` propio y el correo —el de verdad, el que llega a la víctima—
 *  llevaría un enlace a su servidor. Si la víctima lo toca, le entrega la llave.
 *
 *  📌 Sin correo configurado lo dice ANTES de mirar la base, con la misma
 *  respuesta para todos: así tampoco revela nada, y la persona sabe que no tiene
 *  que quedarse esperando un correo que no va a llegar.
 */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const Cuerpo = z.object({ email: z.string().trim().email().max(254) });

const LISTO = {
  ok: true,
  mensaje:
    "Si ese correo tiene una cuenta en AntiGro, en unos minutos te llega un enlace para " +
    "poner una clave nueva. Mirá también en correo no deseado.",
};

export async function POST(req: Request) {
  const correo = new TransporteCorreo();
  const estado = await correo.estado();
  if (!estado.disponible) {
    return NextResponse.json(
      {
        error:
          "Por ahora AntiGro no puede mandar correos, así que la clave no se puede recuperar " +
          "desde acá. Estamos trabajando en eso.",
        sinCorreo: true,
      },
      { status: 503 },
    );
  }

  /* 🔑 Dos topes: por conexión frena al que prueba muchos correos; por correo,
     al que le llena la bandeja a una persona pidiendo enlaces sin parar. */
  const porIp = await tomarTurno(`olvide-ip:${deQuienViene(req)}`, 15 * 60, 5);
  if (!porIp.permitido) {
    return NextResponse.json(
      { error: "Hubo demasiados pedidos seguidos. Esperá quince minutos y probá de nuevo." },
      { status: 429 },
    );
  }

  const parsed = Cuerpo.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ese correo no parece válido." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  /* El tope por correo contesta como si hubiera salido: no le dice a nadie que
     ese correo existe ni que alguien lo está pidiendo. */
  const porCorreo = await tomarTurno(`olvide:${email}`, 60 * 60, 3);
  if (!porCorreo.permitido) return NextResponse.json(LISTO);

  const pedido = await pedirRecuperacion(email, new Date());
  if (pedido) {
    const direccion = `${SITIO}/entrar/nueva-clave?t=${pedido.enlace}`;
    const { asunto, texto } = correoDeRecuperacion(direccion);
    const salio = await correo.enviar({ canal: "correo", destino: pedido.email, asunto, texto });
    /* ⚠ Al registro va QUE falló, nunca la dirección ni el enlace. */
    if (!salio.entregado) {
      console.error("[recuperacion] ✗ no salió el correo ·", salio.detalle ?? "sin detalle");
    }
  }

  return NextResponse.json(LISTO);
}
