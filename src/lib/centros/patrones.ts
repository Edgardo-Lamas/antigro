/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS PATRONES DE UN CENTRO EDUCATIVO — 23/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **Lo pidió Edgardo: que el centro reciba un aviso cuando algo afecta a su
 *  comunidad.** El caso que lo justifica es el del observatorio —el acosador
 *  «spray and prey» contacta a muchos chicos a la vez—, y un centro educativo es
 *  justamente el lugar donde esos chicos coinciden. Lo que en una casa es un
 *  dato suelto, en una comunidad es un patrón.
 *
 *  🔴 **El centro nunca ve a un alumno.** Recibe un dominio y un número: cuántos
 *  alumnos distintos lo vieron. Nunca quiénes, nunca de qué familia, nunca de
 *  qué curso. Y el centro no hace nada sobre un chico: actúa hacia toda la
 *  comunidad (una charla, un aviso a las familias, el material de INCIBE).
 *
 *  Este módulo es puro a propósito —no toca la base ni la red— para que el
 *  criterio se pueda probar con números a mano (`npm run probar-centros`).
 */

/* ⚠ Rutas relativas con extensión, no el alias `@/`: así este módulo corre con
   node pelado en la tanda de pruebas. Mismo motivo que en `evaluar.ts`. */
import {
  CHICOS_PARA_PERFIL,
  HOMOGENEIDAD_ALTA,
  LIFT_MINIMO,
  analizar,
  type FilaDelObservatorio,
  type Hallazgo,
  type QueEsAfuera,
  type Universo,
} from "../observatorio/index.ts";
import type { SenalDeRed } from "../senales/tipos.ts";

/**
 * 🔴 **Por debajo de esto el centro no recibe NINGÚN aviso**, pase lo que pase.
 * Con tres alumnos en el sistema, «dos de ellos vieron tal sitio» es casi
 * decir quiénes. Es el mismo piso que usa el observatorio para mirar el perfil.
 */
export const ALUMNOS_MINIMOS_EN_EL_CENTRO = CHICOS_PARA_PERFIL;

/**
 * 🔴 **Cuántos alumnos distintos tienen que haber visto el mismo lugar.**
 * Tres, y no dos como el observatorio: el observatorio se lo muestra a quien
 * administra el sistema; esto le llega a una institución que conoce a sus
 * alumnos. Con dos, un docente atento podría adivinar de quiénes se trata.
 */
export const ALUMNOS_MINIMOS_POR_LUGAR = 3;

/**
 * No se le avisa dos veces lo mismo al mismo centro en este plazo. Un aviso que
 * se repite todos los días enseña a no leerlo — la misma regla de `avisar()`.
 */
export const DIAS_SIN_REPETIR = 30;

/** Lo que el cálculo necesita saber de cada alumno. Nada que lo identifique afuera. */
export interface AlumnoObservado {
  chicoId: string;
  edad: number;
  genero: "nena" | "varon";
  /** ¿Tuvo una alerta a los adultos en la ventana? */
  conAlerta: boolean;
}

function banda(edad: number): string {
  if (edad <= 10) return "7-10";
  if (edad <= 13) return "11-13";
  return "14-17";
}

function diaLocal(fechaIso: string): string {
  return fechaIso.slice(0, 10);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DE LAS SEÑALES DE CADA ALUMNO, A LAS FILAS DEL OBSERVATORIO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 **Acá se pierde la identidad, y se pierde a propósito.** Entran señales de
 * chicos con nombre; salen, por dominio, conteos: cuántos chicos distintos,
 * cuántos con alerta, cuándo fue la primera y la última vez, y cuántos por
 * casillero de perfil. Lo que sale de esta función ya no permite volver atrás.
 */
export function filasDelCentro(
  alumnos: AlumnoObservado[],
  senales: SenalDeRed[],
): FilaDelObservatorio[] {
  const porId = new Map(alumnos.map((a) => [a.chicoId, a]));
  const porDominio = new Map<
    string,
    { chicos: Set<string>; primera: string; ultima: string }
  >();

  for (const s of senales) {
    const dominio = s.contexto?.dominio;
    if (typeof dominio !== "string" || !porId.has(s.chicoId)) continue;
    const dia = diaLocal(s.fecha);
    const fila = porDominio.get(dominio);
    if (!fila) {
      porDominio.set(dominio, { chicos: new Set([s.chicoId]), primera: dia, ultima: dia });
    } else {
      fila.chicos.add(s.chicoId);
      if (dia < fila.primera) fila.primera = dia;
      if (dia > fila.ultima) fila.ultima = dia;
    }
  }

  return [...porDominio.entries()].map(([dominio, f]) => {
    const quienes = [...f.chicos].map((id) => porId.get(id)!);
    const porPerfil: Record<string, number> = {};
    for (const a of quienes) {
      const clave = `${banda(a.edad)}|${a.genero}`;
      porPerfil[clave] = (porPerfil[clave] ?? 0) + 1;
    }
    return {
      dominio,
      /* La puerta la vuelve a calcular `analizar`; acá no hace falta. */
      puerta: "desconocida",
      chicosQueLoVieron: quienes.length,
      chicosConAlerta: quienes.filter((a) => a.conAlerta).length,
      primeraVez: f.primera,
      ultimaVez: f.ultima,
      porPerfil,
    };
  });
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CUÁLES MERECEN LLEGARLE AL CENTRO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Más exigente que el observatorio, porque del otro lado hay una
 * institución y no el que administra el sistema.** Un aviso al centro moviliza a
 * una comunidad entera; uno de más le enseña a ignorarlos.
 *
 * Tiene que cumplir las TRES:
 *  1. Que el centro tenga al menos `ALUMNOS_MINIMOS_EN_EL_CENTRO` alumnos.
 *  2. Que el lugar lo hayan visto al menos `ALUMNOS_MINIMOS_POR_LUGAR`.
 *  3. Que haya algo que lo destaque de verdad: que nadie lo reconozca, que su
 *     público sea anormalmente parecido COMPARADO CON EL CENTRO, o que aparezca
 *     bastante más entre los alumnos con alerta — y en ese caso, en al menos
 *     dos con alerta.
 *
 * 📌 **Quedan afuera los lugares donde no se habla con desconocidos** (YouTube,
 * Netflix) y los de mensajería que exigen entregar el contacto (WhatsApp):
 * que media escuela use WhatsApp no es un patrón, es la vida.
 */
export function merecenAviso(
  hallazgos: Hallazgo[],
  universo: Universo,
  /** Dominios cuyo público es angosto COMPARADO CON EL CENTRO. Ver `perfilesAngostos`. */
  angostos: Set<string> = new Set(),
): Hallazgo[] {
  if (universo.chicos < ALUMNOS_MINIMOS_EN_EL_CENTRO) return [];

  return hallazgos.filter((h) => {
    if (h.chicosQueLoVieron < ALUMNOS_MINIMOS_POR_LUGAR) return false;
    if (h.puerta === "sin_contacto" || h.puerta === "requiere_entrega") return false;
    const loDestaca =
      h.fueraDelRadar ||
      (h.perfilDominante !== null && angostos.has(h.dominio)) ||
      (h.lift >= LIFT_MINIMO && h.chicosConAlerta >= 2);
    return loDestaca;
  });
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔴 EL PERFIL ANGOSTO SE MIDE CONTRA EL CENTRO, NO CONTRA EL MUNDO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El observatorio dice «un lugar legítimo tiene público diverso». Vale para el
 * sistema entero, y **en un centro se da vuelta**: en un colegio de primaria
 * solo de niñas, TODOS los alumnos son «nenas de 7 a 10», así que cualquier
 * juego que usen se vería angosto. Avisar por eso sería avisar por la
 * composición del colegio.
 *
 * ➡ Un lugar tiene público angosto cuando su casillero dominante está
 * **sobrerrepresentado respecto del centro**: es mayoría en el lugar y minoría
 * en la escuela (menos de la mitad de los alumnos).
 */
export const PESO_MAXIMO_DEL_CASILLERO_EN_EL_CENTRO = 0.5;

export function perfilesAngostos(
  alumnos: AlumnoObservado[],
  filas: FilaDelObservatorio[],
): Set<string> {
  const enElCentro: Record<string, number> = {};
  for (const a of alumnos) {
    const clave = `${banda(a.edad)}|${a.genero}`;
    enElCentro[clave] = (enElCentro[clave] ?? 0) + 1;
  }
  const angostos = new Set<string>();
  for (const f of filas) {
    if (!f.porPerfil || f.chicosQueLoVieron === 0) continue;
    const [clave, n] = Object.entries(f.porPerfil).reduce((a, b) => (b[1] > a[1] ? b : a));
    const pesoEnElLugar = n / f.chicosQueLoVieron;
    const pesoEnElCentro = (enElCentro[clave] ?? 0) / Math.max(1, alumnos.length);
    if (pesoEnElLugar >= HOMOGENEIDAD_ALTA && pesoEnElCentro < PESO_MAXIMO_DEL_CASILLERO_EN_EL_CENTRO) {
      angostos.add(f.dominio);
    }
  }
  return angostos;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔴 POR QUÉ SE LE SEÑALA, DICHO PARA UN CENTRO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **No se reusa el `porQue` del observatorio, y es a propósito.** Aquél dice,
 * por ejemplo, «aparece 3 veces más entre los chicos con alerta»: está bien
 * para quien administra el sistema, pero a un centro le contaría que en las
 * casas de algunos de esos alumnos ya sonó un aviso. **Eso es información de
 * las familias, y el centro no la recibe.** El criterio puede usarla para
 * decidir; el texto no la nombra nunca.
 */
export function motivosParaElCentro(h: Hallazgo, angosto: boolean): string {
  const motivos: string[] = [];
  if (h.fueraDelRadar) {
    motivos.push(
      h.queEsAfuera
        ? `no es un sitio conocido para el sistema, y la lista de categorización lo da como ${h.queEsAfuera}`
        : "no es un sitio conocido: no lo reconoce el catálogo del sistema ni la lista de categorización",
    );
  }
  if (angosto && h.perfilDominante) {
    motivos.push(
      `casi todos los alumnos que lo consultaron son ${h.perfilDominante}, bastante más de lo que ` +
        "corresponde a la composición del centro",
    );
  }
  if (h.simultaneo) {
    motivos.push("apareció en todos ellos en pocos días");
  }
  if (motivos.length === 0) {
    motivos.push("coincide con otras señales que el sistema está siguiendo, sin identificar a nadie");
  }
  return motivos.join("; ");
}

export interface AvisoParaElCentro {
  hallazgo: Hallazgo;
  /** Ya dicho para el centro. Ver `motivosParaElCentro`. */
  porQue: string;
}

/** El cálculo entero para un centro: de alumnos y señales, a lo que se avisa. */
export function patronesDelCentro(
  alumnos: AlumnoObservado[],
  senales: SenalDeRed[],
  queEsAfuera?: QueEsAfuera,
): { universo: Universo; avisables: AvisoParaElCentro[] } {
  const universo: Universo = {
    chicos: alumnos.length,
    chicosConAlerta: alumnos.filter((a) => a.conAlerta).length,
  };
  const filas = filasDelCentro(alumnos, senales);
  const hallazgos = analizar(filas, universo, queEsAfuera);
  const angostos = perfilesAngostos(alumnos, filas);
  return {
    universo,
    avisables: merecenAviso(hallazgos, universo, angostos).map((h) => ({
      hallazgo: h,
      porQue: motivosParaElCentro(h, angostos.has(h.dominio)),
    })),
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL TEXTO DEL AVISO — determinista, no lo escribe el modelo
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 Mismas razones que la escalada: no hay nada que interpretar, lo dispara un
 * reloj sin que nadie lo pida, y si el modelo se cae el aviso tiene que salir
 * igual.
 *
 * 🔴 **La regla 1 vale acá entera:** el aviso no dice que haya grooming ni que
 * el sitio sea peligroso. Dice qué se observó, por qué se lo señala, y qué NO
 * se sabe. Y termina en lo que el centro puede hacer hacia toda la comunidad,
 * nunca hacia un alumno.
 *
 * 📌 El material que se nombra es de organismos oficiales: AntiGro no produce
 * contenido, lo selecciona y lo acerca.
 */
export function textoDelAviso(opciones: {
  centro: string;
  aviso: AvisoParaElCentro;
  ventanaDias: number;
  /** El recurso de ayuda del país, ya nombrado (ver `comoSeLoNombra`). */
  ayuda: string;
  /** De quién es el material oficial para las familias. */
  material: string;
}): string {
  const { centro, aviso, ventanaDias, ayuda, material } = opciones;
  const h = aviso.hallazgo;
  const lugar = h.nombre && h.nombre !== h.dominio ? `${h.nombre} (${h.dominio})` : h.dominio;

  return [
    `AntiGro · aviso para ${centro}`,
    "",
    `En los últimos ${ventanaDias} días, el mismo sitio apareció en ${h.chicosQueLoVieron} ` +
      `alumnos distintos de su comunidad: ${lugar}.`,
    "",
    `Por qué se señala: ${aviso.porQue}.`,
    "",
    "Esto no identifica a ningún alumno ni a ninguna familia, y no es una conclusión: " +
      "es un patrón que merece atención. El sistema ve qué sitios se consultan, no lo " +
      "que se escribe en ellos.",
    "",
    "Lo que el centro puede hacer, siempre hacia toda la comunidad: recordar a las " +
      `familias cómo actuar, con el material oficial de ${material}, y dónde pedir ayuda: ${ayuda}.`,
  ].join("\n");
}
