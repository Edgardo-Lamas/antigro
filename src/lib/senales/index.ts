/**
 * Registro de fuentes de señales.
 *
 * 🔑 Éste es el único lugar del sistema que sabe de dónde salen los datos.
 * El motor pide señales y no pregunta más. Cuando aparezca la cuenta de
 * NextDNS, se completan dos variables de entorno y el sistema cambia de fuente
 * sin que se toque una línea del motor: eso es lo que la fase 0 tenía que dejar
 * resuelto.
 */

import { FuenteNextDNS } from "./nextdns";
import { FuenteSimulador, type Escenario } from "./simulador";
import type { EstadoDeFuente, FuenteDeSenales, IdDeFuente } from "./tipos";

export * from "./tipos";
export { FuenteSimulador, ESCENARIOS } from "./simulador";
export type { Escenario } from "./simulador";
export { FuenteNextDNS } from "./nextdns";

/**
 * Devuelve la fuente que corresponde usar.
 * Prioriza el filtro real; si no está disponible, cae al simulador y lo dice.
 */
export async function obtenerFuente(escenario: Escenario = "normal"): Promise<{
  fuente: FuenteDeSenales;
  estado: EstadoDeFuente;
  /** true cuando estamos mostrando el simulador y no un filtro real. */
  simulada: boolean;
  /** Por qué no se está usando el filtro real, si es el caso. */
  motivo?: string;
}> {
  const real = new FuenteNextDNS();
  const estadoReal = await real.estado();

  if (estadoReal.disponible) {
    return { fuente: real, estado: estadoReal, simulada: false };
  }

  const simulador = new FuenteSimulador(escenario);
  return {
    fuente: simulador,
    estado: await simulador.estado(),
    simulada: true,
    motivo: estadoReal.motivo,
  };
}

/** Estado de todas las fuentes, para mostrarlo en pantalla sin disimular nada. */
export async function estadoDeLasFuentes(
  escenario: Escenario = "normal",
): Promise<{ id: IdDeFuente; nombre: string; estado: EstadoDeFuente }[]> {
  const fuentes: FuenteDeSenales[] = [new FuenteSimulador(escenario), new FuenteNextDNS()];
  return Promise.all(
    fuentes.map(async (f) => ({
      id: f.id,
      nombre: f.nombre,
      estado: await f.estado(),
    })),
  );
}
