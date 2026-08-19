/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MODELO DE DATOS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Todo lo demás cuelga de acá. El cuestionario del adulto no se puede escribir
 *  antes que esto: su forma depende de qué se guarda por chico.
 *
 *  🔴 De lo que escribió el chico no se guarda una palabra. Lo que se guarda
 *  es: quién es cada uno, por dónde se le escribe, qué señales llegaron y qué
 *  dijo el sistema.
 *
 *  ⚠ Hay UNA excepción y está explicada donde vive: `TurnoDeCharla`, que es un
 *  adulto preguntándole al asistente. No es la conversación del chico y no la
 *  toca.
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
  /**
   * Identificador interno de la familia.
   *
   * ⚠ **Ya no es una puerta.** Nació como «el enlace privado por el que los
   * adultos entran sin cuenta», y esa pantalla se borró en la auditoría del
   * 17/8: entregaba los códigos de vinculación a cualquiera que lo tuviera.
   * Sigue siendo una credencial —con él se piden avisos por `/api/alertas`—,
   * así que no se muestra entero ni se filma.
   */
  token: string;
  activo: boolean;
  notas?: string;
  creado: string;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL HOGAR — la puerta al panel (rediseñado el 17/8)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Una clave por casa, no una por persona.** Lo trajo Edgardo: *"en la
 * práctica los padres no van a aceptar tener cada uno una clave diferente, es
 * decirles que cada uno se maneja por separado"*. Y hay una razón más dura que
 * la fricción: **una clave que los dos conocen no protege nada**, así que
 * prometer que algo es privado entre ellos sería mentir.
 *
 * 🔑 **Padres separados: UN panel con dos puertas.** No dos paneles. Los dos
 * ven exactamente lo mismo; lo único que se duplica es la entrada, para que
 * ninguno pueda dejar al otro afuera cambiando la clave.
 *
 * 📌 `hogar` en `null` **no es un dato faltante**: es la casa única, que es el
 * caso normal. A nadie hay que hacerle escribir «mi casa».
 */
export interface Hogar {
  /** Cómo se llama esa casa. `null` cuando hay una sola. */
  nombre: string | null;
  familiaId: string;
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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL TURNO ESCOLAR — dato del alta, no pregunta del cuestionario (17/8)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Salió de un error del sistema, no de una idea de producto.** El 16/8 el
 * asistente afirmaba que la madrugada «desordena el descanso» del chico, y
 * Edgardo lo volteó: el sistema **no sabe a qué hora se levanta ese chico**.
 * Puede estar de vacaciones o ir al turno tarde. Cerró el hueco él mismo: *"la
 * información debe darle al asistente información del chico, por ejemplo si va
 * al colegio por la mañana, por la tarde"*.
 *
 * 🔑 **Es de otra naturaleza que el cuestionario y conviene no mezclarlos.** El
 * cuestionario es observación periódica —*"¿con qué frecuencia viste X?"*, se
 * vuelve a contestar—. Esto es un dato fijo del chico, como la edad, y por eso
 * vive acá y se carga una sola vez.
 *
 * ⚠ **No mueve ningún peso: mueve la HORA.** Es el mismo mecanismo que ya usa
 * la edad y que ya está probado (`horaDeReferencia` en `pesos.ts`). Atenuar el
 * peso diría "en este chico la madrugada importa menos", que es falso. Correr
 * la hora dice lo que de verdad pasa: **en este chico la madrugada empieza
 * antes o después.**
 */
export type TurnoEscolar = "manana" | "tarde" | "doble" | "noche" | "no_va";

export const TURNOS_ESCOLARES: {
  id: TurnoEscolar;
  nombre: string;
  /** Qué implica para el sistema. Se muestra en el alta: nadie elige a ciegas. */
  detalle: string;
}[] = [
  { id: "manana", nombre: "Mañana", detalle: "Se levanta temprano todos los días." },
  { id: "tarde", nombre: "Tarde", detalle: "Puede dormir más a la mañana." },
  { id: "doble", nombre: "Doble turno", detalle: "Mañana y tarde en el colegio." },
  { id: "noche", nombre: "Noche", detalle: "Cursa de noche y vuelve tarde." },
  { id: "no_va", nombre: "No va al colegio", detalle: "Por ahora no está escolarizado." },
];

export interface Chico {
  id: string;
  familiaId: string;
  nombre: string;
  edad: number;
  genero: Genero;
  /**
   * 🔑 Corre la hora a partir de la cual estar conectado deja de explicarse
   * solo. Ver `TurnoEscolar` acá arriba y `horaDeReferencia` en `pesos.ts`.
   *
   * 📌 Opcional a propósito: las familias dadas de alta antes del recorrido no
   * lo tienen, y no tenerlo no es un dato faltante que haya que reclamar — es
   * el comportamiento de siempre, el que sólo mira la edad.
   */
  turnoEscolar?: TurnoEscolar;
  /** El canal del chico, separado del de los adultos. */
  canal: Canal;
  /**
   * 🔑 **El perfil de NextDNS es del CHICO, y desde el 17/8 no de la familia.**
   *
   * Sale de una pregunta de Edgardo que parecía de otro tema: si el chico vive
   * una quincena en cada casa, ¿qué pasa con el filtro? La respuesta ya estaba
   * resuelta en Red Familiar —por eso ahí se eligió NextDNS sobre Pi-hole—:
   * **el filtro va en el dispositivo del chico, no en el router.** Así viaja
   * con él entre las dos casas, y encima lo sigue viendo en datos móviles, que
   * es donde vive la señal de madrugada.
   *
   * ➡ Si el filtro es del aparato del chico, el perfil es del chico. Colgado de
   * la familia, dos hermanos compartían perfil y sus señales se mezclaban en
   * una sola lectura.
   */
  nextdnsProfileId?: string;
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
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUIÉN ENTRA AL PANEL — decidido el 17/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **El rol no se deduce del parentesco, y por eso es un campo aparte.** Una
 * abuela puede ser la tutora; un padre puede ser el referente que eligió el
 * chico. `vinculo` dice qué es de él; `rol` dice qué puede ver.
 *
 * | | Panel | Avisos | Sabe que existe el sistema |
 * |---|---|---|---|
 * | **Progenitor** | sí | sí | sí |
 * | **Referente** | **no** | sí | sí |
 *
 * 🔴 **El referente queda afuera del panel, y lo marcó Edgardo:** el informe del
 * chico es información privada de los padres. Pero *"el adulto responsable sí
 * debe saber que es parte del sistema"* — no es un contacto de emergencia que
 * se entera el día que suena el teléfono.
 */
export type RolDeAdulto = "progenitor" | "referente";

/**
 * Cuántos adultos hacen que el sistema funcione mejor.
 *
 * 🔴 **Es una sugerencia, no un requisito, y el cambio es del 17/8.** Antes se
 * exigían dos y a la familia que tenía uno el panel le decía que estaba
 * incompleta. Palabras de Edgardo: *"tampoco podemos exigir padres y
 * referentes, siempre sugerimos para que el sistema de protección del chico sea
 * más completo"*.
 *
 * 🔑 Y tiene un fundamento que no cambió: el 43% de los chicos no habla de estos
 * temas con sus padres. Por eso el referente sirve. Pero un hogar con un solo
 * progenitor **no está incompleto: es otra forma de familia**, y decirle que le
 * falta algo es a la vez falso y desalentador.
 */
export const ADULTOS_SUGERIDOS = 2;

/**
 * Por qué se fue un adulto responsable.
 *
 * 🔴 Lo enumeró Edgardo el 16/8 y no es burocracia: «lo cambió el chico» y
 * «perdió el teléfono» son dos hechos distintos, y el primero puede importar —
 * un cambio de referente justo después de un aviso es algo que los otros
 * adultos tienen que poder ver.
 */
export type MotivoDeBaja =
  | "se_mudo"
  | "fallecio"
  | "perdio_el_telefono"
  | "lo_cambio_el_chico"
  | "otro";

export const MOTIVOS_DE_BAJA: { id: MotivoDeBaja; texto: string }[] = [
  { id: "lo_cambio_el_chico", texto: "Lo cambió el chico" },
  { id: "se_mudo", texto: "Se mudó" },
  { id: "perdio_el_telefono", texto: "Perdió el teléfono" },
  { id: "fallecio", texto: "Falleció" },
  { id: "otro", texto: "Otro motivo" },
];

export interface AdultoResponsable {
  id: string;
  familiaId: string;
  nombre: string;
  vinculo: Vinculo;
  /** Qué puede ver. Ver `RolDeAdulto`: no se deduce del `vinculo`. */
  rol: RolDeAdulto;
  elegidoPorElChico: boolean;
  canal: Canal;
  creado: string;

  /**
   * 🔴 **La baja es blanda, nunca un borrado.** Las observaciones que este
   * adulto cargó son entrada del motor: borrarlas cambiaría lecturas que ya se
   * hicieron. Y el sistema tiene que poder decir después que esta persona
   * estuvo.
   */
  activo: boolean;
  bajaEn?: string;
  bajaMotivo?: MotivoDeBaja;
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
  /**
   * 🔴 **`entregado` significa «el transporte lo aceptó», y NADA MÁS.** Telegram
   * contestó `ok`. Si el teléfono está robado, apagado, o el adulto deslizó la
   * notificación sin leerla, esto vale `true` igual. Ese hueco es exactamente
   * el que vienen a tapar los dos campos de abajo.
   */
  entregado: boolean;
  /**
   * El token del botón «Lo vi». De **un solo uso** y atado a ESTA fila.
   *
   * 🔴 Sin eso, en la demo —donde tres desconocidos escanean el mismo QR—
   * cualquiera podría acusar recibo del aviso de otro. Y como cada
   * destinatario tiene su propia fila, el token dice también **quién** apretó,
   * sin que nadie lo declare.
   * 📌 Sólo lo llevan las alertas a los adultos. Ver `acuse.ts`.
   */
  acuseToken?: string | null;
  /** Cuándo apretó «Lo vi». Vacío = no lo apretó, que es un dato en sí mismo. */
  acusadoEn?: string | null;
}

/* ── La charla del adulto con el asistente ───────────────────────────────── */

/**
 * Un turno de la charla entre un adulto responsable y el asistente.
 *
 * 🔴 **Esto SÍ es contenido de una conversación, y hay que decir con todas las
 * letras por qué no contradice la regla 2.** Lo que el sistema nunca lee ni
 * guarda es lo que escribió **el chico**. Esto es otra cosa: lo que un adulto
 * le preguntó al sistema sobre sí mismo y sobre lo que ya le mostró la
 * pantalla, y lo que el sistema le contestó. El chico no escribe acá.
 *
 * 🔑 **Por qué se guarda, aunque sea texto sensible.** Un padre pregunta a las
 * dos de la mañana, cierra el navegador y vuelve al otro día. Si la charla se
 * perdió, vuelve a arrancar de cero la conversación más difícil que va a tener
 * — y encima el asistente ya no se acuerda de lo que le dijo. Perder el hilo
 * ahí no es una molestia de producto: es el momento exacto en que el sistema
 * deja de acompañar.
 *
 * ⚠ **Es del adulto, no de la familia.** Cada cuenta ve la suya. La madre
 * puede escribirle al asistente algo que todavía no habló con el padre, y el
 * informe —que sí ven los dos— no cambia por eso.
 *
 * 🔑 **Y se puede borrar entero, en un toque.** Lo que no se puede borrar es el
 * registro fechado de señales, porque de ahí sale la lectura. Esto no: es del
 * adulto y se va cuando él quiere.
 */
export interface TurnoDeCharla {
  id: string;
  familiaId: string;
  /**
   * Quién lo escribió, cuando se sabe.
   *
   * 🔴 **La charla es de la FAMILIA y no se filtra por esto** — desde el 17/8 no
   * hay nada separado entre padres. Queda como atribución, no como partición:
   * saber quién preguntó puede servir para mostrarlo; decidir quién lo lee, no.
   */
  adultoId?: string;
  fecha: string;
  quien: "adulto" | "asistente";
  texto: string;
  /** Sólo en los turnos del asistente: si lo escribió el modelo o el respaldo. */
  origen?: "ia" | "respaldo";
  /**
   * Y si salió el respaldo, por qué.
   *
   * 🔴 Se guarda para que la pantalla siga diciendo la verdad **después de
   * recargar**. Que el control frene una respuesta es la promesa cumpliéndose;
   * que se caiga la llamada es el sistema caído. Sin esta columna, al volver al
   * otro día las dos se verían iguales y el sistema se estaría colgando un
   * mérito que no tuvo.
   */
  causa?: "control" | "falla";
}

/**
 * Lo que observan los adultos — la segunda de las tres entradas.
 * Las preguntas se escriben en la fase 2, a partir de los indicadores
 * documentados. Acá queda dónde viven las respuestas.
 */
/**
 * Una vuelta del cuestionario: lo que un adulto dijo que ve.
 *
 * 🔴 **Los dos campos que identifican a quién contestó NO valen lo mismo, y la
 * pantalla lo dice con todas las letras (18/8):**
 *
 * - `hogar` es un **HECHO**. Sale de la sesión, y la sesión se abrió con la
 *   credencial de esa casa. El sistema lo comprobó.
 * - `adultoId` es una **DECLARACIÓN**. Es la persona que dijo estar contestando.
 *   Con una clave por hogar, el sistema no puede verificarlo y no lo finge.
 *
 * 🔑 Se guardan los dos porque **la firma se muestra en el panel**, y mostrar
 * una declaración con cara de hecho es justo lo que este producto no hace.
 */
export interface ObservacionDelAdulto {
  id: string;
  chicoId: string;
  /** 📌 DECLARADO por quien contestó. Ver el comentario de arriba. */
  adultoId: string;
  /**
   * 📌 CONSTA: desde qué casa se contestó. `null` es la casa única, que es el
   * caso normal — no un dato faltante.
   */
  hogar?: string | null;
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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE EL SISTEMA SUGIERE — reescrito el 17/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Antes esto se llamaba `faltantesDeAlta` y era una lista de reproches.**
 * A un hogar con un solo progenitor le decía «hacen falta al menos 2 adultos
 * responsables», que es a la vez falso —esa familia no está incompleta— y
 * desalentador. Edgardo lo dio vuelta: *"siempre sugerimos para que el sistema
 * de protección del chico sea más completo"*.
 *
 * 🔴 **Y arregla un cartel que era imposible de apagar.** La regla vieja pedía
 * que algún adulto tuviera la marca «lo eligió el chico». Pero a los 8 años el
 * referente lo eligen los padres —eso está decidido y es correcto—, así que esa
 * marca va en `false` y la familia veía para siempre un faltante que sólo se
 * resolvía haciendo justo lo que el sistema decidió que a esa edad no
 * corresponde. Un cartel que no se puede apagar entrena a ignorar los carteles.
 *
 * 🔑 **Por eso cada sugerencia trae su porqué.** Un consejo sin motivo se lee
 * como una exigencia disfrazada; con el motivo, el que decide no tomarlo
 * decide informado, que es todo lo que el sistema puede pedir.
 */
export interface Sugerencia {
  /** Qué convendría hacer. */
  que: string;
  /** Para qué sirve. Nunca va vacío. */
  porQue: string;
}

/**
 * 🔴 Esto SÍ impide trabajar, y por eso va aparte de las sugerencias: sin chico
 * no hay nada que mirar. Es la única condición que queda dura.
 */
export function loQueImpideTrabajar(f: FamiliaCompleta): string[] {
  return f.chicos.some((c) => c.activo) ? [] : ["No hay ningún chico cargado."];
}

export function sugerenciasParaLaFamilia(
  f: FamiliaCompleta,
  /** Ver `EDAD_PARA_ELEGIR_REFERENTE` en `config.ts`. */
  edadParaElegirReferente: number,
): Sugerencia[] {
  const sugerencias: Sugerencia[] = [];
  const activos = f.adultos.filter((a) => a.activo);
  const progenitores = activos.filter((a) => a.rol === "progenitor");
  const referentes = activos.filter((a) => a.rol === "referente");
  const chico = f.chicos.find((c) => c.activo) ?? f.chicos[0];

  /* Un solo progenitor NO es una falta: es otra forma de familia. Lo que sí
     conviene es que no quede una sola persona sosteniendo todo. */
  if (progenitores.length < ADULTOS_SUGERIDOS && referentes.length === 0) {
    sugerencias.push({
      que: "Sumar un adulto de confianza fuera de la casa.",
      porQue:
        "Recibe los mismos avisos, así no queda una sola persona pendiente. Y si " +
        "alguna vez hace falta que alguien se acerque a hablar con " +
        `${chico?.nombre ?? "el chico"}, hay alguien más a quien recurrir.`,
    });
  }

  /* 🔑 El referente existe en todas las edades. Lo que cambia con la edad es
     quién lo elige — y sólo se puede sugerir que lo elija el chico cuando el
     chico tiene edad de elegir. */
  if (
    referentes.length > 0 &&
    chico &&
    chico.edad >= edadParaElegirReferente &&
    !referentes.some((a) => a.elegidoPorElChico)
  ) {
    sugerencias.push({
      que: `Preguntarle a ${chico.nombre} a quién elegiría.`,
      porQue:
        "El 43% de los chicos no habla de estos temas con sus padres. Un adulto que " +
        "eligió él es alguien a quien de verdad le va a escribir.",
    });
  }

  /* Que el chico no tenga canal no impide trabajar —el motor mira la red—,
     pero deja sin la mitad del producto: la orientación que le llega a él. */
  if (chico && !canalListo(chico.canal)) {
    sugerencias.push({
      que: `Conectar el canal de ${chico.nombre}.`,
      porQue:
        "Sin eso el sistema le avisa a los adultos y a él no. La orientación " +
        "escrita para su edad es la mitad del producto.",
    });
  }

  return sugerencias;
}
