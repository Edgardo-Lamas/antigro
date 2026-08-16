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
  MotivoDeBaja,
  ObservacionDelAdulto,
  Respuesta,
  SenalRegistrada,
} from "./tipos";

export interface AltaDeFamilia {
  nombre: string;
  notas?: string;
  nextdnsProfileId?: string;
  chicos: Omit<Chico, "id" | "familiaId" | "activo" | "creado">[];
  // Un alta nunca crea a alguien ya dado de baja: los campos de la baja no se
  // piden, se completan el día que la haya.
  adultos: Omit<
    AdultoResponsable,
    "id" | "familiaId" | "creado" | "activo" | "bajaEn" | "bajaMotivo"
  >[];
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

  /**
   * Por id, que es como la busca el panel de la familia.
   *
   * 🔴 El id sale de la SESIÓN del adulto, nunca de la dirección ni del cuerpo
   * del pedido. Si viniera del navegador, cambiar un identificador alcanzaría
   * para leer el informe de otro chico.
   */
  familiaPorId(id: string): Promise<FamiliaCompleta | null>;
  listarFamilias(): Promise<Familia[]>;
  cambiarEstado(id: string, activo: boolean): Promise<void>;

  /**
   * Da de baja a un adulto responsable. **Blanda**: ver `AdultoResponsable.activo`.
   *
   * 🔐 Pide la familia además del adulto a propósito. Así el repositorio mismo
   * se niega a tocar a alguien de otra casa, sin depender de que quien llame se
   * haya acordado de comprobarlo.
   *
   * Devuelve cómo quedó el adulto, o `null` si no existe o no es de esa familia.
   */
  darDeBajaAdulto(
    familiaId: string,
    adultoId: string,
    motivo: MotivoDeBaja,
  ): Promise<AdultoResponsable | null>;

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
