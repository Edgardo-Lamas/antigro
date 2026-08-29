/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS LUGARES, CON SUS CASOS — `npm run probar-plataformas`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Esta tanda existe por un agujero real, encontrado el 28/8/2026:
 *  Facebook y Messenger no estaban en el catálogo.** El Estudio nacional los
 *  mide como el primer medio de contacto en Argentina (Facebook 52,8%), el
 *  encabezado de `plataformas.ts` los cita desde que se escribió — y aun así
 *  caían en `desconocida`, así que la secuencia *Facebook → WhatsApp* no
 *  disparaba el cruce. **La señal más filosa del motor era ciega en la
 *  plataforma número uno, y no había nada que se pusiera rojo.**
 *
 *  🔑 **Por eso la comprobación central no es «Facebook está»: es que ninguna
 *  de las plataformas que nombran nuestras propias fuentes quede sin
 *  clasificar.** Una entrada suelta se vuelve a olvidar; una lista anclada a la
 *  fuente se pone roja sola la próxima vez que alguien agregue una app al
 *  proyecto sin agregarla acá.
 *
 *  ⚠ Lo que esta tanda NO hace, y conviene decirlo: no valida que la puerta
 *  asignada a cada lugar sea la correcta. Eso es criterio de producto y se
 *  discute mirando el producto, no un test. Acá se verifica que el catálogo
 *  cubra lo que las fuentes nombran y que el cruce se dispare donde tiene que
 *  dispararse.
 */

/* ⚠ Ruta relativa y con extensión, no `@/`: estas tandas las corre node pelado
   (`--experimental-strip-types`) y ahí el alias de TypeScript no existe. */
import { esCruce, fueraDelRadar, nombreDeLugar, puertaDe } from "./plataformas.ts";
import { SERVICIOS, claseDeEvasion } from "./servicios.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* ── 1. Lo que faltaba: Facebook y Messenger ────────────────────────────── */

comprobar(
  "🔴 Facebook está catalogado — es el 52,8% del Estudio nacional y caía en «desconocida»",
  !fueraDelRadar("facebook.com"),
  `puerta: ${puertaDe("facebook.com")}`,
);

comprobar(
  "🔴 Messenger está catalogado",
  !fueraDelRadar("messenger.com"),
  `puerta: ${puertaDe("messenger.com")}`,
);

comprobar(
  "🔑 los dos van en contacto abierto: un desconocido puede escribirle sin que él dé nada",
  puertaDe("facebook.com") === "contacto_abierto" &&
    puertaDe("messenger.com") === "contacto_abierto",
  `facebook: ${puertaDe("facebook.com")} · messenger: ${puertaDe("messenger.com")}`,
);

for (const dominio of ["m.facebook.com", "web.facebook.com", "es-la.facebook.com", "fb.com"]) {
  comprobar(
    `los subdominios y el dominio corto también: ${dominio}`,
    nombreDeLugar(dominio) === "Facebook",
    `salió: ${nombreDeLugar(dominio)}`,
  );
}

comprobar(
  "📌 `fbcdn.net` queda AFUERA a propósito: es infraestructura, y también se resuelve con Instagram",
  fueraDelRadar("scontent.fbcdn.net"),
  `puerta: ${puertaDe("scontent.fbcdn.net")}`,
);

/* ── 2. El cruce, que es lo que estaba roto ─────────────────────────────── */

comprobar(
  "🔴 Facebook → WhatsApp ES un cruce — el traslado que describe nuestra propia fuente",
  esCruce(puertaDe("facebook.com"), puertaDe("whatsapp.com")),
);

comprobar(
  "🔴 Messenger → Telegram también",
  esCruce(puertaDe("messenger.com"), puertaDe("telegram.org")),
);

comprobar(
  "📌 Facebook → Messenger NO es cruce: misma puerta, no hubo entrega de nada",
  !esCruce(puertaDe("facebook.com"), puertaDe("messenger.com")),
);

comprobar(
  "el cruce viejo sigue en pie: Roblox → WhatsApp",
  esCruce(puertaDe("roblox.com"), puertaDe("whatsapp.com")),
);

comprobar(
  "🔑 y al revés NO es cruce: que use WhatsApp y después entre a Roblox no dice nada",
  !esCruce(puertaDe("whatsapp.com"), puertaDe("roblox.com")),
);

/* ── 3. Lo que las fuentes del proyecto nombran tiene que estar ─────────── */

/**
 * 🔑 Las apps que el **Informe Grooming LATAM** (n≈28.360, 14 países) lista como
 * las más usadas por los chicos de la región, más los juegos que nombra.
 * **Si el proyecto cita una plataforma en algún lado, el catálogo la tiene que
 * conocer** — si no, el motor la trata como un lugar cualquiera.
 */
const NOMBRADAS_POR_LAS_FUENTES = [
  "whatsapp.com",
  "tiktok.com",
  "youtube.com",
  "instagram.com",
  "facebook.com",
  "snapchat.com",
  "roblox.com",
  "discord.com",
  "messenger.com",
  "telegram.org",
  "freefire.garena.com",
  "minecraft.net",
];

const sinClasificar = NOMBRADAS_POR_LAS_FUENTES.filter(fueraDelRadar);
comprobar(
  "🔴 ninguna plataforma que nombran nuestras fuentes queda sin clasificar",
  sinClasificar.length === 0,
  `sin clasificar: ${sinClasificar.join(", ")}`,
);

/* ── 4. Lo que no está sigue cayendo en «desconocida», y está bien ──────── */

comprobar(
  "📌 un lugar que no tenemos catalogado sigue siendo «desconocida» — es la categoría que el observatorio mira",
  fueraDelRadar("chat-libre-24.top"),
);

comprobar(
  "y de un desconocido, el nombre es el dominio pelado: no se inventa una marca",
  nombreDeLugar("chat-libre-24.top") === "chat-libre-24.top",
  `salió: ${nombreDeLugar("chat-libre-24.top")}`,
);

comprobar(
  "🔑 WhatsApp sigue siendo destino y no lugar peligroso (corrección del 15/8)",
  puertaDe("whatsapp.com") === "requiere_entrega",
  `salió: ${puertaDe("whatsapp.com")}`,
);

/* ── 5. Los dominios importados de NextDNS (28/8) ───────────────────────── */

comprobar(
  "el catálogo importado trae los 43 servicios",
  SERVICIOS.length === 43,
  `trae: ${SERVICIOS.length}`,
);

for (const [dominio, nombre] of [
  ["twitch.tv", "Twitch"],
  ["pinterest.com", "Pinterest"],
  ["tinder.com", "Tinder"],
  ["steamcommunity.com", "Steam"],
  ["reddit.com", "Reddit"],
  ["x.com", "X (Twitter)"],
] as const) {
  comprobar(
    `🔴 ${nombre} dejó de ser un dominio sin clasificar`,
    !fueraDelRadar(dominio) && nombreDeLugar(dominio) === nombre,
    `salió: ${nombreDeLugar(dominio)} · ${puertaDe(dominio)}`,
  );
}

comprobar(
  "sube por el árbol de dominios: www.twitch.tv también es Twitch",
  nombreDeLugar("www.twitch.tv") === "Twitch",
  `salió: ${nombreDeLugar("www.twitch.tv")}`,
);

comprobar(
  "🔑 un CDN se RECONOCE (no ensucia el observatorio)…",
  !fueraDelRadar("rbxcdn.com") && nombreDeLugar("rbxcdn.com") === "Roblox",
  `salió: ${nombreDeLugar("rbxcdn.com")}`,
);

comprobar(
  "🔴 …pero NO hereda la puerta del servicio: bajar una textura no es estar en un lugar de contacto",
  puertaDe("rbxcdn.com") === "sin_contacto",
  `salió: ${puertaDe("rbxcdn.com")}`,
);

comprobar(
  "🔴 y por eso un CDN NO dispara el cruce",
  !esCruce(puertaDe("rbxcdn.com"), puertaDe("whatsapp.com")),
);

comprobar(
  "🔑 el cruce nuevo que antes no existía: Twitch → WhatsApp",
  esCruce(puertaDe("twitch.tv"), puertaDe("whatsapp.com")),
);

comprobar(
  "⚠ la basura de la fuente no entró: `xboxlive.xom` es un typo y quedó afuera…",
  fueraDelRadar("xboxlive.xom"),
);

comprobar(
  "…pero el dominio bueno del mismo servicio sí está",
  nombreDeLugar("xbox.com") === "Xbox Live",
  `salió: ${nombreDeLugar("xbox.com")}`,
);

/* ── 6. Lo importado NO puede voltear una decisión nuestra ──────────────── */

for (const [dominio, esperada] of [
  ["whatsapp.com", "requiere_entrega"],
  ["discord.com", "requiere_entrega"],
  ["telegram.org", "requiere_entrega"],
  ["snapchat.com", "contacto_abierto"],
  ["youtube.com", "sin_contacto"],
] as const) {
  comprobar(
    `🔴 el catálogo propio sigue mandando sobre ${dominio} (${esperada})`,
    puertaDe(dominio) === esperada,
    `salió: ${puertaDe(dominio)}`,
  );
}

/* ── 7. La evasión, que es la señal de peso 1 ───────────────────────────── */

comprobar(
  "🔴 una VPN se reconoce como acto deliberado",
  claseDeEvasion("nordvpn.com") === "vpn_o_proxy",
  `salió: ${claseDeEvasion("nordvpn.com")}`,
);

comprobar(
  "🔑 1clickVPN también — es la extensión que rompió el login del curso el 27/8",
  claseDeEvasion("1clickvpn.net") === "vpn_o_proxy",
);

comprobar(
  "🔴 un DoH público va en OTRA clase: puede ser el navegador y no el chico",
  claseDeEvasion("mozilla.cloudflare-dns.com") === "dns_alternativo",
  `salió: ${claseDeEvasion("mozilla.cloudflare-dns.com")}`,
);

comprobar(
  "🔴🔴 `dns.nextdns.io` NO es evasión: es el nuestro, es el sistema funcionando",
  claseDeEvasion("dns.nextdns.io") === null,
  `salió: ${claseDeEvasion("dns.nextdns.io")}`,
);

comprobar(
  "un lugar normal no es evasión",
  claseDeEvasion("roblox.com") === null,
);

comprobar(
  "y los subdominios de una VPN también cuentan",
  claseDeEvasion("api.nordvpn.com") === "vpn_o_proxy",
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
