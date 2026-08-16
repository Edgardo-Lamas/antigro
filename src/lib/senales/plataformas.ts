/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LUGARES — clasificados por lo que PERMITEN, no por lo que son
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Corrección de Edgardo, 15/8/2026, y reescribe este archivo entero:**
 *  *"el lugar peligroso no es WhatsApp; el lugar peligroso es de donde sale el
 *  contacto que luego lleva a WhatsApp. Yo colocaría a WhatsApp en otra
 *  categoría."*
 *
 *  Tenía razón y el modelo anterior estaba mal planteado. Clasificaba por lo que
 *  cada app **es** —juego, mensajería, red social—, y eso metía a WhatsApp y a
 *  Discord en la misma bolsa. Pero WhatsApp es donde el chico habla con la
 *  madre y con sus compañeros: no es un lugar peligroso, **es el destino**.
 *
 *  🔑 **Lo que de verdad divide a los lugares es una sola propiedad: si un
 *  desconocido puede empezar una conversación sin que el chico le entregue
 *  nada.** Ésa es la puerta. Lo demás es consecuencia.
 *
 *  ➡ Y de ahí sale la señal buena, que es más filosa que "apareció WhatsApp":
 *  **el cruce de categoría.** Que aparezca WhatsApp no dice nada. Que aparezca
 *  WhatsApp *después* de un lugar de contacto abierto significa que **el chico
 *  entregó su teléfono a alguien que conoció ahí**. Eso es un hecho observable,
 *  no una interpretación, y es exactamente lo que describen los casos.
 *
 *  ─── 📊 El dato que lo sostiene, y la trampa que trae ──────────────────────
 *
 *  NSPCC (Reino Unido, 45 fuerzas policiales): 7.062 delitos de comunicación
 *  sexual con un menor registrados en 2023-24, **+89% desde 2017-18**. De los
 *  1.824 casos donde se identificó el medio: **Snapchat 48%**, WhatsApp 12%,
 *  Facebook/Messenger 12%, Instagram 6%.
 *  https://www.nspcc.org.uk/about-us/news-opinion/2024/online-grooming-crimes-increase/
 *
 *  ⚠ **Y acá aparece algo que hay que decir, porque choca con nuestra otra
 *  fuente:** el Estudio nacional argentino (Ministerio de Justicia, 2023) dice
 *  que el **74,3% de los casos pasa por WhatsApp**; el británico le da 12%.
 *  No es que uno esté mal: **el ranking de plataformas es propio de cada país**
 *  —Snapchat es masivo entre adolescentes británicos y marginal acá, y WhatsApp
 *  es dominante en Argentina para todo—.
 *
 *  🔴 **Conclusión, y cierra el argumento del observatorio: una lista de
 *  plataformas peligrosas no se puede importar.** Ni de la NSPCC ni de nadie.
 *  Sirve la PROPIEDAD (contacto abierto vs. entrega), que no depende del país;
 *  no sirve el ranking. Por eso el sistema tiene que producir su propio dato.
 */

export type Puerta =
  /**
   * 🔴 Un desconocido puede iniciar conversación sin que el chico le dé nada:
   * chat abierto de un juego, sugerencias de amistad, mensajes directos de
   * cuentas que no sigue. **Acá empieza el contacto.**
   */
  | "contacto_abierto"
  /**
   * Hace falta que el chico **entregue un identificador** —su teléfono, su
   * usuario, aceptar una solicitud—. No es peligroso por sí mismo: es donde
   * habla con su familia. Importa como **destino de un traslado**.
   */
  | "requiere_entrega"
  /** Consumo sin canal de conversación con desconocidos. */
  | "sin_contacto"
  /** Fuera del radar: no lo tenemos catalogado. Lo que más se mira. */
  | "desconocida";

export const NOMBRE_DE_PUERTA: Record<Puerta, string> = {
  contacto_abierto: "Un desconocido puede escribirle",
  requiere_entrega: "Hace falta que él entregue un dato",
  sin_contacto: "Sin conversación con desconocidos",
  desconocida: "Sin clasificar",
};

/**
 * ⚠ **Ninguna plataforma de acá está acusada de nada.** Roblox no es peligroso:
 * es donde están los chicos. Lo que se clasifica es qué puerta deja abierta, que
 * es una propiedad del producto, no un juicio sobre la empresa.
 *
 * 📌 Lo que no está cae en `desconocida`, y está bien que así sea: esa es
 * justamente la categoría que el observatorio mira con más atención.
 */
const CATALOGO: { patron: RegExp; puerta: Puerta; nombre: string }[] = [
  /* ── Contacto abierto: el desconocido llega solo ── */
  { patron: /(^|\.)roblox\.com$/i, puerta: "contacto_abierto", nombre: "Roblox" },
  { patron: /(^|\.)(freefire|garena)/i, puerta: "contacto_abierto", nombre: "Free Fire" },
  { patron: /(^|\.)minecraft\.net$/i, puerta: "contacto_abierto", nombre: "Minecraft" },
  { patron: /(^|\.)(fortnite|epicgames)\.com$/i, puerta: "contacto_abierto", nombre: "Fortnite" },
  /* 🔴 Snapchat va acá y no con la mensajería: el 48% de los casos del informe
     NSPCC. Su "Quick Add" sugiere desconocidos, y los mensajes desaparecen —
     que es lo que un acosador busca y lo contrario de lo que necesita un padre. */
  { patron: /(^|\.)snapchat\.com$/i, puerta: "contacto_abierto", nombre: "Snapchat" },
  { patron: /(^|\.)tiktok\.com$/i, puerta: "contacto_abierto", nombre: "TikTok" },
  { patron: /(^|\.)instagram\.com$/i, puerta: "contacto_abierto", nombre: "Instagram" },
  { patron: /(^|\.)omegle|chatroulette/i, puerta: "contacto_abierto", nombre: "Chat con extraños" },

  /* ── Requieren entrega: el chico tiene que dar algo primero ── */
  { patron: /(^|\.)whatsapp\.(com|net)$/i, puerta: "requiere_entrega", nombre: "WhatsApp" },
  { patron: /(^|\.)telegram\.(org|me)$/i, puerta: "requiere_entrega", nombre: "Telegram" },
  { patron: /(^|\.)discord(app)?\.(com|gg)$/i, puerta: "requiere_entrega", nombre: "Discord" },

  /* ── Sin canal con desconocidos ── */
  { patron: /(^|\.)youtube\.com$/i, puerta: "sin_contacto", nombre: "YouTube" },
];

export function puertaDe(dominio: string): Puerta {
  const limpio = dominio.trim().toLowerCase();
  return CATALOGO.find((c) => c.patron.test(limpio))?.puerta ?? "desconocida";
}

export function nombreDeLugar(dominio: string): string {
  const limpio = dominio.trim().toLowerCase();
  return CATALOGO.find((c) => c.patron.test(limpio))?.nombre ?? limpio;
}

/** ¿Es un lugar que nadie tiene catalogado? Lo que el observatorio prioriza. */
export function fueraDelRadar(dominio: string): boolean {
  return puertaDe(dominio) === "desconocida";
}

/**
 * 🔑 **EL CRUCE — la señal, y no es el destino sino el movimiento.**
 *
 * De un lugar donde cualquiera pudo escribirle, a un lugar donde hizo falta que
 * él entregara su teléfono o su usuario. Dicho sin vueltas: **el chico le dio su
 * número a alguien que conoció en un lugar abierto.**
 *
 * Es lo que describen los casos —el contacto empieza en el chat del juego y
 * sigue en la mensajería privada, donde hay menos control— y es lo único de todo
 * el proceso que un filtro de red puede ver sin leer una sola palabra.
 *
 * ⚠ Y sigue sin significar nada por sí solo: millones de chicos conocen gente
 * jugando y después se pasan el contacto. Entra como contexto de una lectura
 * que ya se sostiene por otro lado.
 */
export function esCruce(desde: Puerta, hacia: Puerta): boolean {
  return desde === "contacto_abierto" && hacia === "requiere_entrega";
}
