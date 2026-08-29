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
 *  fuente:** el Estudio nacional argentino (Ministerio de Justicia, 2023) mide
 *  **Facebook 52,8%, Instagram 33,1% y WhatsApp 30,7%**; el británico pone a
 *  Snapchat primero con 48% y a Facebook/Messenger en 12%.
 *  ⚠ Acá decía «74,3% pasa por WhatsApp». Corregido el 21/8: ese número es de
 *  UNESCO/CIPDH, mide bullying virtual y está en el estado del arte del estudio.
 *  No es que uno esté mal: **el ranking de plataformas es propio de cada país**
 *  —Snapchat es masivo entre adolescentes británicos y marginal acá, y WhatsApp
 *  es dominante en Argentina para todo—.
 *
 *  🔴 **Conclusión, y cierra el argumento del observatorio: una lista de
 *  plataformas peligrosas no se puede importar.** Ni de la NSPCC ni de nadie.
 *  Sirve la PROPIEDAD (contacto abierto vs. entrega), que no depende del país;
 *  no sirve el ranking. Por eso el sistema tiene que producir su propio dato.
 */

import { SERVICIOS } from "./servicios.ts";

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

  /* 🔴 **Facebook y Messenger — agregados el 28/8/2026, y eran la ausencia más
     cara de este catálogo.** El Estudio nacional (Ministerio de Justicia, 2023)
     los mide como el PRIMER medio de contacto en Argentina —**Facebook 52,8%**,
     por encima de Instagram (33,1%) y de WhatsApp (30,7%)— y el Informe Grooming
     LATAM los tiene entre las apps más usadas por los chicos de la región. Están
     citados en el encabezado de este mismo archivo desde que se escribió: la
     fuente estaba, la entrada no.

     ➡ **Qué se rompía sin ellos, y no era un detalle cosmético.** Facebook caía
     en `desconocida`, así que la secuencia *Facebook → WhatsApp* —el traslado
     más frecuente que describe nuestra propia fuente— **no disparaba `esCruce`**.
     La señal más filosa del motor era ciega justo en la plataforma número uno.

     📌 **Los dos van en contacto abierto, no con la mensajería**, por la única
     propiedad que gobierna este archivo: un desconocido puede escribirle sin que
     el chico le entregue nada — el mensaje cae en «solicitudes de mensajes» y el
     chico lo lee igual. Es el mismo motivo por el que Snapchat está acá arriba y
     no abajo.

     ⚠ **Y resuelve de paso un problema que es de red, no de criterio:** en el DNS,
     Messenger comparte dominios con Facebook. Separarlos en dos puertas habría
     hecho depender la lectura de una distinción que el filtro no siempre puede
     hacer; en la misma puerta, esa ambigüedad no cambia el resultado.

     📌 **`fbcdn.net` queda afuera a propósito.** Es infraestructura de contenido
     y también se resuelve al abrir Instagram: meterlo llamaría «Facebook» a
     tráfico que no lo es, y ensuciaría `plataforma_nueva` con un lugar que el
     chico nunca eligió. */
  { patron: /(^|\.)(facebook|fb)\.com$/i, puerta: "contacto_abierto", nombre: "Facebook" },
  { patron: /(^|\.)messenger\.com$/i, puerta: "contacto_abierto", nombre: "Messenger" },

  /* ── Requieren entrega: el chico tiene que dar algo primero ── */
  { patron: /(^|\.)whatsapp\.(com|net)$/i, puerta: "requiere_entrega", nombre: "WhatsApp" },
  { patron: /(^|\.)telegram\.(org|me)$/i, puerta: "requiere_entrega", nombre: "Telegram" },
  { patron: /(^|\.)discord(app)?\.(com|gg)$/i, puerta: "requiere_entrega", nombre: "Discord" },

  /* ── Sin canal con desconocidos ── */
  { patron: /(^|\.)youtube\.com$/i, puerta: "sin_contacto", nombre: "YouTube" },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS DOMINIOS IMPORTADOS — 28/8/2026
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Las entradas de arriba son NUESTRAS y siguen mandando; `servicios.ts` agrega
 *  los 400 dominios (únicos, de 404 publicados) de las 43 plataformas que publica NextDNS (MIT). El detalle
 *  de qué se importó, qué se descartó y por qué está en el encabezado de ese
 *  archivo.
 *
 *  🔴 **El orden de búsqueda no es indiferente, y por eso el catálogo propio va
 *  PRIMERO:** ahí viven decisiones tomadas y discutidas —WhatsApp es destino y
 *  no lugar peligroso (15/8), Snapchat va con los abiertos y no con la
 *  mensajería, Facebook y Messenger son contacto abierto (28/8)—. Si la lista
 *  importada resolviera primero, un cambio de ellos podría voltear una decisión
 *  nuestra **sin que nadie se entere**. Al revés no pasa: lo importado sólo
 *  contesta donde nosotros no dijimos nada.
 */

/** Dominio exacto → qué es. Se arma una vez, al cargar el módulo. */
const POR_DOMINIO = new Map<string, { nombre: string; puerta: Puerta }>();
for (const servicio of SERVICIOS) {
  for (const dominio of servicio.dominios) {
    POR_DOMINIO.set(dominio, { nombre: servicio.nombre, puerta: servicio.puerta });
  }
  /* 🔑 La infraestructura se reconoce —así el observatorio no la levanta como un
     lugar que nadie tiene catalogado— pero NUNCA hereda la puerta del servicio:
     un CDN no es un lugar donde alguien te escribe. Ver `servicios.ts`. */
  for (const dominio of servicio.infraestructura ?? []) {
    POR_DOMINIO.set(dominio, { nombre: servicio.nombre, puerta: "sin_contacto" });
  }
}

/**
 * Busca el dominio y, si no está, va subiendo por el árbol: `www.roblox.com` →
 * `roblox.com` → `com`. Así gana **la coincidencia más específica**, que es la
 * que sabe más.
 */
function buscarImportado(dominio: string): { nombre: string; puerta: Puerta } | undefined {
  let resto = dominio;
  while (resto.length > 0) {
    const encontrado = POR_DOMINIO.get(resto);
    if (encontrado) return encontrado;
    const punto = resto.indexOf(".");
    if (punto < 0) return undefined;
    resto = resto.slice(punto + 1);
  }
  return undefined;
}

export function puertaDe(dominio: string): Puerta {
  const limpio = dominio.trim().toLowerCase();
  const propio = CATALOGO.find((c) => c.patron.test(limpio));
  if (propio) return propio.puerta;
  return buscarImportado(limpio)?.puerta ?? "desconocida";
}

export function nombreDeLugar(dominio: string): string {
  const limpio = dominio.trim().toLowerCase();
  const propio = CATALOGO.find((c) => c.patron.test(limpio));
  if (propio) return propio.nombre;
  return buscarImportado(limpio)?.nombre ?? limpio;
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
