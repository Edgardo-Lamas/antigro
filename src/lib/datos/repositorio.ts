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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL RECORRIDO DE ALTA — el hogar se crea ANTES que los datos (17/8)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 **Son dos momentos distintos y por eso son dos métodos.** Edgardo describió
 * la secuencia entera: *"accede al enlace, llega al panel de logueo, crea
 * credenciales, y accede al mismo recorrido pero sin pagar. Ve el simulador y
 * luego la carga de datos"*. Primero existe la puerta; después, adentro, se
 * carga quién vive en la casa.
 *
 * 🔴 **Y resuelve el agujero que dejó la auditoría del 17/8.** Hasta hoy el alta
 * creaba la familia, los chicos y los adultos, pero **ninguna cuenta**: una
 * familia dada de alta quedaba afuera de su propio panel. La credencial dejó de
 * ser algo que se siembra a mano.
 *
 * 📌 En producción esto va después del pago. Hoy no se cobra —está decidido— y
 * el recorrido lo dice en pantalla en vez de simular un cobro que no existe.
 */
export interface AltaDeHogar {
  /**
   * 🔴 Con qué entra la casa. **Es del hogar, no de una persona**: los dos
   * progenitores usan la misma. Ver `Hogar` en `tipos.ts`.
   */
  email: string;
  /** En claro. El repositorio la cifra; no viaja ni se guarda así. */
  clave: string;
  /** Cómo se llama esta casa. `null` cuando hay una sola, que es lo normal. */
  hogar?: string | null;
  /**
   * 🔑 A qué familia se suma esta puerta. **Sin esto se crea una familia
   * nueva; con esto se agrega la SEGUNDA casa** de padres separados — un solo
   * panel, dos puertas, y ninguno puede dejar al otro afuera.
   */
  familiaId?: string;
  /** Cómo se llama la familia. Sólo cuando se está creando. */
  nombreDeLaFamilia?: string;
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 🔴 QUÉ VERSIÓN DE LOS TÉRMINOS ACEPTÓ — 18/8, y es obligatorio
   * ───────────────────────────────────────────────────────────────────────────
   *
   * **No es opcional a propósito.** Unos términos que nadie aceptó no cubren
   * nada, y la única parte de ese documento que traslada algo son las
   * declaraciones de quien se da de alta: *"declaro que ejerzo la
   * responsabilidad parental sobre el chico"*. Sin eso guardado con su fecha,
   * queda la afirmación de que alguien aceptó y ninguna forma de mostrarlo.
   *
   * 🔑 **Se guarda la VERSIÓN, no un booleano.** «Aceptó» no dice qué aceptó. Si
   * el texto cambia en septiembre, un `true` de agosto no prueba nada.
   */
  terminosVersion: string;
}

/**
 * Cómo salió el alta de un hogar.
 *
 * 🔴 **El fracaso se nombra, no se tira una excepción genérica.** Cada uno de
 * estos casos se le cuenta distinto al que está del otro lado, y confundirlos
 * es lo que hace que alguien se quede trabado sin saber por qué.
 */
export type ResultadoDeAlta =
  | { ok: true; familia: Familia; usuarioId: string }
  /** Ya hay una cuenta con ese correo. */
  | { ok: false; motivo: "email_tomado" }
  /** Esa casa ya tiene su puerta. Dos claves en un hogar no existen. */
  | { ok: false; motivo: "hogar_ocupado" }
  /**
   * 🔴 Modo demo: sin Supabase no hay dónde guardar una cuenta que sobreviva al
   * próximo pedido. **No se finge que anduvo.** El sistema entero corre sin
   * base y lo dice en pantalla; esto es lo único que de verdad la necesita.
   */
  | { ok: false; motivo: "sin_base" };

/** Lo que se carga adentro del recorrido, ya con la puerta creada. */
export interface DatosDeLaFamilia {
  /** Cómo se llama la familia. Se puede corregir acá. */
  nombre?: string;
  chicos: AltaDeFamilia["chicos"];
  adultos: AltaDeFamilia["adultos"];
}

export interface Repositorio {
  readonly clase: "supabase" | "memoria";

  /* Familias */
  crearFamilia(alta: AltaDeFamilia): Promise<FamiliaCompleta>;
  familiaPorToken(token: string): Promise<FamiliaCompleta | null>;

  /**
   * Crea la puerta de una casa: la familia si no existe, y la credencial.
   * Ver `AltaDeHogar` — es el primer paso del recorrido, antes de los datos.
   */
  crearHogar(alta: AltaDeHogar): Promise<ResultadoDeAlta>;

  /**
   * Carga el chico y los adultos de una familia que ya tiene puerta.
   *
   * 🔴 **Reemplaza lo que había, no acumula.** El recorrido se puede rehacer
   * —alguien se equivoca en la edad y vuelve atrás— y si esto sumara, la
   * segunda pasada dejaría dos chicos. Los adultos que ya estaban se dan de
   * baja blanda, nunca se borran: sus observaciones son entrada del motor.
   */
  cargarDatosDeLaFamilia(familiaId: string, datos: DatosDeLaFamilia): Promise<FamiliaCompleta>;

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
  /**
   * Alguien apretó «Lo vi». Devuelve el aviso que se acusó, o `null` si el
   * token no existe **o ya se usó**.
   *
   * 🔴 De un solo uso, y lo garantiza el almacenamiento y no quien llama: en la
   * demo tres desconocidos escanean el mismo QR, y sin esto uno podría cerrar
   * el aviso de otro.
   */
  marcarAcuse(token: string, cuando: string): Promise<Respuesta | null>;

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
