import { NextResponse } from "next/server";
import { z } from "zod";
import { FuenteSimulador, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";
import { redactarLecturaParaAdultos, redactarMensajeAlChico } from "@/lib/ia";

/**
 * Las dos salidas del sistema: la alerta con contexto a los adultos y la
 * orientación al propio chico, con el texto que corresponde a su edad.
 *
 * 📌 Acá se ve la separación que sostiene todo: el motor decide, la IA
 * escribe, el control revisa. La respuesta dice de dónde salió cada texto.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

const Params = z.object({
  escenario: z.enum(["normal", "cambio_leve", "persistente", "evasion"]).default("persistente"),
  dia: z.coerce.number().int().min(0).max(VENTANA_DIAS - 1).default(VENTANA_DIAS - 1),
  edad: z.coerce.number().int().min(7).max(17).default(12),
  genero: z.enum(["nena", "varon", "otro"]).default("nena"),
  nombre: z.string().max(40).default("Ana"),
});

export async function GET(req: Request) {
  const parsed = Params.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", detalle: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  const { escenario, dia, edad, genero, nombre } = parsed.data;

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

  const lectura = evaluar({ chico: { edad, genero }, senales, hasta });

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
