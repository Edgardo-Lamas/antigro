/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PERFIL DEL CHICO — lo que el sistema va sabiendo de él
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **La idea es de Edgardo (15/8/2026) y conviene tenerla textual, porque
 *  corrige un error de diseño que estaba en el corazón del motor:**
 *
 *    *"El sistema protege al chico desde el día uno. Pero esa protección se va
 *    desplegando con el tiempo. No es un soldado listo para disparar, es un
 *    sistema que debe analizar, porque el acosador se esconde y sólo podemos
 *    ver/imaginar sus consecuencias."*
 *
 *  🔴 **Qué estaba mal:** el perfil y la ventana de análisis eran la misma cosa.
 *  Todo se calculaba dentro de una caja de 21 días, así que el sistema nunca
 *  conocía al chico más allá de tres semanas — y encima había un
 *  `APRENDIZAJE_DIAS = 14` que prendía y apagaba de golpe. Dos cosas distintas
 *  metidas en una.
 *
 *  Ahora son dos:
 *
 *  - **El perfil** (este archivo) se acumula sobre TODA la historia disponible
 *    y no tiene tope. Es lo que el sistema sabe del chico.
 *  - **La ventana** (`VENTANA_DIAS`, en `evaluar.ts`) es sólo el tramo reciente
 *    que se está evaluando, y sirve para medir persistencia.
 *
 *  🔑 **El perfil olvida a propósito.** Son adolescentes y cambian todo el
 *  tiempo: lo de hace dos meses pesa la mitad que lo de este mes. Un perfil que
 *  no olvida convierte el crecimiento normal en anomalía.
 *
 *  ⚠ **Y hay algo que el perfil no puede resolver, y que se dice en vez de
 *  taparse:** si el chico ya venía siendo acosado cuando el sistema empezó a
 *  mirar, el perfil aprende ese daño como parte de lo habitual. Para eso están
 *  las señales absolutas —que no se comparan contra ningún perfil— y el
 *  cuestionario a los adultos. Ver `advertenciasDelPerfil()`.
 */

import {
  DISPERSION_TOLERADA,
  MEDIA_VIDA_PERFIL_DIAS,
  REGULARIDAD_MINIMA,
  TAU_HISTORIA_DIAS,
} from "./pesos";

/** Un día de la historia del chico, ya reducido a cuánto se apartó de lo suyo. */
export interface DiaDelPerfil {
  /** `YYYY-MM-DD` local. */
  dia: string;
  /** 0 a 1. */
  carga: number;
}

export interface PerfilDelChico {
  /** Cuántos días de historia tiene el sistema sobre este chico. */
  diasObservados: number;
  /** Nivel habitual, con lo reciente pesando más. 0 a 1. */
  nivelHabitual: number;
  /**
   * Cuánto es **impredecible** este chico: lo que queda después de sacarle la
   * tendencia. No es cuánto cambia — un chico que sube todos los días de a poco
   * cambia mucho y es perfectamente predecible.
   */
  variabilidad: number;
  primerDia: string | null;
  ultimoDia: string | null;
}

/**
 * Cuánto alcanzó a desplegarse la lectura, de 0 a 1.
 *
 * 🔴 **No es "cuánta protección hay".** La protección está desde el día uno: las
 * señales absolutas —madrugada y evasión del filtro— no dependen de esto y
 * funcionan siempre. Esto es cuánto pesa lo que se compara **contra la historia
 * del propio chico**, que es lo único que necesita conocerlo primero.
 */
export interface AlcanceDeLaLectura {
  /** 0 a 1. Multiplica a las señales relativas. */
  valor: number;
  /** Cuánto aporta la historia acumulada. */
  porHistoria: number;
  /** Cuánto aporta lo predecible que es este chico. */
  porRegularidad: number;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Hace cuántos días el sistema mira a este chico. **Sale del alta**, que es el
 * único lugar donde ese dato existe de verdad: las señales no lo saben, porque
 * un chico sin desviaciones y un chico que todavía no miramos se ven igual.
 */
export function diasDeObservacion(altaISO: string, hasta: Date): number {
  const alta = new Date(altaISO);
  if (Number.isNaN(alta.getTime())) return 0;
  return Math.max(0, Math.floor((hasta.getTime() - alta.getTime()) / DIA_MS) + 1);
}

/** Peso de un día según su antigüedad. A los 30 días pesa la mitad. */
function pesoPorAntiguedad(diasAtras: number): number {
  return 0.5 ** (Math.max(0, diasAtras) / MEDIA_VIDA_PERFIL_DIAS);
}

/**
 * 🔴 **Variabilidad SIN la tendencia, y ponderada por lo reciente.**
 *
 * Las dos partes importan y por motivos distintos:
 *
 * - **Sin tendencia:** un chico que sube de a poco todos los días cambia mucho
 *   pero es predecible, y la tendencia lo explica entero. Si no se le quita, el
 *   motor lee la propia escalada como "chico errático" y **se vuelve más ciego
 *   cuanto peor es la situación**. Pasó y está medido (15/8/2026).
 * - **Ponderada:** un chico que estuvo revuelto hace tres meses y hoy es
 *   regular no tiene por qué arrastrar eso. Es la parte de "están
 *   permanentemente cambiando".
 */
function variabilidadPonderada(serie: DiaDelPerfil[], pesos: number[]): number {
  const n = serie.length;
  if (n < 3) return 0;

  const sumaP = pesos.reduce((a, b) => a + b, 0);
  if (sumaP === 0) return 0;

  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    const w = pesos[i];
    sx += w * i;
    sy += w * serie[i].carga;
    sxy += w * i * serie[i].carga;
    sxx += w * i * i;
  }

  const den = sumaP * sxx - sx * sx;
  const pendiente = den === 0 ? 0 : (sumaP * sxy - sx * sy) / den;
  const ordenada = (sy - pendiente * sx) / sumaP;

  let residuos = 0;
  for (let i = 0; i < n; i++) {
    residuos += pesos[i] * (serie[i].carga - (ordenada + pendiente * i)) ** 2;
  }
  return Math.sqrt(residuos / sumaP);
}

/**
 * Arma el perfil con **toda** la historia que haya. Sin tope de días: cuanta
 * más historia entre, mejor conoce el sistema al chico.
 *
 * 🔴 **`diasObservados` viene de afuera y NO se deduce de las señales, y esto
 * costó un bug (15/8/2026).** Para una fuente de señales, "este chico no tuvo
 * ninguna desviación" y "a este chico todavía no lo estamos mirando" se ven
 * exactamente igual: en los dos casos no llega nada. Deducirlo de las señales
 * hacía que un chico tranquilo pareciera tener meses de historia el primer día.
 *
 * Lo sabe el alta de la familia, que es donde vive el dato de verdad.
 */
export function construirPerfil(serie: DiaDelPerfil[], diasObservados: number): PerfilDelChico {
  const ordenada = [...serie].sort((a, b) => a.dia.localeCompare(b.dia));

  if (ordenada.length === 0) {
    return {
      diasObservados: Math.max(0, diasObservados),
      nivelHabitual: 0,
      variabilidad: 0,
      primerDia: null,
      ultimoDia: null,
    };
  }

  const ultimo = new Date(`${ordenada[ordenada.length - 1].dia}T00:00:00`);
  const pesos = ordenada.map((d) => {
    const diasAtras = Math.round((ultimo.getTime() - new Date(`${d.dia}T00:00:00`).getTime()) / DIA_MS);
    return pesoPorAntiguedad(diasAtras);
  });

  const sumaP = pesos.reduce((a, b) => a + b, 0);
  const nivelHabitual =
    sumaP === 0 ? 0 : ordenada.reduce((acc, d, i) => acc + pesos[i] * d.carga, 0) / sumaP;

  return {
    diasObservados: Math.max(0, diasObservados),
    nivelHabitual,
    variabilidad: variabilidadPonderada(ordenada, pesos),
    primerDia: ordenada[0].dia,
    ultimoDia: ordenada[ordenada.length - 1].dia,
  };
}

/**
 * 🔑 **Dos chicos con la misma cantidad de días observados pueden tener
 * alcances distintos, y eso es exactamente lo que se buscaba.** Un chico regular
 * se conoce rápido; uno cuya conducta salta todos los días no llega nunca a
 * alcance alto — y está bien que no llegue, porque en ese chico "esto se desvía
 * de lo habitual" significa menos.
 *
 * La curva del tiempo es `1 - e^(-días/τ)`: **no hay ningún día en que algo se
 * prenda.** Empieza en cero y se acerca a uno sin llegar nunca.
 */
export function alcanceDeLaLectura(perfil: PerfilDelChico): AlcanceDeLaLectura {
  const porHistoria = 1 - Math.exp(-Math.max(0, perfil.diasObservados) / TAU_HISTORIA_DIAS);

  const porRegularidad =
    REGULARIDAD_MINIMA +
    (1 - REGULARIDAD_MINIMA) / (1 + perfil.variabilidad / DISPERSION_TOLERADA);

  return { valor: porHistoria * porRegularidad, porHistoria, porRegularidad };
}

/**
 * 🔴 **Lo que el perfil NO puede saber, dicho en voz alta.**
 *
 * De Edgardo, y es el límite honesto del producto: *"a veces no va a llegar,
 * cuando el chico quizá hace meses está siendo acosado"*. Un perfil aprende lo
 * que ve; si lo que ve ya está dañado, aprende el daño como normal.
 *
 * Esto no se resuelve con más matemática. Se dice, y se compensa con las dos
 * vías que no dependen del perfil: las señales absolutas y el cuestionario.
 */
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Una fecha `2026-07-29` dicha como la diría una persona: «29 de julio».
 *
 * ⚠ Se parte el texto a mano en vez de usar `new Date()`: una fecha sin hora se
 * interpreta como medianoche UTC, y en Argentina (-3) eso cae el día anterior.
 * El sistema le estaría diciendo al adulto un día que no es.
 */
function enCriollo(fecha: string): string {
  const [a, m, d] = fecha.slice(0, 10).split("-").map(Number);
  const mes = MESES[m - 1];
  if (!mes || !d) return fecha;
  const hoy = new Date();
  // El año sólo se dice si no es éste: nombrarlo siempre suena a expediente.
  return a === hoy.getFullYear() ? `${d} de ${mes}` : `${d} de ${mes} de ${a}`;
}

/**
 * 🔴 **Desde cuándo lo mira, contado desde el ALTA y no desde la primera señal.**
 *
 * Es el mismo error que `diasObservados` ya tenía y que corrigió Edgardo el
 * 15/8: `perfil.primerDia` es el primer día en que **llegó algo**, y para un
 * chico tranquilo eso puede ser mucho después del alta. Decir «lo conoce hace
 * 21 días» y en el renglón siguiente nombrar una fecha de hace 18 es
 * contradecirse en la misma lectura.
 */
function desdeCuando(hasta: Date, diasObservados: number): string {
  const d = new Date(hasta.getTime() - (diasObservados - 1) * DIA_MS);
  return enCriollo(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  );
}

export function advertenciasDelPerfil(perfil: PerfilDelChico, hasta: Date): string[] {
  const avisos: string[] = [];

  if (perfil.diasObservados > 0) {
    avisos.push(
      `El sistema conoce a este chico desde el ${desdeCuando(hasta, perfil.diasObservados)}. Si algo venía pasando de ` +
        "antes, puede haberlo aprendido como parte de lo habitual: un perfil aprende lo que ve. " +
        "Por eso hay dos señales que no se comparan contra ninguna historia —la actividad de " +
        "madrugada y los intentos de saltar el filtro— y por eso lo que ven los adultos pesa.",
    );
  }

  if (perfil.diasObservados > 0 && perfil.variabilidad > DISPERSION_TOLERADA) {
    avisos.push(
      "La conducta de este chico es poco predecible incluso descontando cómo viene cambiando. " +
        "En un chico así, decir «esto se desvía de lo habitual» significa menos, y el sistema " +
        "lo tiene en cuenta en vez de disimularlo.",
    );
  }

  return avisos;
}
