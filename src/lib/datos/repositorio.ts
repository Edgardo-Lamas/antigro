/**
 * El repositorio: la única puerta al almacenamiento.
 *
 * Mismo criterio que con las señales — el sistema pide datos y no sabe si del
 * otro lado hay Supabase o memoria. Eso es lo que permite que el modo demo
 * ande sin base y siga andando igual el día que la haya.
 */

import type {
  AdultoResponsable,
  Chico,
  Familia,
  FamiliaCompleta,
  ObservacionDelAdulto,
  Respuesta,
  SenalRegistrada,
} from "./tipos";

export interface AltaDeFamilia {
  nombre: string;
  notas?: string;
  nextdnsProfileId?: string;
  chicos: Omit<Chico, "id" | "familiaId" | "activo" | "creado">[];
  adultos: Omit<AdultoResponsable, "id" | "familiaId" | "creado">[];
}

/** A quién quedó conectado un código, para poder confirmárselo. */
export interface Vinculacion {
  quien: "chico" | "adulto";
  nombre: string;
  familiaId: string;
}

export interface Repositorio {
  readonly clase: "supabase" | "memoria";

  /* Familias */
  crearFamilia(alta: AltaDeFamilia): Promise<FamiliaCompleta>;
  familiaPorToken(token: string): Promise<FamiliaCompleta | null>;
  listarFamilias(): Promise<Familia[]>;
  cambiarEstado(id: string, activo: boolean): Promise<void>;

  /**
   * Conecta a una persona con su canal cuando le da "Iniciar" al bot.
   * Devuelve `null` si el código no existe o ya se usó — un código que sirve
   * dos veces deja que cualquiera se meta en el canal de una familia.
   */
  vincularPorCodigo(codigo: string, destino: string): Promise<Vinculacion | null>;

  /* Registro fechado */
  registrarSenales(senales: SenalRegistrada[]): Promise<void>;
  senalesDe(chicoId: string, desde: string, hasta: string): Promise<SenalRegistrada[]>;

  registrarRespuesta(r: Omit<Respuesta, "id">): Promise<Respuesta>;
  respuestasDe(chicoId: string, desde: string, hasta: string): Promise<Respuesta[]>;

  registrarObservacion(o: Omit<ObservacionDelAdulto, "id">): Promise<ObservacionDelAdulto>;
  observacionesDe(chicoId: string, desde: string, hasta: string): Promise<ObservacionDelAdulto[]>;
}

/** Ventana de tiempo, en ISO. */
export function dentroDe(fecha: string, desde: string, hasta: string): boolean {
  return fecha >= desde && fecha <= hasta;
}
