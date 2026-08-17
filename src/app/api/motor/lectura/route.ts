import { NextResponse } from "next/server";
import { z } from "zod";
import { FuenteSimulador, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";

/**
 * La lectura del motor, a una altura cualquiera de la historia.
 *
 * 🔑 `dia` es lo que mueve el reloj acelerado: el comienzo de la ventana queda
 * fijo y sólo se corre el final. Eso es lo que permite ver pasar el día 1 sin
 * alerta, el día 5 sin alerta, y que recién más adelante el sistema hable.
 *
 * Con `barrido=1` devuelve los 21 días de una, que es como se verifica que la
 * regla no se dispara antes de tiempo.
 */

export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;

const Params = z.object({
  escenario: z.enum(["normal", "cambio_leve", "persistente", "evasion"]).default("normal"),
  dia: z.coerce.number().int().min(0).max(VENTANA_DIAS - 1).default(VENTANA_DIAS - 1),
  edad: z.coerce.number().int().min(7).max(17).default(12),
  genero: z.enum(["nena", "varon", "otro"]).default("nena"),
  /**
   * 🔑 Corre la hora a partir de la cual la conexión deja de explicarse sola.
   * Sin esto el motor mira sólo la edad, que es lo que hacía antes del 17/8.
   */
  turno: z.enum(["manana", "tarde", "doble", "noche", "no_va"]).optional(),
  chicoId: z.string().default("demo"),
  barrido: z.coerce.boolean().default(false),
  /** Qué contestaron los adultos. Es la segunda entrada del motor. */
  adultos: z.enum(["sin_responder", "bajo", "alto"]).default("sin_responder"),
  /**
   * 📌 Override de los días de historia del perfil. Sin esto se usa el día del
   * reloj: en el día 1 el sistema lleva un día mirando a este chico, no
   * veintiuno. Queda para poder simular un perfil viejo sin fabricar meses.
   */
  observados: z.coerce.number().int().min(0).max(365).optional(),
});

/** Respuestas de ejemplo del cuestionario, para poder mover la segunda entrada. */
const RESPUESTAS: Record<string, Record<string, number>> = {
  sin_responder: {},
  bajo: {
    desconocidos: 1,
    noviazgo_en_juego: 0,
    pedido_de_fotos: 0,
    sabe_que_es_grooming: 3,
    cambio_de_animo: 0,
    esconde_pantalla: 1,
    se_aisla: 0,
    regalos: 0,
    horarios: 1,
  },
  alto: {
    desconocidos: 3,
    noviazgo_en_juego: 2,
    pedido_de_fotos: 2,
    sabe_que_es_grooming: 0,
    cambio_de_animo: 3,
    esconde_pantalla: 2,
    se_aisla: 2,
    regalos: 1,
    horarios: 3,
  },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Params.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", detalle: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  const { escenario, dia, edad, genero, chicoId, barrido, adultos, observados, turno } =
    parsed.data;
  const chico = { edad, genero, turnoEscolar: turno };
  const observaciones = RESPUESTAS[adultos];

  // El comienzo de la historia queda fijo. El reloj sólo corre el final.
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const inicio = new Date(fin.getTime() - (VENTANA_DIAS - 1) * DIA_MS);
  inicio.setHours(0, 0, 0, 0);

  const fuente = new FuenteSimulador(escenario as Escenario);

  const leerHasta = async (n: number) => {
    const hasta = new Date(inicio.getTime() + n * DIA_MS);
    hasta.setHours(23, 59, 59, 999);
    const senales = await fuente.leer({
      chicoId,
      desde: inicio.toISOString(),
      hasta: hasta.toISOString(),
    });
    return { hasta, senales };
  };

  if (barrido) {
    const dias = [];
    for (let n = 0; n < VENTANA_DIAS; n++) {
      const { hasta, senales } = await leerHasta(n);
      // 🔑 En el día n del reloj, el sistema lleva n+1 días mirando a este chico.
      const l = evaluar({ chico, senales, hasta, observaciones, diasObservados: observados ?? n + 1 });
      dias.push({
        dia: n + 1,
        estado: l.estado,
        puntaje: Number(l.puntaje.toFixed(3)),
        diasConSenal: l.diasConSenal,
        diasSostenidos: l.diasSostenidos,
        evasiones: l.evasionesRecientes,
        alcance: Number(l.alcance.valor.toFixed(3)),
        diasDePerfil: l.perfil.diasObservados,
      });
    }
    return NextResponse.json({ escenario, chico, adultos, dias });
  }

  const { hasta, senales } = await leerHasta(dia);
  return NextResponse.json({
    escenario,
    chico,
    dia: dia + 1,
    de: VENTANA_DIAS,
    lectura: evaluar({ chico, senales, hasta, observaciones, diasObservados: observados ?? dia + 1 }),
  });
}
