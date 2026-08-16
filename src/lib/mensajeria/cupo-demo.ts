/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUPO DE LA DEMO — hasta tres Telegram conectados a la vez
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 Para que alguien crea que el sistema entrega de verdad, tiene que llegarle
 *  a su propio teléfono. Por eso el QR: se escanea, se aprieta "Iniciar", y el
 *  aviso llega. Sin instalar nada y sin dar un número.
 *
 *  🔴 **Tres, y no es un número puesto al azar: es el modelo del producto.**
 *  Dos adultos responsables —uno de ellos elegido por el chico— y el chico en
 *  su propio canal. Tres personas escaneando el mismo QR reciben tres textos
 *  distintos, y ahí se ve de un vistazo lo que separa a AntiGro de un control
 *  parental: al chico también se le habla, y no se le habla igual.
 *
 *  🔐 **Y es el tope de seguridad.** El QR queda en una página pública: sin
 *  cupo, cualquiera con un script conecta miles de chats y el bot termina
 *  mandando lo que quiera el que lo encontró. Con tres, el peor caso es que
 *  tres desconocidos vean el mensaje de demostración de una chica inventada.
 *
 *  ⚠ **El visitante NO se convierte en Ana.** Ocupa el lugar de un rol para ver
 *  qué le llegaría a esa persona. La familia sembrada no se toca: si el QR
 *  escribiera dentro de ella, la demo quedaría distinta para el que entra
 *  después, y encima con el canal de una "familia" ocupado por un desconocido.
 */

/** 🔐 El tope. Ver arriba: es el modelo del producto y es el límite de abuso. */
export const CUPO = 3;

/**
 * 🔐 El código que va en el QR.
 *
 * Lleva guion y letras que **el generador de códigos reales nunca emite**
 * (su alfabeto excluye 0/O y 1/I/L justamente para que se dicten sin
 * confusión). Es lo que garantiza que este código público no pueda colisionar
 * jamás con el de una familia real: no es una convención, es imposible.
 */
export const CODIGO_DEMO = "DEMO-ANTIGRO";

/** Se libera solo. Un cupo tomado para siempre es un cupo perdido. */
const VENCE_EN_MS = 30 * 60 * 1000;

export type RolDemo = "madre" | "tia" | "chico";

export const ROLES: { rol: RolDemo; nombre: string; explica: string }[] = [
  { rol: "madre", nombre: "Mariana, la madre", explica: "Adulta responsable" },
  { rol: "tia", nombre: "Carla, la tía", explica: "La adulta que eligió Ana" },
  { rol: "chico", nombre: "Ana, 12 años", explica: "El texto es distinto: es para ella" },
];

export interface CupoTomado {
  chatId: string;
  rol: RolDemo;
  /** El nombre con el que la persona figura en Telegram. Para poder saludarla. */
  nombre: string;
  /** Última señal de vida, en ISO. Lo que corre el vencimiento. */
  visto: string;
}

/**
 * ⚠ Va colgado de `globalThis` y no de una variable de módulo: Next le puede
 * dar a cada ruta su propia copia del módulo, y entonces el webhook conectaría
 * a alguien que la consola nunca ve. Ya pasó una vez en este proyecto.
 */
const almacen = globalThis as unknown as { __cupoAntiGro?: CupoTomado[] };
almacen.__cupoAntiGro ??= [];

function vivos(): CupoTomado[] {
  const limite = Date.now() - VENCE_EN_MS;
  almacen.__cupoAntiGro = (almacen.__cupoAntiGro ?? []).filter(
    (c) => new Date(c.visto).getTime() > limite,
  );
  return almacen.__cupoAntiGro;
}

/** Los conectados ahora mismo, ya sin los vencidos. */
export function conectados(): CupoTomado[] {
  return [...vivos()];
}

export type ResultadoDeCupo =
  | { ok: true; cupo: CupoTomado; yaEstaba: boolean }
  | { ok: false; motivo: "lleno" };

/**
 * Le da un lugar a quien acaba de escanear el QR.
 *
 * Es **idempotente**: si el mismo chat vuelve a apretar "Iniciar" no consume
 * otro cupo, sólo renueva su vencimiento. Sin esto, apretar dos veces —que es
 * lo que hace cualquiera que duda si funcionó— llenaría la demo solo.
 */
export function tomarCupo(chatId: string, nombre: string): ResultadoDeCupo {
  const actuales = vivos();
  const ahora = new Date().toISOString();

  const existente = actuales.find((c) => c.chatId === chatId);
  if (existente) {
    existente.visto = ahora;
    existente.nombre = nombre || existente.nombre;
    return { ok: true, cupo: existente, yaEstaba: true };
  }

  if (actuales.length >= CUPO) return { ok: false, motivo: "lleno" };

  const ocupados = new Set(actuales.map((c) => c.rol));
  const libre = ROLES.find((r) => !ocupados.has(r.rol));
  // No puede pasar mientras CUPO === ROLES.length, pero si alguien cambia uno
  // de los dos números, es mejor negar el cupo que repartir un rol repetido.
  if (!libre) return { ok: false, motivo: "lleno" };

  const cupo: CupoTomado = { chatId, rol: libre.rol, nombre, visto: ahora };
  actuales.push(cupo);
  return { ok: true, cupo, yaEstaba: false };
}

/** Suelta un lugar. Lo usa quien manda "/chau" al bot. */
export function soltarCupo(chatId: string): boolean {
  const antes = vivos().length;
  almacen.__cupoAntiGro = vivos().filter((c) => c.chatId !== chatId);
  return almacen.__cupoAntiGro.length < antes;
}

/** Marca actividad: el que está recibiendo avisos no debería vencer. */
export function renovar(chatId: string): void {
  const cupo = vivos().find((c) => c.chatId === chatId);
  if (cupo) cupo.visto = new Date().toISOString();
}

export function nombreDelRol(rol: RolDemo): string {
  return ROLES.find((r) => r.rol === rol)?.nombre ?? rol;
}

/** Los adultos reciben el texto de los adultos; el chico, el suyo. */
export function esAdulto(rol: RolDemo): boolean {
  return rol !== "chico";
}
