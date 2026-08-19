import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canalListo,
  loQueImpideTrabajar,
  repositorio,
  sugerenciasParaLaFamilia,
} from "@/lib/datos";
import { enlaceDeVinculacion } from "@/lib/mensajeria/vinculacion";
import { quienLoVio } from "@/lib/mensajeria/acuse";
import { obtenerFuente, type Escenario } from "@/lib/senales";
import { evaluar, INDICADORES, juntarObservaciones, VENTANA_DIAS } from "@/lib/motor";
import { EDAD_PARA_ELEGIR_REFERENTE, quienEligeAlReferente } from "@/lib/config";

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
 * Quién contestó el cuestionario, para mostrarlo en el panel.
 *
 * 🔴 **Decidido por Edgardo el 18/8: la firma SE MUESTRA.** Y se muestra
 * partida, porque las dos mitades no valen lo mismo — `hogar` lo comprobó el
 * sistema al abrir la sesión, `nombre` es lo que esa persona declaró. La
 * pantalla las dice distinto; acá viajan separadas para que pueda hacerlo.
 *
 * 📌 Una por adulto: la última. Es la misma regla que usa el motor, y si acá
 * apareciera el historial completo el panel contaría una cosa y el informe otra.
 */
function firmasDelCuestionario(
  observaciones: { adultoId: string; hogar?: string | null; fecha: string; respuestas: Record<string, number> }[],
  adultos: { id: string; nombre: string }[],
) {
  const ultimaDeCadaUno = new Map<string, (typeof observaciones)[number]>();
  for (const o of observaciones) {
    const previa = ultimaDeCadaUno.get(o.adultoId);
    if (!previa || o.fecha > previa.fecha) ultimaDeCadaUno.set(o.adultoId, o);
  }

  return [...ultimaDeCadaUno.values()]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((o) => ({
      adultoId: o.adultoId,
      /* Si el adulto se dio de baja, su observación sigue contando —es entrada
         del motor— pero el nombre puede no estar. No se inventa. */
      nombre: adultos.find((a) => a.id === o.adultoId)?.nombre ?? null,
      hogar: o.hogar ?? null,
      fecha: o.fecha,
      respondidas: Object.keys(o.respuestas).length,
    }));
}

export async function GET(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as
    | { rol?: string; familiaId?: string | null; hogar?: string | null; name?: string | null }
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

  /* ── Quién vio el último aviso (19/8) ──
     🔴 Va acá porque el panel es el único lugar donde se puede ver que un
     aviso salió y NADIE lo abrió. Hasta hoy `entregado` decía que Telegram lo
     aceptó, y eso se leía como que alguien lo había visto. */
  const avisos = chico
    ? await repo.respuestasDe(chico.id, ventana.desde, ventana.hasta)
    : [];

  /* ── Lo que contaron los adultos, que es la segunda entrada del motor ── */
  const observaciones = chico
    ? await repo.observacionesDe(chico.id, ventana.desde, ventana.hasta)
    : [];

  const lectura = chico
    ? evaluar({
        chico: { edad: chico.edad, genero: chico.genero },
        senales,
        hasta,
        observaciones: juntarObservaciones(observaciones),
        diasObservados: diasDesdeElAlta(chico.creado),
      })
    : null;

  /* 🔑 Quién elige al referente depende de la edad, y el panel lo dice en voz
     alta: a los 8 lo eligen los padres, a los 14 lo elige el chico. Que esté
     escrito evita que un padre crea que la decisión fue suya cuando no lo era,
     y al revés. */
  const eleccion = chico ? quienEligeAlReferente(chico.edad) : null;

  return NextResponse.json({
    /* 🔴 Ya no viaja un `adultoId`: la sesión es de la CASA, no de una persona.
       Ver `auth.ts`. Lo que sí viaja es cuál de las dos casas, para que el
       panel lo pueda decir cuando los padres están separados. */
    yo: { nombre: usuario.name ?? null, hogar: usuario.hogar ?? null },
    familia: {
      nombre: datos.familia.nombre,
      /* 🔴 Antes acá iban «faltantes» y era una lista de reproches: a un hogar
         con un solo progenitor le decía que estaba incompleto. Ahora son
         sugerencias con su porqué, y lo único que quedó duro es no tener
         chico, que sí impide trabajar. */
      impedimentos: loQueImpideTrabajar(datos),
      sugerencias: sugerenciasParaLaFamilia(datos, EDAD_PARA_ELEGIR_REFERENTE),
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
      /* 🔑 Quién entra al panel y quién no. El referente recibe los avisos y
         sabe que está en el sistema, pero el informe es de los progenitores. */
      rol: a.rol,
      elegidoPorElChico: a.elegidoPorElChico,
      canal: a.canal.tipo,
      vinculado: canalListo(a.canal),
      codigo: a.canal.codigo,
      enlace: a.canal.codigo ? enlaceDeVinculacion(a.canal.codigo) : null,
      /* Los dados de baja siguen viniendo, y la pantalla los muestra aparte:
         que una persona haya estado es parte de la historia de esa familia. */
      activo: a.activo,
      bajaMotivo: a.bajaMotivo ?? null,
      /* 🔴 Ya no existe «soy yo»: con una clave por hogar, la pantalla no sabe
         cuál de los dos padres la está mirando, y no puede inventarlo. Lo que
         sí se protege es que no se den de baja a los dos progenitores — ver
         `/api/mi-familia/adultos/baja`. */
    })),
    lectura,
    /* 🔑 La firma del cuestionario. Va al lado de la lectura y no adentro: la
       lectura es lo que el motor concluye, esto es quién aportó qué. */
    cuestionario: {
      firmas: firmasDelCuestionario(observaciones, datos.adultos),
      deUnTotalDe: INDICADORES.length,
    },
    /* 🔑 Quién vio el aviso. `loVioUnResponsable` es la condición que va a
       frenar la escalada, y se calcula acá para que el panel muestre
       exactamente lo mismo que va a mirar el reloj cuando exista. */
    acuse: quienLoVio(avisos, datos.adultos),
    almacenamiento: repo.clase,
    ventana,
    fuente: { id: fuente.id, nombre: fuente.nombre, simulada, motivo },
    escenario,
    senales,
    actualizado: new Date().toISOString(),
  });
}
