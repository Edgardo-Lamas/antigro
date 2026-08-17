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
  TurnoDeCharla,
} from "./tipos";

export interface AltaDeFamilia {
  nombre: string;
  notas?: string;
  /** 🔑 Va por chico: el perfil vive en su dispositivo. Ver `Chico`. */
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

  /* La charla con el asistente */

  /**
   * Guarda los turnos de una charla. Se llama con la pregunta y la respuesta
   * juntas: guardar la pregunta antes de contestar dejaría preguntas colgadas
   * cada vez que se corte una llamada al modelo.
   */
  guardarCharla(turnos: Omit<TurnoDeCharla, "id">[]): Promise<void>;

  /**
   * Los últimos `limite` turnos de la charla de esa familia, en orden
   * cronológico.
   *
   * 🔴 **Es de la FAMILIA, no de cada adulto, y eso cambió el 17/8.** Hasta el
   * 16 cada adulto tenía la suya, con el argumento de que una madre podía
   * preguntarle algo al asistente que todavía no había hablado con el padre.
   * Edgardo lo volteó: *"no puede haber privacidad entre padres, es el hijo,
   * los dos son igual de responsables"*. Y con una sola clave por hogar esa
   * privacidad no existía igual — sostenerla era prometer algo imposible.
   */
  charlaDe(familiaId: string, limite: number): Promise<TurnoDeCharla[]>;

  /**
   * Borra la charla entera de la familia.
   *
   * 🔑 Es un borrado de verdad, no una baja blanda como la de los adultos. La
   * diferencia tiene un porqué: las observaciones son entrada del motor y
   * borrarlas cambiaría lecturas ya hechas; esto no entra a ningún cálculo, es
   * de la familia, y cuando pide que se vaya se tiene que ir.
   */
  borrarCharla(familiaId: string): Promise<void>;
}

/** Ventana de tiempo, en ISO. */
export function dentroDe(fecha: string, desde: string, hasta: string): boolean {
  return fecha >= desde && fecha <= hasta;
}
