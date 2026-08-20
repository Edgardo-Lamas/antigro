/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS PUERTAS DE LA CASA — la segunda entrada y el cambio de clave
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Acá viven las reglas, sin base y sin pantalla, para que se puedan comprobar
 *  de verdad (`npm run probar-hogares`). Las rutas y el panel las usan; ninguna
 *  de las dos las vuelve a escribir por su cuenta.
 *
 *  🔴 **De qué se trata todo esto.** La credencial de AntiGro es del HOGAR, no
 *  de una persona: un matrimonio es una fila, y padres separados son dos filas
 *  de la MISMA familia con distinto `hogar` — un solo panel, dos puertas.
 *  Edgardo lo cerró el 18/8 con la ley al lado (CCyC 641 inc. b y 654): el
 *  responsable decide si se abre la segunda puerta, y **abierta, no la puede
 *  cerrar**. Así el acceso a cómo está un hijo no se usa como moneda de cambio.
 *
 *  ⚠ Si hay una medida judicial, esa manda. AntiGro no pide sentencias ni las
 *  puede verificar: lo dice y se corre.
 */

/**
 * 🔴 **Ocho, y con un porqué que se puede defender.** Es la puerta al informe de
 * un chico. Cuatro caracteres es una clave que se adivina; pedir mayúsculas,
 * números y símbolos empuja a la gente al papelito pegado en la heladera. La
 * regla que sostiene la puerta es el largo.
 *
 * 📌 Vive acá y no en `/api/alta/hogar`, que es donde estaba: el alta y el
 * cambio de clave tienen que exigir lo mismo. Con el número escrito en dos
 * lados, el día que se mueva uno queda una puerta más floja que la otra.
 */
export const CLAVE_MINIMA = 8;

/**
 * Cuántas puertas puede tener una familia.
 *
 * 🔑 **Dos, porque son dos casas.** No es un límite técnico: es el caso que el
 * producto modela —el chico vive en una casa o en dos— y ponerlo en tres
 * abriría la puerta a repartir la credencial entre abuelos y tíos, que es
 * exactamente lo que el referente resuelve sin dar acceso al informe.
 */
export const PUERTAS_POR_FAMILIA = 2;

/** Lo que entra en el nombre de una casa. Es una etiqueta, no una dirección. */
export const LARGO_MAXIMO_DE_CASA = 60;

/**
 * Una puerta, como la ve el panel.
 *
 * 📌 `ultimoAcceso` es un dato y no un historial: se pisa cada vez. Ver la
 * migración 19 — con padres separados, guardar todas las entradas se convierte
 * en vigilancia de uno sobre el otro, y este producto no puede hacer con los
 * padres lo que promete no hacer con el chico.
 */
export interface Puerta {
  id: string;
  /** Cómo se llama esa casa. `null` cuando la familia tiene una sola. */
  hogar: string | null;
  /** Si es la puerta con la que está abierta esta sesión. */
  esLaMia: boolean;
  /** Cuándo se abrió sesión por última vez, o `null` si nunca se usó. */
  ultimoAcceso: string | null;
  creado: string;
}

/**
 * Cómo se nombra una casa en pantalla.
 *
 * 🔑 **Sin nombre no se inventa uno.** Una familia con una sola casa nunca tuvo
 * que escribir «mi casa», y eso está bien: `hogar` en null es el caso normal,
 * no un dato faltante. Lo que se dice entonces es dónde está parado el que
 * mira, que es verdad y no agrega nada que nadie haya declarado.
 */
export function comoSeLlama(puerta: Puerta): string {
  if (puerta.hogar?.trim()) return puerta.hogar.trim();
  return puerta.esLaMia ? "esta casa" : "la otra casa";
}

/** Si esta familia todavía puede abrir otra puerta. */
export function sePuedeAbrirOtraPuerta(puertas: Puerta[]): boolean {
  return puertas.length < PUERTAS_POR_FAMILIA;
}

/**
 * Si una puerta se puede cerrar, y por qué no cuando no.
 *
 * 🔴 **La regla es de Edgardo y es de fondo: abierta, no se cierra.** Lo único
 * que se admite es corregir un error que todavía no le sirvió a nadie —el
 * correo mal tipeado— y eso se sabe con un solo dato: si alguien entró alguna
 * vez por esa puerta, ya es de la otra casa y no se toca.
 *
 * 🔑 Por eso la migración 19 guarda `ultimo_acceso`. Sin ese dato, un correo con
 * una letra de más quedaba abierto para siempre y sin forma de arreglarlo, y la
 * única salida era pedirle a alguien que tocara la base a mano.
 */
export function porQueNoSePuedeCerrar(puerta: Puerta, puertas: Puerta[]): string | null {
  if (puerta.esLaMia) {
    return "Esta es la puerta con la que estás adentro. Cerrarla te dejaría afuera a vos.";
  }
  if (puertas.length <= 1) {
    return "Es la única puerta de la familia.";
  }
  if (puerta.ultimoAcceso) {
    return (
      "Ya entraron por esta puerta, así que es de esa casa. " +
      "Una entrada abierta no se cierra desde acá."
    );
  }
  return null;
}

/** Atajo legible para la pantalla. */
export function sePuedeCerrar(puerta: Puerta, puertas: Puerta[]): boolean {
  return porQueNoSePuedeCerrar(puerta, puertas) === null;
}

/**
 * Revisa el nombre que se le quiere poner a una casa.
 *
 * Devuelve el motivo del rechazo, o `null` si está bien.
 *
 * 🔴 **Dos casas no se pueden llamar igual**, y no es prolijidad: el nombre de
 * la casa es lo único que en el informe distingue quién aportó qué. Dos «Casa
 * de papá» convierten un hecho comprobado en una adivinanza.
 */
export function revisarNombreDeCasa(nombre: string, puertas: Puerta[]): string | null {
  const limpio = nombre.trim();
  if (limpio.length === 0) return "Ponele un nombre a la casa, para poder distinguirlas.";
  if (limpio.length > LARGO_MAXIMO_DE_CASA) {
    return `El nombre de la casa no puede pasar de ${LARGO_MAXIMO_DE_CASA} caracteres.`;
  }

  const yaEsta = puertas.some(
    (p) => (p.hogar ?? "").trim().toLocaleLowerCase("es") === limpio.toLocaleLowerCase("es"),
  );
  if (yaEsta) return "Ya hay una casa con ese nombre. Las dos tienen que poder distinguirse.";

  return null;
}

/**
 * Revisa una clave nueva.
 *
 * Devuelve el motivo del rechazo, o `null` si está bien.
 *
 * 📌 `actual` se pasa sólo cuando se está cambiando una clave que ya existe. En
 * el alta no hay contra qué comparar.
 */
export function revisarClaveNueva(
  nueva: string,
  repetida: string,
  actual?: string,
): string | null {
  if (nueva.length < CLAVE_MINIMA) {
    return `La clave necesita al menos ${CLAVE_MINIMA} caracteres.`;
  }
  /* ⚠ Se compara antes que la repetición a propósito: si alguien escribió dos
     veces la misma clave vieja, el problema real es que no la cambió, y decirle
     «no coinciden» lo mandaría a buscar un error de tipeo que no existe. */
  if (actual !== undefined && nueva === actual) {
    return "Esa es la clave que ya tenías. Poné una distinta.";
  }
  if (nueva !== repetida) return "Las dos claves no coinciden.";
  return null;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ QUEDA REGISTRADO — y qué no, que es la parte que importa
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Se registra lo que una casa APORTA o CAMBIA, nunca lo que MIRA.** Abrir
 * el informe, leer al asistente o mirar la línea de tiempo no deja rastro, y es
 * una decisión, no un olvido: con padres separados un historial de lecturas deja
 * de ser un registro y pasa a ser vigilancia entre ellos. AntiGro no puede
 * hacerles a los padres lo que promete no hacerle al chico.
 *
 * 📌 **El cuestionario no está en esta lista** aunque sea un aporte: ya firma en
 * `observaciones`, se muestra en el panel y entra al motor. Contarlo dos veces
 * haría que el panel diga una cosa y el informe otra.
 */
export const QUE_SE_REGISTRA = [
  "abrio_la_segunda_puerta",
  "cerro_una_puerta",
  "cambio_la_clave",
  "dio_de_baja_un_adulto",
  "borro_la_charla",
] as const;

export type QueSeRegistra = (typeof QUE_SE_REGISTRA)[number];

/**
 * Cómo se lee cada hecho en pantalla.
 *
 * 🔑 Se escriben en pasado y sin sujeto —«se abrió», no «abriste»— porque el
 * sistema **no sabe cuál de los dos padres lo hizo**: sabe desde qué casa. El
 * sujeto lo pone la casa, que va al lado y consta.
 */
export const COMO_SE_LEE: Record<QueSeRegistra, string> = {
  abrio_la_segunda_puerta: "Se abrió la entrada de la otra casa",
  cerro_una_puerta: "Se cerró una entrada que nadie había usado",
  cambio_la_clave: "Se cambió la clave de esta casa",
  dio_de_baja_un_adulto: "Se dio de baja a un adulto",
  borro_la_charla: "Se borró la charla con el asistente",
};
