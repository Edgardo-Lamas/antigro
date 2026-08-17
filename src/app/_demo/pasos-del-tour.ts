/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE DICEN LOS CARTELES DEL TOUR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Aparte del componente a propósito, por dos motivos que se refuerzan:
 *
 *  1. **Es contenido, no interfaz.** Corregir una frase no debería obligar a
 *     abrir el archivo que calcula posiciones y escucha el teclado.
 *  2. **Y así se puede probar.** Las tandas del proyecto corren con node pelado
 *     (`--experimental-strip-types`), que no lee `.tsx`. Con el texto acá, los
 *     carteles tienen sus casos como cualquier otra regla de la casa.
 */

/**
 * 🔴 Si un cartel no entra en esto, **se reescribe el cartel** — no se agranda
 * el número. Un cartel de tour que hay que leer con ganas se cierra sin leer,
 * y encima ocupa la pantalla en los primeros diez segundos, que es justo lo
 * único que un jurado va a mirar seguro.
 */
export const LARGO_MAXIMO = 130;

export interface Paso {
  /** `id` del elemento al que apunta. Vacío = cartel centrado, sin señalar. */
  ancla: string;
  titulo: string;
  texto: string;
}

/**
 * 🔴 **Seis pasos, y el orden cuenta una historia:** qué mira → qué NO lee →
 * cómo pasa el tiempo → cuándo habla → a quién le habla → cómo se verifica.
 *
 * 🔑 **El segundo es el más importante de todos y va segundo a propósito.** Si
 * alguien abandona el tour después de dos carteles, lo que se tiene que llevar
 * es que el sistema no lee mensajes. Hay una comprobación que lo verifica, para
 * que nadie lo reordene sin darse cuenta de lo que está moviendo.
 */
export const PASOS: Paso[] = [
  {
    ancla: "tour-controles",
    titulo: "Armá la situación",
    texto: "La edad del chico, qué viene pasando en su red, y qué contestaron los adultos.",
  },
  {
    ancla: "tour-controles",
    titulo: "Nada de esto es contenido",
    texto: "El sistema ve horarios y volúmenes. No lee un solo mensaje, y no puede.",
  },
  {
    ancla: "tour-reloj",
    titulo: "Corré el tiempo",
    texto: "Tres semanas, día por día. Fijate que los primeros días no pase nada.",
  },
  {
    ancla: "tour-lectura",
    titulo: "Acá decide el motor",
    texto: "No alerta por un pico: espera a que el patrón se sostenga. Y explica por qué.",
  },
  {
    ancla: "tour-mensajes",
    titulo: "Qué saldría",
    texto: "El aviso a los adultos, y orientación al propio chico escrita para su edad.",
  },
  {
    ancla: "tour-fuentes",
    titulo: "Y qué hay conectado",
    texto: "Lo que corre de verdad y lo que está simulado, sin disimular cuál es cuál.",
  },
];
