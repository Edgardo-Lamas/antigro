/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CATÁLOGO DE SERVICIOS — de dónde salen los dominios (28/8/2026)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Por qué existe este archivo.** Hasta el 28/8 el catálogo de lugares eran
 *  QUINCE regex escritas a mano, y todo lo demás caía en `desconocida` — Twitch,
 *  Pinterest, Steam, Tinder y el resto de internet incluidos. Peor: Facebook, la
 *  plataforma que nuestra propia fuente pone primera en Argentina (52,8%), no
 *  estaba, así que la secuencia *Facebook → WhatsApp* no disparaba el cruce.
 *
 *  🔑 **Lo que se importa son los DOMINIOS, nunca el criterio.** La puerta de
 *  cada servicio la decidimos nosotros con la propiedad de siempre —si un
 *  desconocido puede escribirle sin que el chico le entregue nada—, que es lo
 *  que `plataformas.ts` viene defendiendo desde el 15/8: **una lista de
 *  plataformas peligrosas no se puede importar de ningún país; la propiedad sí
 *  vale en todos.**
 *
 *  ─── 📦 La fuente ──────────────────────────────────────────────────────────
 *
 *  **`github.com/nextdns/services`, licencia MIT**, bajado el 28/8/2026.
 *  43 servicios · 404 dominios publicados, **400 únicos después de limpiarla**
 *  (`ttvnw.net` viene repetido en Twitch). Es la lista que usa NextDNS para agrupar
 *  tráfico por servicio, así que la mantiene gente que vive de tenerla al día.
 *
 *  ⚠ **NO se importó a ciegas, y menos mal:** de los 404 dominios, **tres son
 *  basura de la fuente** y se descartaron —`xboxlive.xom` (un typo de `.com`),
 *  `youtube` sin dominio, y `_spotify-connect._tcp.local`, que es mDNS de la red
 *  local y no un lugar de internet—.
 *
 *  ─── 🔴 DOMINIOS DE USO vs. INFRAESTRUCTURA, y no es una prolijidad ────────
 *
 *  127 de los 404 son CDN y analítica: `rbxcdn.com`, `ttvnw.net`, `scdn.co`,
 *  `nflxvideo.net`. **Entran igual** —si no, el observatorio los marcaría como
 *  lugares que no reconoce y llenaría la lista de hallazgos con las texturas de
 *  Roblox— pero van en `infraestructura` y se leen como `sin_contacto`.
 *
 *  🔑 **El motivo es el cruce.** `rbxcdn.com` no es un lugar donde alguien te
 *  escribe: es de donde se bajan los gráficos. Si contara como Roblox, el cruce
 *  —la señal más filosa del motor— **se dispararía porque el chico cargó una
 *  imagen**. Reconocer el cable no es lo mismo que reconocer el edificio.
 *
 *  ─── ⬜ Las cinco que quedaron marcadas para revisar ───────────────────────
 *
 *  9GAG, BeReal, Imgur, Mastodon, Pinterest, Skype y Steam llevan un `⬜ a
 *  revisar` al lado de su puerta. **No es duda sobre si entran: es duda sobre en
 *  qué puerta caen**, y son las únicas donde la propiedad no se contesta sola.
 *  Todas están puestas del lado que más señal produce (`contacto_abierto`), que
 *  es el lado conservador para un sistema que protege a un chico — pero un
 *  servicio mal puesto ahí dispara el cruce de más, así que conviene mirarlas.
 *
 *  📌 **Lo que la fuente NO trae y por eso `plataformas.ts` conserva sus regex
 *  propias:** Free Fire —la #2 de la región según el Informe LATAM— y los chats
 *  con extraños tipo Omegle. La lista importada AMPLÍA el catálogo propio, no lo
 *  reemplaza.
 */

import type { Puerta } from "./plataformas.ts";

export interface Servicio {
  nombre: string;
  puerta: Puerta;
  /** Dominios donde el chico ESTUVO. Mandan la puerta del servicio. */
  dominios: string[];
  /** CDN y analítica del mismo servicio. Se reconocen, pero como `sin_contacto`. */
  infraestructura?: string[];
}

export const SERVICIOS: Servicio[] = [
  {
    nombre: "9GAG",
    puerta: "contacto_abierto",  /* ⬜ a revisar */
    dominios: ["9cache.com", "9gag.com"],
  },
  {
    nombre: "Amazon",
    puerta: "sin_contacto",
    dominios: ["amazon.ae", "amazon.ca", "amazon.cn", "amazon.co.jp", "amazon.co.uk", "amazon.com", "amazon.com.au", "amazon.com.br", "amazon.com.mx", "amazon.com.tr", "amazon.de", "amazon.es", "amazon.fr", "amazon.in", "amazon.it", "amazon.nl", "amazon.pl", "amazon.sa", "amazon.sg", "amzn.ae", "amzn.com", "amzn.in", "amzn.sg"],
  },
  {
    nombre: "BeReal",
    puerta: "requiere_entrega",  /* ⬜ a revisar */
    dominios: ["bere.al", "bereal.com"],
  },
  {
    nombre: "Blizzard",
    puerta: "contacto_abierto",
    dominios: ["battle.net", "blizzard.com"],
  },
  {
    nombre: "ChatGPT",
    puerta: "sin_contacto",
    dominios: ["chat.openai.com"],
  },
  {
    nombre: "Dailymotion",
    puerta: "sin_contacto",
    dominios: ["dailymotion.com"],
    infraestructura: ["dm-event.net", "dmcdn.net"],
  },
  {
    nombre: "Discord",
    puerta: "requiere_entrega",
    dominios: ["discord.com", "discord.gg", "discord.media", "discordapp.com", "discordapp.net"],
  },
  {
    nombre: "Disney+",
    puerta: "sin_contacto",
    dominios: ["disney-plus.net", "disneyplus.com", "disneyplus.disney.co.jp"],
    infraestructura: ["dssott.com", "dssott.com.c.footprint.net", "search-api-disney.bamgrid.com"],
  },
  {
    nombre: "eBay",
    puerta: "sin_contacto",
    dominios: ["ebay-us.com", "ebay.at", "ebay.be", "ebay.ca", "ebay.ch", "ebay.co.uk", "ebay.com", "ebay.com.au", "ebay.com.cn", "ebay.com.hk", "ebay.com.my", "ebay.com.sg", "ebay.de", "ebay.es", "ebay.fr", "ebay.ie", "ebay.in", "ebay.it", "ebay.nl", "ebay.ph", "ebay.pl", "ebayinc.com"],
    infraestructura: ["ebaycdn.net", "ebaydesc.com", "ebayimg.com", "ebayrtm.com", "ebaystatic.com"],
  },
  {
    nombre: "Facebook",
    puerta: "contacto_abierto",
    dominios: ["api.facebook.com", "b-www.facebook.com", "fb.com", "fb.me", "gateway.facebook.com", "lithium.facebook.com", "lookaside.facebook.com", "m.facebook.com", "www.facebook.com"],
  },
  {
    nombre: "Fortnite",
    puerta: "contacto_abierto",
    dominios: ["epicgames.com"],
  },
  {
    nombre: "Google Chat",
    puerta: "requiere_entrega",
    dominios: ["chat.google.com"],
  },
  {
    nombre: "HBO Max",
    puerta: "sin_contacto",
    dominios: ["hbomax.com", "max.com"],
  },
  {
    nombre: "Hulu",
    puerta: "sin_contacto",
    dominios: ["hulu.com"],
  },
  {
    nombre: "Imgur",
    puerta: "contacto_abierto",  /* ⬜ a revisar */
    dominios: [],
    infraestructura: ["imgur.com"],
  },
  {
    nombre: "Instagram",
    puerta: "contacto_abierto",
    dominios: ["instagram.com"],
    infraestructura: ["cdninstagram.com"],
  },
  {
    nombre: "League of Legends",
    puerta: "contacto_abierto",
    dominios: ["leagueoflegends.com", "lol.riotgames.com"],
  },
  {
    nombre: "Mastodon",
    puerta: "contacto_abierto",  /* ⬜ a revisar */
    dominios: ["alive.bar", "ani.work", "brighteon.social", "c.im", "counter.social", "fedibird.com", "fosstodon.org", "gc2.jp", "hachyderm.io", "home.social", "infosec.exchange", "joinmastodon.org", "kolektiva.social", "loforo.com", "m.cmx.im", "mamot.fr", "mas.to", "masthead.social", "masto.ai", "mastodon.art", "mastodon.au", "mastodon.cloud", "mastodon.lol", "mastodon.nl", "mastodon.online", "mastodon.scot", "mastodon.sdf.org", "mastodon.social", "mastodon.top", "mastodon.uno", "mastodon.world", "mastodon.xyz", "mastodonapp.uk", "meatbag.app", "mindly.social", "mstdn.ca", "mstdn.jp", "mstdn.party", "mstdn.social", "nerdculture.de", "ohai.social", "pawoo.net", "pixelfed.social", "poa.st", "qoto.org", "sfba.social", "techhub.social", "tilde.zone", "toot.community", "troet.cafe", "universeodon.com"],
  },
  {
    nombre: "Messenger",
    puerta: "contacto_abierto",
    dominios: ["chat-e2ee-mini.facebook.com", "edge-chat.facebook.com", "messenger.com"],
  },
  {
    nombre: "Minecraft",
    puerta: "contacto_abierto",
    dominios: ["minecraft.net", "minecraftservices.com", "mojang.com"],
  },
  {
    nombre: "Netflix",
    puerta: "sin_contacto",
    dominios: ["netflix.com", "netflix.net"],
    infraestructura: ["nflxext.com", "nflximg.net", "nflxso.net", "nflxvideo.net"],
  },
  {
    nombre: "Pinterest",
    puerta: "contacto_abierto",  /* ⬜ a revisar */
    dominios: ["pin.it", "pinterest.at", "pinterest.be", "pinterest.biz", "pinterest.ca", "pinterest.ch", "pinterest.cl", "pinterest.co", "pinterest.co.at", "pinterest.co.in", "pinterest.co.kr", "pinterest.co.nz", "pinterest.co.uk", "pinterest.com", "pinterest.com.au", "pinterest.com.bo", "pinterest.com.ec", "pinterest.com.mx", "pinterest.com.pe", "pinterest.com.pt", "pinterest.com.py", "pinterest.com.uy", "pinterest.com.vn", "pinterest.de", "pinterest.dk", "pinterest.ec", "pinterest.es", "pinterest.fr", "pinterest.hu", "pinterest.id", "pinterest.ie", "pinterest.in", "pinterest.info", "pinterest.it", "pinterest.jp", "pinterest.kr", "pinterest.mx", "pinterest.nl", "pinterest.nz", "pinterest.pe", "pinterest.ph", "pinterest.pt", "pinterest.ru", "pinterest.se", "pinterest.th", "pinterest.tw", "pinterest.uk", "pinterest.vn"],
    infraestructura: ["pinimg.com"],
  },
  {
    nombre: "PlayStation Network",
    puerta: "contacto_abierto",
    dominios: ["playstation.net"],
  },
  {
    nombre: "Prime Video",
    puerta: "sin_contacto",
    dominios: ["amazonvideo.com", "primevideo.com"],
  },
  {
    nombre: "Reddit",
    puerta: "contacto_abierto",
    dominios: ["redd.it", "reddit.com"],
    infraestructura: ["reddit.map.fastly.net", "redditmedia.com", "redditstatic.com"],
  },
  {
    nombre: "Roblox",
    puerta: "contacto_abierto",
    dominios: ["roblox.com"],
    infraestructura: ["rbxcdn.com"],
  },
  {
    nombre: "Signal",
    puerta: "requiere_entrega",
    dominios: ["signal.org"],
    infraestructura: ["textsecure-service.whispersystems.org"],
  },
  {
    nombre: "Skype",
    puerta: "contacto_abierto",  /* ⬜ a revisar */
    dominios: ["skype.com"],
    infraestructura: ["edge-skype-com.s-0001.s-msedge.net", "skype-edf.akadns.net", "skypeassets.com", "skypedata.akadns.net"],
  },
  {
    nombre: "Snapchat",
    puerta: "contacto_abierto",
    dominios: ["snapchat.com"],
    infraestructura: ["feelinsonice-hrd.appspot.com", "feelinsonice.appspot.com", "sc-analytics.appspot.com", "sc-cdn.net", "sc-gw.com", "sc-jpl.com", "sc-prod.net", "snap-dev.net", "snapads.com"],
  },
  {
    nombre: "Spotify",
    puerta: "sin_contacto",
    dominios: ["spotify.com"],
    infraestructura: ["audio-ak-spotify-com.akamaized.net", "audio4-ak-spotify-com.akamaized.net", "heads-ak-spotify-com.akamaized.net", "heads4-ak-spotify-com.akamaized.net", "scdn.co", "spotify.com.edgesuite.net", "spotify.map.fastly.net", "spotify.map.fastlylb.net", "spotifycdn.com", "spotifycdn.net"],
  },
  {
    nombre: "Steam",
    puerta: "contacto_abierto",  /* ⬜ a revisar */
    dominios: ["steam-chat.com", "steamcommunity.com", "steamgames.com", "steampowered.com"],
    infraestructura: ["poweredbysteam.net", "steamcdn-a.akamaihd.net", "steamcommunity-a.akamaihd.net", "steamcommunity-a.akamaihd.net.edgesuite.net", "steamgames.net", "steamstatic.com", "steamstore-a.akamaihd.net", "steamusercontent-a.akamaihd.net"],
  },
  {
    nombre: "Telegram",
    puerta: "requiere_entrega",
    dominios: ["t.me", "telegram.me", "telegram.org"],
    infraestructura: ["nicegram.app"],
  },
  {
    nombre: "TikTok",
    puerta: "contacto_abierto",
    dominios: ["musical.ly", "tiktok-eu.net", "tiktok-row.net", "tiktok-us.net", "tiktok.com", "tiktok.com.ttdns2.com", "tiktok.in", "tiktok.net", "tiktokd.org", "tiktokglobalshopv.com", "tiktoklb.eu", "tiktokpangle-b.us", "tiktokpangle.us", "tiktokshop.com", "tiktokv.com", "tiktokv.com.ttdns2.com", "tiktokv.eu", "tiktokv.eu.ttdns3.com", "tiktokv.us", "tiktokw.eu", "tiktokw.us"],
    infraestructura: ["douyin.com", "douyincdn.com", "douyinpic.com", "douyinstatic.com", "douyinvod.com", "ibytedtos.com", "ibyteimg.com", "iesdouyin.com", "muscdn.com", "muscdn.com.akamaized.net", "p16-tiktokcdn-com.akamaized.net", "tiktok.bytedance.map.fastly.net", "tiktok.com.bytedance.akadns.net", "tiktok.com.bytewlb.akadns.net", "tiktok.com.edgesuite.net", "tiktok.mncdn.com", "tiktokcdn-eu.com", "tiktokcdn-eu.com.akamaized.net", "tiktokcdn-eu.com.c.bytefcdn-ttpeu.com", "tiktokcdn-eu.com.edgesuite.net", "tiktokcdn-eu.com.ttdns3.com", "tiktokcdn-eu.net", "tiktokcdn-in.com", "tiktokcdn-us.com", "tiktokcdn-us.com.akamaized.net", "tiktokcdn-us.com.atomile.com", "tiktokcdn-us.com.c.worldfcdn2.com", "tiktokcdn-us.com.edgesuite.net", "tiktokcdn.com", "tiktokcdn.com.abc-jns.swiftserve.com", "tiktokcdn.com.akamaized.net", "tiktokcdn.com.atomile.com", "tiktokcdn.com.bytegeo.akadns.net", "tiktokcdn.com.c.bytefcdn-oversea.com", "tiktokcdn.com.c.bytefcdn-ttpeu.com", "tiktokcdn.com.c.bytetcdn.com", "tiktokcdn.com.c.worldfcdn.com", "tiktokcdn.com.cdn20.com", "tiktokcdn.com.ecdnx.com", "tiktokcdn.com.edgesuite.net", "tiktokcdn.com.jns3.swiftserve.com", "tiktokcdn.com.qlivecdn.com", "tiktokcdn.com.queniuaa.com", "tiktokcdn.com.rocket-cdn.com", "tiktokcdn.com.tlivepush.com", "tiktokcdn.com.ttdns2.com", "tiktokcdn.com.wsdvs.com", "tiktokcdn.liveplay.myqcloud.com", "tiktokeu-cdn.com", "tiktokeu-cdn.com.c.bytefcdn-ttpeu.com", "tiktokpangle-cdn-us.com", "tiktokrow-cdn.com", "tiktokrow-cdn.com.c.bytefcdn-oversea.com", "tiktokrow-cdn.com.qlivecdn.com", "tiktokrow-cdn.com.rocket-cdn.com", "tiktokrow-cdn.com.wsdvs.com", "tiktokstaticb.com", "tiktokstaticb.com.edgesuite.net", "tiktokv.com.akamaized.net", "tiktokv.com.bytewlb.akadns.net", "tiktokv.com.c.bytefcdn-oversea.com", "tiktokv.com.c.worldfcdn2.com", "tiktokv.com.cdn.cloudflare.net", "tiktokv.com.edgekey.net", "tiktokv.com.edgesuite.net", "tiktokv.eu.edgesuite.net", "tiktokv.us.edgesuite.net", "tiktokw.us.edgesuite.net", "ttlivecdn.com"],
  },
  {
    nombre: "Tinder",
    puerta: "contacto_abierto",
    dominios: ["gotinder.com", "tinder.com", "tindersparks.com"],
  },
  {
    nombre: "Tumblr",
    puerta: "contacto_abierto",
    dominios: ["tumblr.com"],
  },
  {
    nombre: "Twitch",
    puerta: "contacto_abierto",
    dominios: ["ext-twitch.tv", "twitch.tv"],
    infraestructura: ["jtvnw.net", "ttvnw.net", "twitch.map.fastly.net", "twitchcdn.net", "twitchsvc.net"],
  },
  {
    nombre: "X (Twitter)",
    puerta: "contacto_abierto",
    dominios: ["t.co", "twitter.com", "twttr.com", "x.com"],
    infraestructura: ["ads-twitter.com", "twimg.com", "twtrdns.net"],
  },
  {
    nombre: "Vimeo",
    puerta: "sin_contacto",
    dominios: ["vimeo.com"],
    infraestructura: ["vimeo-video.map.fastly.net", "vimeo.map.fastly.net", "vimeocdn.com"],
  },
  {
    nombre: "VK",
    puerta: "contacto_abierto",
    dominios: ["vk-portal.net", "vk.cc", "vk.com", "vk.link", "vkontakte.ru"],
    infraestructura: ["userapi.com", "vk-cdn.net", "vkuservideo.net"],
  },
  {
    nombre: "WhatsApp",
    puerta: "requiere_entrega",
    dominios: ["whatsapp.com", "whatsapp.net"],
  },
  {
    nombre: "Xbox Live",
    puerta: "contacto_abierto",
    dominios: ["xbox.com"],
  },
  {
    nombre: "YouTube",
    puerta: "sin_contacto",
    dominios: ["youtu.be", "youtube-nocookie.com", "youtube.be", "youtube.co.uk", "youtube.com", "youtube.de", "youtube.fr", "youtube.googleapis.com", "youtube.nl", "youtube.pl", "youtubeeducation.com", "youtubegaming.com", "youtubei.googleapis.com", "youtubekids.com"],
    infraestructura: ["googlevideo.com", "yt3.ggpht.com", "ytimg.com"],
  },
  {
    nombre: "Zoom",
    puerta: "requiere_entrega",
    dominios: ["zoom.com", "zoom.com.cn", "zoom.us", "zoomus.zendesk.com"],
  },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA EVASIÓN — VPN, proxies y DNS alternativos (28/8/2026)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **La señal más fuerte del motor** (`PESO_POR_TIPO.evasion = 1`) y la única
 *  absoluta junto con la madrugada. Hasta hoy sólo la emitía el simulador, ya
 *  etiquetada: **el sistema no sabía reconocer un solo dominio de VPN.**
 *
 *  ⚠ **Esto solo no enciende nada.** `FuenteNextDNS.leer()` sigue devolviendo
 *  vacío, así que hoy ningún dominio real llega hasta acá. Es la pieza de datos
 *  esperando a la fuente — y se puede escribir sin cuenta porque un dominio de
 *  VPN es el mismo mirado desde donde sea.
 *
 *  ─── ⚖ Por qué la lista es NUESTRA y corta ────────────────────────────────
 *
 *  La lista buena del rubro es `hagezi/dns-blocklists` (`doh-vpn-proxy-bypass`,
 *  **16.704 entradas, actualizada a diario**), y **NextDNS ya la aplica** en su
 *  función *Block Bypass Methods*. 🔴 Pero es **GPL-3.0**, y esto es un producto
 *  que se cobra: redistribuirla adentro no se hace sin mirar la licencia con
 *  alguien que sepa.
 *  ➡ **Por eso acá va una semilla propia** de los servicios más conocidos, y la
 *  lista completa la aporta NextDNS del otro lado cuando haya cuenta — aplicada
 *  por ellos, sin que nosotros redistribuyamos nada.
 *
 *  📌 Los 35 dominios se verificaron por resolución DNS el 28/8: **ninguno está
 *  inventado.** Eso prueba que existen, no que la lista esté completa. No lo
 *  está, y no pretende estarlo.
 */

/**
 * 🔴 **Dos clases, y mezclarlas costaría caro en la señal de peso 1.**
 *
 * - `vpn_o_proxy` — instalarlo es **un acto deliberado**. Es la evasión de la
 *   que habla el motor: nadie termina en NordVPN sin querer.
 * - `dns_alternativo` — **puede no ser del chico.** Firefox usa el DoH de
 *   Cloudflare por su cuenta en varios países, y algunos Android traen DNS
 *   privado de fábrica. Tratarlo como un acto deliberado sería alertar a una
 *   familia por una preferencia del navegador.
 *
 * ⚠ Quien escriba la traducción de NextDNS decide qué peso le da a cada una.
 * **Lo que este archivo no puede hacer es borrar la diferencia.**
 */
export type ClaseDeEvasion = "vpn_o_proxy" | "dns_alternativo";

const VPN_O_PROXY = [
  "nordvpn.com", "expressvpn.com", "surfshark.com", "protonvpn.com",
  "cyberghostvpn.com", "privateinternetaccess.com", "mullvad.net",
  "windscribe.com", "tunnelbear.com", "hide.me", "ipvanish.com", "purevpn.com",
  "hotspotshield.com", "zenmate.com", "betternet.co", "urban-vpn.com",
  "psiphon3.com", "ultrasurf.us", "vpngate.net", "touchvpn.net",
  /* 🔑 Ésta no salió de una lista: salió de una sesión real. La extensión
     1clickVPN fue la que rompió el login del dominio corto del curso el 27/8 —
     es exactamente el tipo de cosa que un chico instala de un clic. */
  "1clickvpn.net", "1clickvpn.com",
  "torproject.org",
  "croxyproxy.com", "kproxy.com", "proxysite.com", "hidemyass.com", "whoer.net",
];

const DNS_ALTERNATIVO = [
  "cloudflare-dns.com", "mozilla.cloudflare-dns.com", "dns.google",
  "dns.quad9.net", "doh.opendns.com", "dns.adguard.com", "dns.sb",
];

/**
 * ¿Este dominio es un intento de saltar el filtro? Devuelve de qué clase, o
 * `null` si no lo es.
 *
 * 📌 `dns.nextdns.io` **no está y no puede estar**: es el nuestro. Un chico
 * consultándolo es el sistema funcionando, no alguien esquivándolo.
 */
export function claseDeEvasion(dominio: string): ClaseDeEvasion | null {
  const d = dominio.trim().toLowerCase();
  if (VPN_O_PROXY.some((x) => d === x || d.endsWith(`.${x}`))) return "vpn_o_proxy";
  if (DNS_ALTERNATIVO.some((x) => d === x || d.endsWith(`.${x}`))) return "dns_alternativo";
  return null;
}
