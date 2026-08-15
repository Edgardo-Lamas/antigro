/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MODELO DE DATOS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Todo lo demás cuelga de acá. El cuestionario del adulto no se puede escribir
 *  antes que esto: su forma depende de qué se guarda por chico.
 *
 *  🔴 Acá no se guarda contenido de conversaciones. Lo que se guarda es: quién
 *  es cada uno, por dónde se le escribe, qué señales llegaron y qué dijo el
 *  sistema. Nada de lo que el chico escribió.
 */

import type { SenalDeRed } from "@/lib/senales/tipos";

/* ── Canales ─────────────────────────────────────────────────────────────── */

export type CanalTipo = "telegram" | "correo" | "whatsapp";

export const CANALES: { tipo: CanalTipo; nombre: string; conectable: boolean }[] = [
  { tipo: "telegram", nombre: "Telegram", conectable: true },
  { tipo: "correo", nombre: "Correo", conectable: true },
  // WhatsApp saliente hacia alguien que no escribió primero exige la API
  // oficial de Meta con plantillas aprobadas. Queda como opción del panel,
  // lista para conectar, pero no se puede prometer que sale.
  { tipo: "whatsapp", nombre: "WhatsApp", conectable: false },
];

export interface Canal {
  tipo: CanalTipo;
  /**
   * A dónde va el mensaje. En correo es la dirección y se carga en el alta.
   * En Telegram es el `chat_id`, y **no se puede cargar a mano**: sólo aparece
   * cuando la persona le da "Iniciar" al bot. Hasta entonces va vacío.
   */
  destino: string;
  /**
   * 🔑 El código de vinculación. Es lo que hace que una familia no tenga que
   * crear ningún bot ni generar ninguna clave: el sistema tiene UN bot, y cada
   * persona se conecta apretando "Iniciar" una vez.
   */
  codigo?: string;
  /** Cuándo quedó conectado, en ISO. */
  vinculado?: string;
}

export function canalConectable(tipo: CanalTipo): boolean {
  return CANALES.find((c) => c.tipo === tipo)?.conectable ?? false;
}

/** Telegram exige que la persona apriete "Iniciar" primero. El correo no. */
export function exigeVinculacion(tipo: CanalTipo): boolean {
  return tipo === "telegram" || tipo === "whatsapp";
}

/** ¿Se le puede escribir a esta persona hoy? */
export function canalListo(canal: Canal): boolean {
  return canal.destino.trim().length > 0;
}

/**
 * Códigos cortos y sin caracteres que se confundan al dictarlos por teléfono:
 * sin 0/O, sin 1/I/L. Se leen en voz alta sin que nadie tenga que deletrear.
 */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarCodigo(largo = 6): string {
  const bytes = new Uint8Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

/* ── Familia ─────────────────────────────────────────────────────────────── */

export interface Familia {
  id: string;
  nombre: string;
  /** El enlace privado por el que los adultos entran sin cuenta. */
  token: string;
  activo: boolean;
  /** Se completa el día que haya un NextDNS real. Hasta entonces, simulador. */
  nextdnsProfileId?: string;
  notas?: string;
  creado: string;
}

/* ── El chico ────────────────────────────────────────────────────────────── */

/**
 * 🔴 `edad` y `genero` son datos del motor, no adornos: cambian el peso de las
 * señales y cambian el texto del mensaje.
 *
 * ⚠ Guardarraíl de género: se diferencia sólo **qué tipo de riesgo se
 * enfatiza**, y sólo donde hay dato que lo respalde (el 80% de las víctimas de
 * acoso virtual son nenas). El tono y el respeto son iguales para todos.
 */
export type Genero = "nena" | "varon" | "otro";

export const EDAD_MINIMA = 7;
export const EDAD_MAXIMA = 17;

export interface Chico {
  id: string;
  familiaId: string;
  nombre: string;
  edad: number;
  genero: Genero;
  /** El canal del chico, separado del de los adultos. */
  canal: Canal;
  activo: boolean;
  creado: string;
}

/* ── Los adultos responsables ────────────────────────────────────────────── */

export type Vinculo = "madre" | "padre" | "tia_tio" | "hermano_a" | "abuelo_a" | "otro";

export const VINCULOS: { id: Vinculo; nombre: string }[] = [
  { id: "madre", nombre: "Madre" },
  { id: "padre", nombre: "Padre" },
  { id: "tia_tio", nombre: "Tía o tío" },
  { id: "hermano_a", nombre: "Hermano o hermana" },
  { id: "abuelo_a", nombre: "Abuelo o abuela" },
  { id: "otro", nombre: "Otro" },
];

/**
 * 🔴 Mínimo dos, y no por redundancia técnica.
 * El 43% de los chicos no habla de estos temas con sus padres: por eso uno de
 * los dos lo elige el chico. Es alguien a quien de verdad le va a escribir.
 */
export const MINIMO_ADULTOS = 2;

export interface AdultoResponsable {
  id: string;
  familiaId: string;
  nombre: string;
  vinculo: Vinculo;
  elegidoPorElChico: boolean;
  canal: Canal;
  creado: string;
}

/* ── Registro fechado ────────────────────────────────────────────────────── */

/** Una señal ya guardada. Sin fecha no se puede medir persistencia. */
export type SenalRegistrada = SenalDeRed;

export type ClaseDeRespuesta = "alerta_adultos" | "orientacion_chico";

/** Lo que el sistema dijo, a quién y por qué. */
export interface Respuesta {
  id: string;
  chicoId: string;
  fecha: string;
  clase: ClaseDeRespuesta;
  canal: CanalTipo;
  destino: string;
  texto: string;
  /**
   * Los ids de las señales que la sostienen. Una alerta sin esto es una
   * afirmación sin respaldo, y el sistema no afirma nada que no pueda mostrar.
   */
  senalesQueLaSostienen: string[];
  entregado: boolean;
}

/**
 * Lo que observan los adultos — la segunda de las tres entradas.
 * Las preguntas se escriben en la fase 2, a partir de los indicadores
 * documentados. Acá queda dónde viven las respuestas.
 */
export interface ObservacionDelAdulto {
  id: string;
  chicoId: string;
  adultoId: string;
  fecha: string;
  /** id del indicador → 0 (nunca) a 3 (seguido). */
  respuestas: Record<string, number>;
}

/* ── La familia entera, como la usa el motor ─────────────────────────────── */

export interface FamiliaCompleta {
  familia: Familia;
  chicos: Chico[];
  adultos: AdultoResponsable[];
}

/** Falta algo para que el sistema pueda trabajar con esta familia. */
export function faltantesDeAlta(f: FamiliaCompleta): string[] {
  const faltantes: string[] = [];
  if (f.chicos.length === 0) faltantes.push("No hay ningún chico cargado.");
  if (f.adultos.length < MINIMO_ADULTOS) {
    faltantes.push(`Hacen falta al menos ${MINIMO_ADULTOS} adultos responsables.`);
  }
  if (f.adultos.length >= MINIMO_ADULTOS && !f.adultos.some((a) => a.elegidoPorElChico)) {
    faltantes.push("Ninguno de los adultos lo eligió el chico.");
  }
  return faltantes;
}
