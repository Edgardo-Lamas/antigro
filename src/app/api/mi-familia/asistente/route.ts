import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { tomarTurno } from "@/lib/limite";
import { obtenerFuente, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";
import { responderAlAdulto, TURNOS_DE_MEMORIA, type TurnoDelAsistente } from "@/lib/ia";

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
 *  🔴 **Y desde que la charla se guarda, la historia tampoco viene del
 *  navegador: sale de la base.** Antes venía en el pedido, y aunque no podía
 *  fabricar hallazgos, sí permitía inventarle al asistente turnos que nunca
 *  dijo —"vos me dijiste que no era nada"— y arrancar desde ahí. Ahora lo único
 *  que manda el cliente es la pregunta.
 *
 *  📌 Tres verbos: `GET` devuelve la charla guardada, `POST` pregunta, `DELETE`
 *  la borra entera.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Cuántos turnos se traen a la pantalla al abrir el panel.
 *
 * Más que los que ve el modelo (`TURNOS_DE_MEMORIA`), y a propósito: el adulto
 * tiene que poder releer lo que le dijeron hace tres días aunque el asistente
 * ya no lo tenga presente.
 */
const TURNOS_EN_PANTALLA = 60;

const Pedido = z.object({
  pregunta: z.string().trim().min(1).max(2000),
});

/**
 * 🔐 Cuántas preguntas por hora, por adulto.
 *
 * Acá hay sesión, así que esto no está para frenar a un desconocido: está para
 * que una cuenta filtrada, o un bucle escrito sin querer en la pantalla, no
 * pueda gastar sin techo. **El tope no puede molestar a un padre asustado**, que
 * es exactamente el que más va a preguntar y el que menos merece encontrarse
 * una puerta cerrada: treinta preguntas en una hora es más de lo que da una
 * conversación seguida, y el que las llegue a necesitar tiene un problema que
 * no se resuelve con el asistente.
 */
const TOPE_ASISTENTE = 30;
const VENTANA_ASISTENTE_SEG = 60 * 60;

/** La sesión de un adulto responsable, o la razón por la que no hay respuesta. */
async function adultoDeLaSesion() {
  const sesion = await auth();
  const usuario = sesion?.user as
    | { rol?: string; familiaId?: string | null; adultoId?: string | null }
    | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId || !usuario.adultoId) {
    return null;
  }
  return { familiaId: usuario.familiaId, adultoId: usuario.adultoId };
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA CHARLA GUARDADA
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  const yo = await adultoDeLaSesion();
  if (!yo) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  const turnos = await repositorio().charlaDe(yo.familiaId, yo.adultoId, TURNOS_EN_PANTALLA);

  return NextResponse.json({
    turnos: turnos.map((t) => ({
      quien: t.quien,
      texto: t.texto,
      origen: t.origen ?? null,
      causa: t.causa ?? null,
      fecha: t.fecha,
    })),
  });
}

export async function DELETE() {
  const yo = await adultoDeLaSesion();
  if (!yo) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  await repositorio().borrarCharla(yo.familiaId, yo.adultoId);
  return NextResponse.json({ borrada: true });
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA PREGUNTA
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(req: Request) {
  const yo = await adultoDeLaSesion();
  if (!yo) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  const parsed = Pedido.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "parametros_invalidos" }, { status: 400 });
  }

  const turno = await tomarTurno(
    `asistente:${yo.adultoId}`,
    VENTANA_ASISTENTE_SEG,
    TOPE_ASISTENTE,
  );
  if (!turno.permitido) {
    /* ⚠ El texto sale por `texto`, el mismo campo que usa una respuesta normal,
       para que la pantalla lo muestre en el hilo como cualquier otra cosa que
       diga el asistente. Un cartel de error rojo acá dejaría al adulto sin
       saber si el sistema se rompió o si hizo algo mal. */
    return NextResponse.json(
      {
        texto:
          "Estuvimos hablando bastante seguido y necesito un rato. " +
          `Volvé en ${Math.ceil(turno.esperaSeg / 60)} minutos y seguimos.\n\n` +
          "Si es algo que no puede esperar, la Línea 137 atiende las 24 horas.",
        origen: "respaldo",
        causa: "falla",
        motivos: ["Demasiadas preguntas seguidas."],
      },
      { status: 429 },
    );
  }

  const repo = repositorio();
  const datos = await repo.familiaPorId(yo.familiaId);
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

  /* ── Lo que ya se habló, desde la base ── */
  const guardados = await repo.charlaDe(yo.familiaId, yo.adultoId, TURNOS_DE_MEMORIA);
  const historia: TurnoDelAsistente[] = guardados.map((t) => ({
    quien: t.quien,
    texto: t.texto,
  }));

  const preguntadaEn = new Date().toISOString();
  const respuesta = await responderAlAdulto({
    pregunta: parsed.data.pregunta,
    historia,
    chico: { nombre: chico.nombre, edad: chico.edad },
    lectura,
  });

  /* ── Los dos turnos, juntos ──
     🔑 Se guardan recién ahora, después de contestar. Guardar la pregunta
     antes dejaría preguntas colgadas sin respuesta cada vez que se corte una
     llamada al modelo, y el adulto volvería al panel y se encontraría con que
     el asistente lo ignoró. */
  await repo
    .guardarCharla([
      {
        familiaId: yo.familiaId,
        adultoId: yo.adultoId,
        fecha: preguntadaEn,
        quien: "adulto",
        texto: parsed.data.pregunta,
      },
      {
        familiaId: yo.familiaId,
        adultoId: yo.adultoId,
        fecha: new Date().toISOString(),
        quien: "asistente",
        texto: respuesta.texto,
        origen: respuesta.origen === "ia" ? "ia" : "respaldo",
        causa: respuesta.causa,
      },
    ])
    /* Si falla el guardado, el adulto igual tiene que ver su respuesta: la
       charla perdida es un problema, quedarse sin la contestación es peor. */
    .catch(() => undefined);

  return NextResponse.json({
    texto: respuesta.texto,
    /* 🔑 El origen viaja a la pantalla a propósito. Que se vea cuándo contestó
       el modelo y cuándo lo frenó el control es lo que hace verificable la
       promesa, en vez de una frase en un README. */
    origen: respuesta.origen,
    /* 🔴 Y con qué causa: que el control frene es la promesa cumpliéndose, que
       falle la llamada es el sistema caído. Decir la que no fue sería inventar
       —y encima colgarse un mérito que no hubo. */
    causa: respuesta.causa ?? null,
    motivos: respuesta.motivos ?? null,
  });
}
