/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL MODUS OPERANDI — mirar al acosador, no sólo al chico
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **De Edgardo, 15/8/2026:** *"estamos mirando de entender el perfil de los
 *  chicos, pero también deberíamos saber cómo actúan estos depredadores; eso nos
 *  va a permitir anticipar medidas. Los dos lugares debemos analizar y convertir
 *  a AntiGro en un agente sabueso."*
 *
 *  🔴 **Y cambia lo que el sistema es.** Hasta acá AntiGro miraba **cambios en
 *  el chico**: se conecta distinto, a otra hora, en otro lado. Eso es mirar la
 *  sombra. Mirar el proceso es otra cosa: el grooming **no es un evento, es una
 *  secuencia con etapas**, y una secuencia se puede reconocer a mitad de camino.
 *  Ahí está el "anticipar" que pedía Edgardo.
 *
 *  ─── 📊 El modelo, que no lo inventamos nosotros ───────────────────────────
 *
 *  **Sexual Grooming Model (SGM)** — Winters & Jeglic, 2017; ampliado con una
 *  quinta etapa por Winters y col., 2020. Es un modelo con **validez de
 *  contenido establecida por un panel de expertos**, y describe **77 conductas**
 *  agrupadas en cinco etapas:
 *
 *    1. Selección de la víctima
 *    2. Obtener acceso y aislarla
 *    3. Desarrollo de la confianza
 *    4. Desensibilización al contenido y al contacto sexual
 *    5. Mantenimiento posterior al abuso
 *
 *  Sobre el modelo se construyó además la *Sexual Grooming Scale – Victim
 *  Version*, puesta a prueba con 115 víctimas adultas.
 *  https://www.tandfonline.com/doi/full/10.1080/15564886.2021.1974994
 *
 *  ⚠ **Fuente secundaria: lo leí en las publicaciones de los autores y en
 *  resúmenes, no en el paper original completo.** Está citado con nombre y año
 *  para que se pueda verificar; si va a una publicación o al video, se confirma
 *  antes. En este dominio no somos la fuente.
 *
 *  ─── 🔴 LO QUE ESTE ARCHIVO NO HACE ────────────────────────────────────────
 *
 *  **No diagnostica una etapa.** Un filtro de red no puede saber si hubo
 *  desarrollo de confianza: eso pasa dentro de una conversación que el sistema
 *  no lee y no va a leer. Lo que hace es decir, para cada etapa, **qué huella
 *  dejaría en la red si estuviera ocurriendo** — y, sobre todo, **cuáles no
 *  dejan ninguna**. Nombrar los huecos vale más que taparlos: son el argumento
 *  de por qué hacen falta las otras dos entradas.
 */

import type { TipoDeSenal } from "@/lib/senales/tipos";

export type Etapa =
  | "seleccion"
  | "acceso_aislamiento"
  | "confianza"
  | "desensibilizacion"
  | "mantenimiento";

export interface EtapaDelProceso {
  id: Etapa;
  nombre: string;
  /** Qué hace el acosador en esta etapa, según el modelo. */
  queHace: string;
  /**
   * 🔴 Qué huella dejaría en la red. `null` cuando NO deja ninguna — que es la
   * información más importante de esta tabla.
   */
  huellaEnLaRed: string | null;
  /** Las señales del sistema que podrían corresponder. Vacío si no hay. */
  senales: TipoDeSenal[];
  /** Quién lo ve, si la red no. */
  quienLoVe: string;
}

export const PROCESO: EtapaDelProceso[] = [
  {
    id: "seleccion",
    nombre: "Selección de la víctima",
    queHace:
      "Busca chicos que se muestren solos, aburridos o necesitados de atención, y los busca " +
      "donde puede escribirles sin que nadie se lo autorice: chats abiertos de juegos, " +
      "sugerencias de amistad, mensajes directos de cuentas que el chico no sigue.",
    huellaEnLaRed:
      "Aparición de un lugar de contacto abierto que antes no estaba. Es débil por sí sola: " +
      "que un chico empiece a jugar a algo nuevo es lo más normal del mundo.",
    senales: ["plataforma_nueva"],
    quienLoVe: "La red, apenas. El observatorio lo ve mejor: un lugar cuyo público es imposible.",
  },
  {
    id: "acceso_aislamiento",
    nombre: "Obtener acceso y aislarla",
    queHace:
      "Se lleva la conversación a un canal privado, donde hay menos control y menos testigos. " +
      "Y busca los momentos en que no hay adultos cerca.",
    huellaEnLaRed:
      "🔑 EL CRUCE: de un lugar donde cualquiera podía escribirle a uno que exige que él " +
      "entregue su teléfono o su usuario. Y el corrimiento a horas en que los adultos duermen. " +
      "Es la etapa que MÁS huella deja, y es la única que la red ve bien.",
    senales: ["plataforma_nueva", "madrugada"],
    quienLoVe: "La red. Es su punto fuerte.",
  },
  {
    id: "confianza",
    nombre: "Desarrollo de la confianza",
    queHace:
      "Halaga, escucha, valida lo que el chico siente, se muestra como el único que lo entiende. " +
      "Puede hacer regalos: monedas del juego, tarjetas, dinero. Puede llevar semanas o meses.",
    huellaEnLaRed:
      "Sólo el volumen sostenido: más actividad, todos los días, durante semanas. No dice de " +
      "qué se habla y no puede decirlo.",
    senales: ["volumen"],
    quienLoVe:
      "Los adultos, y sólo si saben qué mirar. Por eso el cuestionario pregunta por regalos que " +
      "aparecieron sin explicación y por el chico que se aísla: son ESTA etapa, vista desde la casa.",
  },
  {
    id: "desensibilizacion",
    nombre: "Desensibilización sexual",
    queHace:
      "Introduce el tema sexual de a poco, normaliza, pide fotos. Es donde el delito se consuma.",
    /* 🔴 El hueco más grave del producto, escrito y no escondido. */
    huellaEnLaRed: null,
    senales: [],
    quienLoVe:
      "Nadie, desde acá. Pasa dentro de una conversación cifrada que el sistema no lee y no va " +
      "a leer. Sólo el propio chico, o un adulto en el que confíe lo suficiente como para " +
      "contárselo. Es la razón de ser de la regla 3 y de que se le hable también a él.",
  },
  {
    id: "mantenimiento",
    nombre: "Mantenimiento",
    queHace:
      "Sostiene el silencio: amenaza, culpa, o convence al chico de que esconda lo que pasa. " +
      "Acá aparece la necesidad de esquivar cualquier control.",
    huellaEnLaRed:
      "Intentos de saltar el filtro: VPN, proxy, DNS alternativo. Es la señal más fuerte que " +
      "puede ver una red, y la que hoy no mira nadie.",
    senales: ["evasion"],
    quienLoVe: "La red, con claridad. Y es un acto deliberado: no se confunde con crecer.",
  },
];

/**
 * 🔴 **La lectura honesta de la tabla de arriba, en una frase.**
 *
 * De las cinco etapas, la red ve bien **dos** (acceso/aislamiento y
 * mantenimiento), ve mal **dos** (selección y confianza) y **no ve nada** de la
 * quinta, que es donde el delito ocurre.
 *
 * ➡ Eso no es una debilidad a disimular: **es el argumento entero del diseño de
 * tres entradas.** Un producto que dijera que detecta grooming mirando el DNS
 * estaría mintiendo, y bastaría un perito para demostrarlo. Lo que AntiGro puede
 * decir —y sostener— es que reconoce **la forma del proceso** con lo que ve, y
 * que pide ayuda para el resto: a los adultos por el cuestionario, y al propio
 * chico, que es el único que estuvo en la etapa 4.
 */
export function coberturaDelProceso() {
  const ve = PROCESO.filter((e) => e.huellaEnLaRed !== null).length;
  return {
    etapas: PROCESO.length,
    conHuellaEnLaRed: ve,
    ciegas: PROCESO.filter((e) => e.huellaEnLaRed === null).map((e) => e.nombre),
  };
}

/**
 * Hasta dónde llegó el proceso, según lo que se vio. **No es un diagnóstico.**
 *
 * ⚠ Devuelve la etapa más avanzada cuya huella está presente, y nada más. Que
 * una huella esté no prueba que la etapa ocurrió: un chico puede usar una VPN
 * para ver algo que le bloquearon en la escuela. Por eso esto **no suma
 * puntaje** — se usa para ordenar el relato de la alerta, no para decidirla.
 */
export function hastaDondeSeVio(tipos: TipoDeSenal[]): EtapaDelProceso | null {
  const presentes = new Set(tipos);
  const alcanzadas = PROCESO.filter(
    (e) => e.senales.length > 0 && e.senales.some((s) => presentes.has(s)),
  );
  return alcanzadas.length > 0 ? alcanzadas[alcanzadas.length - 1] : null;
}
