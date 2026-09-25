import { NextResponse } from "next/server";
import { z } from "zod";
import { repositorio } from "@/lib/datos";
import { revisarClaveNueva } from "@/lib/hogares";
import { deQuienViene, tomarTurno } from "@/lib/limite";
import { usarRecuperacion } from "@/lib/recuperacion-datos";

/**
 * «Olvidé mi contraseña» — usar el enlace y poner la clave nueva (24/9).
 *
 * 🔴 Cambiar la clave por acá corta toda sesión abierta con la anterior
 * (`clave_cambiada_en`): si la clave se recupera porque alguien la robó, esto
 * es lo que lo saca de adentro.
 */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const Cuerpo = z.object({
  enlace: z.string().min(20).max(200),
  nueva: z.string().max(200),
  repetida: z.string().max(200),
});

export async function POST(req: Request) {
  const turno = await tomarTurno(`restablecer-ip:${deQuienViene(req)}`, 15 * 60, 10);
  if (!turno.permitido) {
    return NextResponse.json(
      { error: "Hubo demasiados intentos seguidos. Esperá quince minutos y probá de nuevo." },
      { status: 429 },
    );
  }

  const parsed = Cuerpo.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Este enlace no es válido. Pedí uno nuevo." }, { status: 400 });
  }
  const { enlace, nueva, repetida } = parsed.data;

  const problema = revisarClaveNueva(nueva, repetida);
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });

  const puerta = await usarRecuperacion(enlace, nueva, new Date());
  if (!puerta) {
    return NextResponse.json(
      {
        error:
          "Este enlace ya se usó o venció (duran 30 minutos). Pedí uno nuevo desde «¿Olvidaste la contraseña?».",
        vencido: true,
      },
      { status: 410 },
    );
  }

  /* Queda en el registro de la casa, como cualquier cambio de clave: sin
     ningún detalle de la clave. */
  if (puerta.rol === "adulto" && puerta.familiaId) {
    await repositorio().registrarAcceso({
      familiaId: puerta.familiaId,
      usuarioId: puerta.usuarioId,
      hogar: puerta.hogar,
      que: "cambio_la_clave",
      detalle: null,
    });
  }

  return NextResponse.json({ ok: true });
}
