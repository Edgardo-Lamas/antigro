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
  chicoId: z.string().default("demo"),
  barrido: z.coerce.boolean().default(false),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Params.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", detalle: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  const { escenario, dia, edad, genero, chicoId, barrido } = parsed.data;
  const chico = { edad, genero };

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
      const l = evaluar({ chico, senales, hasta });
      dias.push({
        dia: n + 1,
        estado: l.estado,
        puntaje: Number(l.puntaje.toFixed(3)),
        diasConSenal: l.diasConSenal,
        diasSostenidos: l.diasSostenidos,
        evasiones: l.evasionesRecientes,
      });
    }
    return NextResponse.json({ escenario, chico, dias });
  }

  const { hasta, senales } = await leerHasta(dia);
  return NextResponse.json({
    escenario,
    chico,
    dia: dia + 1,
    de: VENTANA_DIAS,
    lectura: evaluar({ chico, senales, hasta }),
  });
}
