/**
 * Fuente de señales: simulador.
 *
 * No es un reemplazo de los datos reales: es la única forma honesta de mostrar
 * esto. Un sistema de riesgo no se puede demostrar con datos sanos — en una
 * casa donde no pasa nada, el sistema no dice nada, y eso no se filma.
 *
 * El simulador **sólo emite señales**. No decide nada: si hay que alertar o no
 * lo dice el motor (fase 2). Esa separación es lo que hace que el simulador sea
 * una demostración y no un truco.
 *
 * Es determinista a propósito: el mismo escenario, para el mismo chico, da
 * siempre la misma curva. Sin eso no se puede filmar dos veces la misma toma.
 */

import {
  crearSenal,
  type ConsultaDeSenales,
  type EstadoDeFuente,
  type FuenteDeSenales,
  type SenalDeRed,
  type TipoDeSenal,
} from "./tipos";

export type Escenario = "normal" | "cambio_leve" | "persistente" | "evasion";

export const ESCENARIOS: { id: Escenario; nombre: string; descripcion: string }[] = [
  {
    id: "normal",
    nombre: "Semana normal",
    descripcion: "Lo que se ve en la enorme mayoría de las casas. El sistema no dice nada.",
  },
  {
    id: "cambio_leve",
    nombre: "Cambio leve",
    descripcion: "Unos días distintos que después vuelven a lo de siempre. Ruido, no patrón.",
  },
  {
    id: "persistente",
    nombre: "Patrón que persiste",
    descripcion: "El cambio se sostiene y se profundiza semana a semana.",
  },
  {
    id: "evasion",
    nombre: "Intento de saltar el filtro",
    descripcion: "Aparece VPN, proxy o DNS alternativo. Es la señal más fuerte que ve una red.",
  },
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** Generador pseudoaleatorio con semilla — mismo escenario, misma curva. */
function generador(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function semillaDe(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Cuánto se aparta el chico de su propia línea base en el día `dia`
 * (0 = primer día de la ventana). Devuelve 0..1.
 */
function curva(escenario: Escenario, dia: number): number {
  switch (escenario) {
    case "normal":
      return 0.05;

    case "cambio_leve":
      // Sube entre el día 4 y el 8, y vuelve. Nunca se sostiene.
      return dia >= 4 && dia <= 8 ? 0.38 : 0.07;

    case "persistente":
      // Arranca casi imperceptible y se profundiza. Recién sobre el día 15-18
      // el patrón lleva sostenido el tiempo suficiente como para hablar.
      if (dia < 3) return 0.08;
      return Math.min(0.85, 0.12 + (dia - 3) * 0.045);

    case "evasion":
      // Igual que el persistente pero con la evasión encima desde el día 9.
      if (dia < 3) return 0.1;
      return Math.min(0.9, 0.15 + (dia - 3) * 0.05);
  }
}

/** Qué tipos de señal aparecen en cada escenario, según el día. */
function tiposDelDia(escenario: Escenario, dia: number, azar: () => number): TipoDeSenal[] {
  const tipos: TipoDeSenal[] = [];
  const intensidad = curva(escenario, dia);

  if (azar() < 0.25 + intensidad) tipos.push("volumen");
  if (intensidad > 0.2 && azar() < intensidad) tipos.push("madrugada");
  if (intensidad > 0.3 && azar() < intensidad * 0.7) tipos.push("plataforma_nueva");
  if (escenario === "evasion" && dia >= 9 && azar() < 0.55) tipos.push("evasion");

  return tipos;
}

/** Franja horaria plausible para cada tipo. Metadato, no contenido. */
function horaDe(tipo: TipoDeSenal, azar: () => number): number {
  if (tipo === "madrugada") return 1 + Math.floor(azar() * 4); // 01:00 – 04:00
  return 16 + Math.floor(azar() * 7); // 16:00 – 22:00
}

export class FuenteSimulador implements FuenteDeSenales {
  readonly id = "simulador" as const;
  readonly nombre = "Simulador de señales";

  constructor(private escenario: Escenario = "normal") {}

  async estado(): Promise<EstadoDeFuente> {
    return { disponible: true, detalle: `Escenario: ${this.escenario}` };
  }

  /** Cambia el escenario en caliente — es lo que maneja el jurado. */
  usarEscenario(escenario: Escenario) {
    this.escenario = escenario;
  }

  async leer({ chicoId, desde, hasta }: ConsultaDeSenales): Promise<SenalDeRed[]> {
    const inicio = new Date(desde).getTime();
    const fin = new Date(hasta).getTime();
    if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) return [];

    const dias = Math.ceil((fin - inicio) / DIA_MS);
    const senales: SenalDeRed[] = [];

    for (let dia = 0; dia < dias; dia++) {
      const azar = generador(semillaDe(`${chicoId}|${this.escenario}|${dia}`));
      const intensidadBase = curva(this.escenario, dia);

      for (const tipo of tiposDelDia(this.escenario, dia, azar)) {
        const fecha = new Date(inicio + dia * DIA_MS);
        fecha.setHours(horaDe(tipo, azar), Math.floor(azar() * 60), 0, 0);
        if (fecha.getTime() > fin) continue;

        senales.push(
          crearSenal({
            id: `sim-${chicoId}-${dia}-${tipo}`,
            chicoId,
            fecha: fecha.toISOString(),
            tipo,
            // La evasión pesa por sí sola: no se atenúa con la curva.
            intensidad: tipo === "evasion" ? 0.9 : intensidadBase,
            contexto: {
              dia_de_la_ventana: dia,
              hora: fecha.getHours(),
              escenario: this.escenario,
            },
            fuente: this.id,
          }),
        );
      }
    }

    return senales.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}
