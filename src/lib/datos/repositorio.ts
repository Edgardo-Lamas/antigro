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
   *
   * 🔴 **`null` cuando nadie aceptó nada, y eso pasa en un caso real: la segunda
   * puerta de padres separados.** Quien la abre no puede aceptar los términos
   * por el otro — marcar esa cuenta como que aceptó sería inventar un
   * consentimiento, exactamente lo que la migración 14 se negó a hacer con las
   * cuentas viejas. Se guarda lo que pasó: nada.
   */
  terminosVersion: string | null;
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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS PUERTAS DE UNA FAMILIA — lo que el panel necesita saber de ellas
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 Una familia tiene una puerta, o dos cuando el chico vive en dos casas. Las
 * reglas de qué se puede hacer con ellas viven en `@/lib/hogares`, sin base y
 * probadas aparte; acá está sólo cómo se leen.
 *
 * 📌 **El correo viaja porque es lo único que identifica una puerta para quien
 * la abrió.** Un progenitor que tipeó mal la dirección de la otra casa no tiene
 * otra forma de darse cuenta, y ese error es el único que se puede corregir.
 */
export interface PuertaDeLaCasa {
  id: string;
  email: string;
  /** Cómo se llama esa casa. `null` cuando la familia tiene una sola. */
  hogar: string | null;
  /**
   * 🔴 **Se pisa, no acumula.** Es un dato, no un historial: contesta «¿la otra
   * casa está participando?» sin dejar reconstruir a qué hora entra nadie. Ver
   * la migración 19 y el porqué en `hogares.ts`.
   */
  ultimoAcceso: string | null;
  creado: string;
}

/** Cómo salió un cambio de clave. Cada motivo se le cuenta distinto al que espera. */
export type ResultadoDeCambioDeClave =
  | { ok: true }
  /** La clave de ahora no es la que escribió. */
  | { ok: false; motivo: "clave_actual_no_coincide" }
  | { ok: false; motivo: "sin_base" };

/**
 * Cómo salió cerrar una puerta.
 *
 * 🔴 `ya_se_uso` **no es un error del sistema, es la regla**: si alguien entró
 * alguna vez por esa puerta, la puerta es de esa casa y no se cierra desde acá.
 * Ver `hogares.ts`.
 */
export type ResultadoDeCierre =
  | { ok: true }
  | { ok: false; motivo: "no_existe" | "ya_se_uso" | "sin_base" };

/** Un hecho fechado de los que sí dejan registro. Ver `QUE_SE_REGISTRA`. */
export interface AccesoRegistrado {
  id: string;
  familiaId: string;
  usuarioId: string | null;
  /** Copiado al momento: si la casa se renombra, lo que pasó siguió pasando desde aquélla. */
  hogar: string | null;
  que: string;
  detalle: string | null;
  fecha: string;
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

  /* ── Las puertas, una vez que la familia ya está adentro ──────────────── */

  /**
   * Las puertas de una familia: una, o dos cuando el chico vive en dos casas.
   *
   * 📌 Nunca devuelve la clave ni su hash, ni siquiera para compararlos afuera.
   * Lo que se compara contra el hash se compara acá adentro (`cambiarClave`).
   */
  puertasDe(familiaId: string): Promise<PuertaDeLaCasa[]>;

  /**
   * Le pone nombre a una casa, o se lo cambia.
   *
   * 🔑 Hace falta el día que se abre la segunda: con una sola casa nadie tuvo
   * que escribir «mi casa» —y está bien—, pero con dos, el nombre es lo único
   * que en el informe distingue quién aportó qué.
   *
   * 🔐 Pide la familia además del usuario a propósito, igual que la baja de un
   * adulto: así el repositorio mismo se niega a tocar la puerta de otra casa.
   */
  renombrarPuerta(familiaId: string, usuarioId: string, hogar: string): Promise<boolean>;

  /**
   * Cambia la clave de una puerta, comprobando la que tenía.
   *
   * 🔴 **Exige la clave actual, y no es un trámite.** Sin eso, cualquiera que
   * agarre una sesión abierta —un teléfono desbloqueado sobre la mesa— se queda
   * con la casa: cambia la clave y los dueños quedan afuera del informe de su
   * propio hijo.
   *
   * 📌 Cambia la de ESA puerta y ninguna otra. Con padres separados, la otra
   * casa no se entera y sigue entrando igual: es lo que el recorrido promete
   * cuando dice que ninguno puede dejar al otro afuera.
   */
  cambiarClave(
    familiaId: string,
    usuarioId: string,
    actual: string,
    nueva: string,
  ): Promise<ResultadoDeCambioDeClave>;

  /**
   * Cierra una puerta **que nadie usó nunca**.
   *
   * 🔴 Existe para un solo caso: el correo mal tipeado al abrir la segunda
   * entrada. La comprobación de que nadie entró la hace el almacenamiento y no
   * quien llama —`ultimo_acceso is null` va en el propio `delete`—, porque si
   * dependiera de una consulta previa, dos pedidos a la vez podrían cerrar una
   * puerta que en el medio alguien estrenó.
   */
  cerrarPuerta(familiaId: string, usuarioId: string): Promise<ResultadoDeCierre>;

  /* ── El registro fechado de lo que hace una casa ──────────────────────── */

  /**
   * Deja constancia de que se abrió sesión con esta credencial.
   *
   * 🔴 **Se pisa: es un dato, no un historial.** Guardar todas las entradas
   * convertiría el panel en vigilancia de una casa sobre la otra, que es lo
   * contrario de para qué existe AntiGro. Ver la migración 19.
   */
  marcarAcceso(usuarioId: string): Promise<void>;

  /**
   * Registra un hecho de los que **no dejan rastro en ningún otro lado**.
   *
   * 🔴 Lo que una casa APORTA o CAMBIA, nunca lo que MIRA. La lista cerrada
   * está en `QUE_SE_REGISTRA` (`@/lib/hogares`) y la base la vuelve a exigir
   * con un `check`: si alguien inventa un hecho nuevo, falla acá y no queda un
   * registro con una palabra que nadie sabe leer.
   */
  registrarAcceso(a: Omit<AccesoRegistrado, "id" | "fecha">): Promise<void>;

  /** Los últimos hechos de esa familia, del más nuevo al más viejo. */
  accesosDe(familiaId: string, limite: number): Promise<AccesoRegistrado[]>;

  /**
   * Sobre cuántos chicos se apoya el observatorio, y cuántos tienen alerta.
   *
   * 🔴 **Existe para que el observatorio pueda DECIR sobre cuánto se apoya en
   * vez de afirmarlo de memoria.** Estaba escrito a mano —«hay una sola familia
   * sembrada»— y eso deja de ser verdad el primer día que alguien se da de alta,
   * sin que nada avise. Un observatorio que informa sin decir sobre cuántos
   * casos se apoya es exactamente lo que la guía del producto denuncia.
   *
   * 📌 No trae ni un identificador: dos números. Es la misma disciplina del
   * módulo — por dominio se guarda cuántos chicos distintos, nunca cuáles.
   */
  universoObservado(): Promise<{ chicos: number; chicosConAlerta: number }>;

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
