import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { tomarTurno } from "@/lib/limite";
import { revisarClaveNueva } from "@/lib/hogares";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CAMBIAR LA CLAVE — no existía en ningún lado, ni antes ni ahora
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Hasta hoy una familia que sospechaba que su clave se había filtrado no tenía
 *  nada que hacer al respecto: la única salida era que alguien tocara la base a
 *  mano. Para la puerta del informe de un chico, eso no alcanza.
 *
 *  🔴 **Cambia la clave de ESTA casa y de ninguna otra.** Con padres separados
 *  la otra puerta no se entera y sigue entrando igual — es exactamente lo que el
 *  recorrido de alta promete cuando dice que *"ninguno puede dejar al otro
 *  afuera cambiando la clave"*. Si esto tocara las dos filas, esa promesa sería
 *  mentira y nadie se enteraría hasta el día que pasara.
 *
 *  🔴 **Exige la clave actual.** Un teléfono desbloqueado sobre la mesa, o una
 *  sesión abierta en una computadora prestada, alcanzarían si no: cambiar la
 *  clave y quedarse con la casa. La sesión prueba que alguien entró alguna vez,
 *  no que sea el dueño ahora.
 */

export const dynamic = "force-dynamic";

/**
 * 🔴 **Cinco por hora, y no es una molestia burocrática: es lo único que frena
 * adivinar la clave actual desde acá.** Sin esto, una sesión robada permite
 * probar claves de a miles contra una ruta que dice si acertó o no.
 */
const VENTANA_SEG = 60 * 60;
const TOPE = 5;

const Cuerpo = z.object({
  actual: z.string().max(200),
  nueva: z.string().max(200),
  repetida: z.string().max(200),
});

type Sesion = {
  rol?: string;
  familiaId?: string | null;
  hogar?: string | null;
  usuarioId?: string | null;
};

export async function POST(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as Sesion | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId || !usuario.usuarioId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  /* 🔑 El tope va por PUERTA y no por familia: con padres separados, que uno se
     equivoque cinco veces no puede dejar trabada a la otra casa. */
  const turno = await tomarTurno(`clave:${usuario.usuarioId}`, VENTANA_SEG, TOPE);
  if (!turno.permitido) {
    return NextResponse.json(
      {
        error: "Probaste varias veces seguidas. Esperá un rato antes de volver a intentar.",
        esperaSeg: turno.esperaSeg,
      },
      { status: 429 },
    );
  }

  const parsed = Cuerpo.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const { actual, nueva, repetida } = parsed.data;

  /* Las reglas de la clave nueva viven en `hogares.ts`, para que el alta y esto
     exijan lo mismo. Con el largo mínimo escrito en dos lados, el día que se
     moviera uno quedaría una puerta más floja que la otra. */
  const problema = revisarClaveNueva(nueva, repetida, actual);
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });

  const repo = repositorio();
  const resultado = await repo.cambiarClave(usuario.familiaId, usuario.usuarioId, actual, nueva);

  if (!resultado.ok) {
    if (resultado.motivo === "clave_actual_no_coincide") {
      return NextResponse.json(
        { error: "La clave de ahora no es ésa.", campo: "actual" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      {
        error:
          "El sistema está corriendo sin base de datos, así que no hay ninguna " +
          "clave que cambiar.",
        sinBase: true,
      },
      { status: 503 },
    );
  }

  await repo.registrarAcceso({
    familiaId: usuario.familiaId,
    usuarioId: usuario.usuarioId,
    hogar: usuario.hogar ?? null,
    que: "cambio_la_clave",
    /* ⚠ Sin detalle, y es a propósito: acá no va nada de la clave. Ni un
       fragmento, ni el largo, ni cuándo era la anterior. */
    detalle: null,
  });

  /* 📌 **La sesión sigue abierta, a propósito.** El que cambia la clave está
     probando que es el dueño de la casa: echarlo de su propio panel sería
     castigarlo por hacer lo correcto. Lo que sí conviene decirle —y lo dice la
     pantalla— es que si la comparte con alguien más, hay que pasarle la nueva. */
  return NextResponse.json({ ok: true });
}
