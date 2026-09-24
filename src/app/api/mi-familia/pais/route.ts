import { NextResponse } from "next/server";
import { z } from "zod";
import { hogarDeLaSesion } from "@/lib/sesion";
import { repositorio } from "@/lib/datos";
import { NOMBRE_DEL_PAIS } from "@/lib/paises";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CAMBIAR EL PAÍS DE LA FAMILIA — 20/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **Lo ordenó Edgardo:** *"lógico debe ir dentro de la configuración de la
 *  Familia"*.
 *
 *  🔴 **No es una preferencia de pantalla y por eso no vive en el navegador.**
 *  Esto decide a qué teléfono deriva el sistema cuando algo pasa —incluso en el
 *  aviso que sale solo, de madrugada, cuando no hay nadie mirando— y qué leyes
 *  cita el producto. Un teléfono que no atiende, dado en el peor momento, es el
 *  peor error que puede cometer AntiGro: no falla ruidosamente como un error de
 *  código, falla en silencio y del otro lado hay alguien esperando.
 *
 *  🔴 **Cambia la familia ENTERA, y con padres separados eso importa.** Son dos
 *  puertas y un solo panel: el país es de la familia, no de la casa desde la que
 *  se entra. Por eso queda registrado como hecho —`cambio_el_pais`— y el otro lo
 *  ve en el registro; que uno pueda hacerlo sin avisar es justo el motivo por el
 *  que tiene que constar.
 *
 *  📌 **Sin tope de frecuencia, a diferencia de la clave.** Acá no hay nada que
 *  adivinar: son dos valores y el que los cambia ya está adentro. Un tope sólo
 *  serviría para trabar a alguien que se equivocó de botón.
 */

export const dynamic = "force-dynamic";

const Cuerpo = z.object({
  /* 🔴 `enum` y no `string`: un país que no existe no es un dato raro que se
     corrige después, es una familia a la que el sistema no sabría a quién
     derivar. Se rechaza en la puerta. */
  pais: z.enum(["AR", "ES"]),
});

export async function POST(req: Request) {
  /* 🔐 Comprobada contra la base: ver `src/lib/sesion.ts`. */
  const usuario = await hogarDeLaSesion();
  if (!usuario) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const parsed = Cuerpo.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ese país no está disponible." }, { status: 400 });
  }
  const { pais } = parsed.data;

  const repo = repositorio();
  if (repo.clase !== "supabase") {
    return NextResponse.json(
      {
        error:
          "El sistema está corriendo sin base de datos, así que el cambio no se " +
          "guardaría en ningún lado.",
        sinBase: true,
      },
      { status: 503 },
    );
  }

  await repo.cambiarPaisDeLaFamilia(usuario.familiaId, pais);

  await repo.registrarAcceso({
    familiaId: usuario.familiaId,
    usuarioId: usuario.usuarioId ?? null,
    hogar: usuario.hogar ?? null,
    que: "cambio_el_pais",
    /* 📌 El detalle SÍ va, al revés que en la clave: acá no hay ningún secreto
       y saber a qué país quedó es la mitad de lo que el otro padre necesita
       leer en el registro. */
    detalle: NOMBRE_DEL_PAIS[pais],
  });

  return NextResponse.json({ ok: true, pais });
}
