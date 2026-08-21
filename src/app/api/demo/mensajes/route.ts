import { NextResponse } from "next/server";
import { z } from "zod";
import { FuenteSimulador, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";
import { redactarLecturaParaAdultos, redactarMensajeAlChico } from "@/lib/ia";
import { deQuienViene, tomarTurno } from "@/lib/limite";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE SALDRÍA — las dos salidas del sistema, en la consola de la home
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  La alerta con contexto a los adultos y la orientación al propio chico, con
 *  el texto que corresponde a su edad. 📌 Acá se ve la separación que sostiene
 *  todo: **el motor decide, la IA escribe, el control revisa.** La respuesta
 *  dice de dónde salió cada texto, y eso se muestra en pantalla.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  🔴 **POR QUÉ ESTA RUTA VUELVE A EXISTIR — 21/8**
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  Vivía en `/api/mensajes` y **la auditoría del 17/8 la borró con un motivo
 *  válido y un dato falso.** El motivo era real y sigue en pie: era un `GET`
 *  público que llamaba a Opus 5 sin sesión y sin límite de frecuencia, así que
 *  *bastaba una etiqueta `img` para gastar en bucle*. El dato falso fue «no la
 *  llamaba nadie»: **la llama `Consola.tsx`, que es la home.**
 *
 *  Resultado: durante cuatro días el botón «Ver el mensaje» pidió una ruta que
 *  devolvía 404 en los cuatro escenarios. Y no rompió nada a la vista porque el
 *  `catch` de la consola se comía el error y dejaba los dos mensajes en «—».
 *  Lo levantó Edgardo probando: *"en cualquier variable el texto que se envía
 *  es el mismo"*. **Era el mismo porque no había ninguno.**
 *
 *  ⚠ **La lección, y es la misma que ya había costado caro con `motivos`:** un
 *  `catch` que no escribe en ningún lado convierte una función rota en una
 *  función silenciosa. Borrar código «que no llama nadie» exige buscar quién
 *  llama, no suponerlo.
 *
 *  ✅ Vuelve con las dos protecciones que la auditoría pedía, y por eso está
 *  bajo `/api/demo/` y no suelta en la raíz:
 *  1. **Es `POST`.** Una etiqueta `img`, un `link` o un prefetch del navegador
 *     no pueden dispararla. Ése era el agujero concreto.
 *  2. **Seis por minuto por IP**, el mismo tope y el mismo mecanismo que
 *     `/api/demo/telegram`. El límite vive en Postgres, no en memoria: en
 *     Vercel cada ruta es una función con su propia memoria.
 *
 *  📌 Sigue siendo pública, y corresponde: la demo ES la home, y pedirle cuenta
 *  a alguien para ver el sistema andando sería justo lo contrario de lo que la
 *  página promete.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

/** Mismo tope y misma ventana que la otra ruta pública de la demo. */
const TOPE_DEMO = 6;
const VENTANA_DEMO_SEG = 60;

const Params = z.object({
  escenario: z.enum(["normal", "cambio_leve", "persistente", "evasion"]).default("persistente"),
  dia: z.coerce.number().int().min(0).max(VENTANA_DIAS - 1).default(VENTANA_DIAS - 1),
  edad: z.coerce.number().int().min(7).max(17).default(12),
  genero: z.enum(["nena", "varon", "otro"]).default("nena"),
  nombre: z.string().max(40).default("Ana"),
});

export async function POST(req: Request) {
  const parsed = Params.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", detalle: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  const { escenario, dia, edad, genero, nombre } = parsed.data;

  /* El límite se cobra antes de escribir nada: lo caro es la llamada al
     modelo, y se hace más abajo. */
  const turno = await tomarTurno(`demo:${deQuienViene(req)}`, VENTANA_DEMO_SEG, TOPE_DEMO);
  if (!turno.permitido) {
    return NextResponse.json(
      {
        error: "demasiado_seguido",
        /* ⚠ Se dice el número, no un «esperá un rato»: quien está mostrando
           esto adelante de gente necesita saber cuánto. */
        esperaSeg: turno.esperaSeg,
      },
      { status: 429 },
    );
  }

  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const inicio = new Date(fin.getTime() - (VENTANA_DIAS - 1) * DIA_MS);
  inicio.setHours(0, 0, 0, 0);
  const hasta = new Date(inicio.getTime() + dia * DIA_MS);
  hasta.setHours(23, 59, 59, 999);

  const senales = await new FuenteSimulador(escenario as Escenario).leer({
    chicoId: "demo",
    desde: inicio.toISOString(),
    hasta: hasta.toISOString(),
  });

  // Ruta de demo: no hay ficha de chico, así que el reloj hace de alta.
  const lectura = evaluar({ chico: { edad, genero }, senales, hasta, diasObservados: dia + 1 });

  const [paraLosAdultos, paraElChico] = await Promise.all([
    redactarLecturaParaAdultos({ nombreDelChico: nombre, edad, lectura }),
    redactarMensajeAlChico({ nombre, edad, genero, estado: lectura.estado }),
  ]);

  return NextResponse.json({
    escenario,
    dia: dia + 1,
    de: VENTANA_DIAS,
    chico: { nombre, edad, genero },
    estado: lectura.estado,
    // Cuando el sistema está en calma no escribe nada, y eso es una respuesta.
    silencio: lectura.estado === "en_calma",
    paraLosAdultos,
    paraElChico,
  });
}
