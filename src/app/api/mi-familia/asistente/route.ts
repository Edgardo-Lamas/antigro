import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { obtenerFuente, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";
import { responderAlAdulto, type TurnoDelAsistente } from "@/lib/ia";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ASISTENTE DE LOS ADULTOS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La lectura se vuelve a calcular acá, en el servidor.** El navegador ya
 *  la tiene —la muestra en pantalla— y sería más barato que la mandara en el
 *  pedido. No se hace: quien controla el navegador controlaría entonces qué
 *  "vio" el sistema, y podría hacerle decir al asistente cualquier cosa
 *  poniéndole datos inventados en la boca. Lo que el asistente afirma tiene que
 *  salir del motor, no del cliente.
 *
 *  📌 Lo único que viene del navegador es la pregunta y los turnos anteriores,
 *  que es texto de la propia conversación y no puede fabricar hallazgos.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

const Pedido = z.object({
  pregunta: z.string().trim().min(1).max(2000),
  historia: z
    .array(
      z.object({
        quien: z.enum(["adulto", "asistente"]),
        texto: z.string().max(4000),
      }),
    )
    .max(40)
    .default([]),
});

export async function POST(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string | null } | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const parsed = Pedido.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "parametros_invalidos" }, { status: 400 });
  }

  const repo = repositorio();
  const datos = await repo.familiaPorId(usuario.familiaId);
  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];
  if (!chico) return NextResponse.json({ error: "sin_chico" }, { status: 409 });

  /* ── La lectura, recalculada ── */
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - VENTANA_DIAS * DIA_MS);

  const { fuente } = await obtenerFuente("normal" as Escenario);
  const senales = await fuente.leer({
    chicoId: chico.id,
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  });

  const observaciones = await repo.observacionesDe(
    chico.id,
    desde.toISOString(),
    hasta.toISOString(),
  );

  const juntas: Record<string, number> = {};
  for (const o of observaciones) {
    for (const [indicador, valor] of Object.entries(o.respuestas)) {
      juntas[indicador] = Math.max(juntas[indicador] ?? 0, valor);
    }
  }

  const diasObservados = Math.max(
    1,
    Math.floor((Date.now() - new Date(chico.creado).getTime()) / DIA_MS) + 1,
  );

  const lectura = evaluar({
    chico: { edad: chico.edad, genero: chico.genero },
    senales,
    hasta,
    observaciones: juntas,
    diasObservados,
  });

  const respuesta = await responderAlAdulto({
    pregunta: parsed.data.pregunta,
    historia: parsed.data.historia as TurnoDelAsistente[],
    chico: { nombre: chico.nombre, edad: chico.edad },
    lectura,
  });

  return NextResponse.json({
    texto: respuesta.texto,
    /* 🔑 El origen viaja a la pantalla a propósito. Que se vea cuándo contestó
       el modelo y cuándo lo frenó el control es lo que hace verificable la
       promesa, en vez de una frase en un README. */
    origen: respuesta.origen,
    motivos: respuesta.motivos ?? null,
  });
}
