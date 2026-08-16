import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canalListo, faltantesDeAlta, repositorio } from "@/lib/datos";
import { enlaceDeVinculacion } from "@/lib/mensajeria/vinculacion";
import { obtenerFuente, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";
import { quienEligeAlReferente } from "@/lib/config";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE VE UN ADULTO RESPONSABLE EN SU PANEL
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La familia sale de la SESIÓN.** No de la dirección, no del cuerpo del
 *  pedido, no de una cabecera. Si viniera del navegador, cambiar un
 *  identificador alcanzaría para leer el informe del chico de otra casa — y
 *  este es exactamente el sistema donde eso no puede pasar nunca.
 *
 *  📌 A diferencia de `/api/familia/[token]`, acá viene la **lectura del
 *  motor**: qué se vio, qué se sostuvo y si hay algo que decir. Eso es lo que
 *  el padre viene a buscar, y hasta hoy sólo existía en la consola de demo.
 */

export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;
const ESCENARIOS_VALIDOS = ["normal", "cambio_leve", "persistente", "evasion"];

/**
 * Hace cuántos días el sistema observa a este chico.
 *
 * 🔑 Sale del alta, **nunca de las señales**: contar desde la primera señal
 * haría que un chico sin actividad pareciera recién llegado para siempre, y
 * el alcance del perfil quedaría trabado en cero.
 */
function diasDesdeElAlta(creado: string): number {
  const dias = Math.floor((Date.now() - new Date(creado).getTime()) / DIA_MS) + 1;
  return Math.max(1, dias);
}

/**
 * Junta lo que contestaron los adultos en el único mapa que espera el motor.
 *
 * 🔴 **Dos reglas, y las dos tienen un porqué que conviene no perder:**
 *
 * 1. **De cada adulto vale su última respuesta.** El cuestionario se puede
 *    volver a contestar, y lo que dijo alguien hace tres semanas no puede
 *    seguir pesando cuando ya dijo otra cosa.
 *
 * 2. 🔑 **Entre adultos, gana el que vio MÁS.** Si la madre marcó «nunca» y la
 *    tía marcó «seguido», la tía vio algo que la madre no vio — y ese es
 *    exactamente el motivo por el que el sistema exige un segundo adulto
 *    elegido por el chico. Promediar las dos respuestas borraría el único
 *    dato nuevo que hay ahí.
 */
function loQueVieronLosAdultos(
  observaciones: { adultoId: string; fecha: string; respuestas: Record<string, number> }[],
): Record<string, number> {
  const ultimaDeCadaUno = new Map<string, { fecha: string; respuestas: Record<string, number> }>();
  for (const o of observaciones) {
    const previa = ultimaDeCadaUno.get(o.adultoId);
    if (!previa || o.fecha > previa.fecha) {
      ultimaDeCadaUno.set(o.adultoId, { fecha: o.fecha, respuestas: o.respuestas });
    }
  }

  const juntas: Record<string, number> = {};
  for (const { respuestas } of ultimaDeCadaUno.values()) {
    for (const [indicador, valor] of Object.entries(respuestas)) {
      juntas[indicador] = Math.max(juntas[indicador] ?? 0, valor);
    }
  }
  return juntas;
}

export async function GET(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as
    | { rol?: string; familiaId?: string | null; adultoId?: string | null; name?: string | null }
    | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pedido = url.searchParams.get("escenario") ?? "normal";
  const escenario = (ESCENARIOS_VALIDOS.includes(pedido) ? pedido : "normal") as Escenario;

  const repo = repositorio();
  const datos = await repo.familiaPorId(usuario.familiaId);

  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];

  /* ── Las señales, por la interfaz única ── */
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - VENTANA_DIAS * DIA_MS);
  const ventana = { desde: desde.toISOString(), hasta: hasta.toISOString(), dias: VENTANA_DIAS };

  const { fuente, simulada, motivo } = await obtenerFuente(escenario);
  const senales = chico
    ? await fuente.leer({ chicoId: chico.id, desde: ventana.desde, hasta: ventana.hasta })
    : [];

  // Queda registrado con fecha: sin eso no se puede medir persistencia.
  if (senales.length > 0) await repo.registrarSenales(senales);

  /* ── Lo que contaron los adultos, que es la segunda entrada del motor ── */
  const observaciones = chico
    ? await repo.observacionesDe(chico.id, ventana.desde, ventana.hasta)
    : [];

  const lectura = chico
    ? evaluar({
        chico: { edad: chico.edad, genero: chico.genero },
        senales,
        hasta,
        observaciones: loQueVieronLosAdultos(observaciones),
        diasObservados: diasDesdeElAlta(chico.creado),
      })
    : null;

  /* 🔑 Quién elige al referente depende de la edad, y el panel lo dice en voz
     alta: a los 8 lo eligen los padres, a los 14 lo elige el chico. Que esté
     escrito evita que un padre crea que la decisión fue suya cuando no lo era,
     y al revés. */
  const eleccion = chico ? quienEligeAlReferente(chico.edad) : null;

  return NextResponse.json({
    yo: { nombre: usuario.name ?? null, adultoId: usuario.adultoId ?? null },
    familia: {
      nombre: datos.familia.nombre,
      faltantes: faltantesDeAlta(datos),
    },
    chico: chico
      ? {
          id: chico.id,
          nombre: chico.nombre,
          edad: chico.edad,
          genero: chico.genero,
          canal: chico.canal.tipo,
          vinculado: canalListo(chico.canal),
          codigo: chico.canal.codigo,
          enlace: chico.canal.codigo ? enlaceDeVinculacion(chico.canal.codigo) : null,
          diasObservado: diasDesdeElAlta(chico.creado),
          quienEligeAlReferente: eleccion,
        }
      : null,
    adultos: datos.adultos.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      vinculo: a.vinculo,
      elegidoPorElChico: a.elegidoPorElChico,
      canal: a.canal.tipo,
      vinculado: canalListo(a.canal),
      codigo: a.canal.codigo,
      enlace: a.canal.codigo ? enlaceDeVinculacion(a.canal.codigo) : null,
      /* Los dados de baja siguen viniendo, y la pantalla los muestra aparte:
         que una persona haya estado es parte de la historia de esa familia. */
      activo: a.activo,
      bajaMotivo: a.bajaMotivo ?? null,
      /** El que está mirando la pantalla: no se puede dar de baja solo. */
      soyYo: a.id === usuario.adultoId,
    })),
    lectura,
    almacenamiento: repo.clase,
    ventana,
    fuente: { id: fuente.id, nombre: fuente.nombre, simulada, motivo },
    escenario,
    senales,
    actualizado: new Date().toISOString(),
  });
}
