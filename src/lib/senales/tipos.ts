/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SEÑALES DE RED — el único contacto del sistema con la actividad del chico.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 Regla 2 del proyecto: NO se lee el contenido de las conversaciones.
 *
 *  Por eso acá no hay —y no va a haber— un campo de mensaje, de texto ni de
 *  destinatario. Una señal dice CUÁNDO pasó algo y de QUÉ tipo era, nunca QUÉ
 *  se dijo. Todo lo que entre por esta puerta pasa por `sanearContexto()`, que
 *  rechaza cualquier intento de colar contenido.
 *
 *  Esta es la interfaz única de la que habla la fase 0: el simulador de hoy y
 *  un NextDNS real de mañana entran por el mismo lugar.
 */

/** Lo que un filtro de red sí puede ver. Nada más que esto. */
export type TipoDeSenal =
  /** Salto marcado de volumen respecto de la propia línea base del chico. */
  | "volumen"
  /** Actividad corrida a la madrugada, en horas donde antes no había. */
  | "madrugada"
  /** Aparece una plataforma nueva o un sitio de chat con desconocidos. */
  | "plataforma_nueva"
  /** 🔑 Intento de saltar el filtro: VPN, proxy, DNS alternativo. La más fuerte. */
  | "evasion";

export const TIPOS_DE_SENAL: TipoDeSenal[] = [
  "volumen",
  "madrugada",
  "plataforma_nueva",
  "evasion",
];

/** Nombre legible de cada tipo, para la lectura en pantalla y las alertas. */
export const NOMBRE_DE_SENAL: Record<TipoDeSenal, string> = {
  volumen: "Salto de volumen",
  madrugada: "Actividad de madrugada",
  plataforma_nueva: "Plataforma nueva",
  evasion: "Intento de saltar el filtro",
};

/**
 * Contexto de una señal: sólo metadatos.
 * Categoría del dominio, franja horaria, cantidad de consultas. Nunca texto.
 */
export type ContextoDeSenal = Record<string, string | number>;

export interface SenalDeRed {
  /** Identificador estable dentro de la fuente que la emitió. */
  id: string;
  /** A qué chico corresponde. */
  chicoId: string;
  /** Cuándo ocurrió, en ISO. Sin fecha no se puede medir persistencia. */
  fecha: string;
  tipo: TipoDeSenal;
  /**
   * 0 a 1 — cuánto se desvía de la línea base **del propio chico**,
   * no de un promedio ajeno. Un chico que siempre usó mucho el teléfono no
   * arranca en rojo.
   */
  intensidad: number;
  /** Metadatos sin contenido. Ver `sanearContexto()`. */
  contexto?: ContextoDeSenal;
  /** Qué fuente la produjo. Queda registrado: el jurado tiene que poder verlo. */
  fuente: IdDeFuente;
}

export type IdDeFuente = "simulador" | "nextdns";

export interface ConsultaDeSenales {
  chicoId: string;
  /** Inicio de la ventana, ISO. */
  desde: string;
  /** Fin de la ventana, ISO. */
  hasta: string;
}

export type EstadoDeFuente =
  | { disponible: true; detalle?: string }
  | { disponible: false; motivo: string };

/**
 * 🔑 LA INTERFAZ ÚNICA.
 * Todo lo que aporte el "cuándo" al motor implementa esto y nada más.
 * El motor no sabe si del otro lado hay un simulador o un filtro real.
 */
export interface FuenteDeSenales {
  readonly id: IdDeFuente;
  readonly nombre: string;
  estado(): Promise<EstadoDeFuente>;
  leer(consulta: ConsultaDeSenales): Promise<SenalDeRed[]>;
}

/* ── Guardarraíl de privacidad ──────────────────────────────────────────── */

/**
 * Claves prohibidas en el contexto de una señal. Si aparece cualquiera de
 * éstas, es que alguien está intentando meter contenido por la puerta de atrás.
 */
const CLAVES_PROHIBIDAS = [
  "mensaje",
  "mensajes",
  "texto",
  "contenido",
  "conversacion",
  "conversación",
  "chat",
  "transcripcion",
  "transcripción",
  "cuerpo",
  "body",
  "message",
  "content",
  "text",
  "payload",
];

export class ContenidoProhibidoError extends Error {
  constructor(clave: string) {
    super(
      `Una señal intentó cargar la clave "${clave}". El sistema no lee el ` +
        `contenido de las conversaciones: el contexto sólo admite metadatos.`,
    );
    this.name = "ContenidoProhibidoError";
  }
}

/**
 * Valida el contexto de una señal antes de que entre al motor.
 * Es a propósito una excepción y no un warning: si esto salta, hay un bug de
 * diseño, no un dato feo.
 */
export function sanearContexto(contexto?: ContextoDeSenal): ContextoDeSenal | undefined {
  if (!contexto) return undefined;

  for (const clave of Object.keys(contexto)) {
    const normalizada = clave.toLowerCase().trim();
    if (CLAVES_PROHIBIDAS.includes(normalizada)) {
      throw new ContenidoProhibidoError(clave);
    }
  }
  return contexto;
}

/** Construye una señal válida, con el contexto ya saneado y la intensidad acotada. */
export function crearSenal(senal: SenalDeRed): SenalDeRed {
  return {
    ...senal,
    intensidad: Math.min(1, Math.max(0, senal.intensidad)),
    contexto: sanearContexto(senal.contexto),
  };
}
