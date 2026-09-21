/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE ES CADA SITIO, CON SUS CASOS — `npm run probar-categorias`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **La comprobación central no es «tinder.com da dating».** Es que **las
 *  categorías que el sistema decidió usar sigan existiendo con ese nombre en la
 *  lista de UT1**. La lista es de afuera y se actualiza todos los días: el día
 *  que renombren `stalkerware` o partan `dating` en dos, el motor dejaría de
 *  leer esa señal **sin que se rompa nada y sin que nadie se entere**. Esta
 *  tanda se pone roja ese día.
 *
 *  🔴 **Y la otra que importa: que no haya un dominio de nivel superior genérico
 *  catalogado.** UT1 tiene enteros `xxx`, `porn`, `sex` y `adult`, y está bien.
 *  Pero si un día entrara `com`, la búsqueda por sufijo le pondría esa etiqueta
 *  a medio internet. Acá se mira.
 *
 *  📌 **Sin índice, esta tanda avisa y no falla.** `datos/ut1.bin` se genera al
 *  compilar (`npm run ut1`), no se versiona: hacerla fallar por un archivo que
 *  no está en el repositorio sería ruido.
 */

/* ⚠ Ruta relativa y con extensión: estas tandas las corre node pelado. */
import { catalogoDeCategorias, categoriasDe, estadoDelIndice } from "./categorias.ts";
import { comoSeDice, desempatar, queEsEsteLugar } from "./criterio.ts";
import { puertaDe } from "./plataformas.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const estado = estadoDelIndice();
if (!estado.disponible) {
  console.log("⚠ No hay índice de categorías, así que esta tanda no corre.");
  console.log(`  Motivo: ${estado.motivo}`);
  console.log("  Se genera con: npm run ut1");
  process.exit(0);
}

console.log(
  `· Índice: ${estado.dominios?.toLocaleString("es-AR")} dominios · ${estado.categorias} categorías · ` +
    `lista del ${estado.alDia?.slice(0, 10)}\n`,
);

/* ── 1. Las categorías que el sistema decidió usar tienen que existir ────── */

/* 🔑 Salen de la tabla «qué hace el sistema con cada categoría», decidida por
   Edgardo el 21/9/2026 y escrita en el dossier, sección 02. Si una desaparece de
   UT1, el criterio que la nombra se queda hablando solo. */
const LAS_QUE_USA_EL_CRITERIO = [
  /* Hablan a la primera */
  "stalkerware", "dating", "phishing", "malware",
  /* Pesan fuerte y adelantan los días exigidos */
  "chat", "shortener", "filehosting", "redirector", "adult",
  /* Dan la línea base */
  "games", "social_networks",
  /* Otro riesgo: van al parte, no a la alerta */
  "gambling", "drogue",
  /* Protegen del falso positivo */
  "publicite", "update", "sexual_education",
  /* Evasión: completan lo que el motor ya mira */
  "vpn", "doh",
];

const catalogo = new Map(catalogoDeCategorias().map((c) => [c.nombre, c.dominios]));
const faltantes = LAS_QUE_USA_EL_CRITERIO.filter((c) => !catalogo.has(c));

comprobar(
  "🔑 las 18 categorías que usa el criterio siguen existiendo en la lista de hoy",
  faltantes.length === 0,
  `faltan: ${faltantes.join(", ")}`,
);

/* 🔴 Y que no vengan vacías: una categoría que existe pero quedó en cero es la
   misma ceguera, sin el aviso. */
const vacias = LAS_QUE_USA_EL_CRITERIO.filter((c) => catalogo.has(c) && (catalogo.get(c) ?? 0) === 0);

comprobar(
  "🔴 y ninguna de ellas vino vacía",
  vacias.length === 0,
  `vacías: ${vacias.join(", ")}`,
);

/* Los dominios de ejemplo son sólo de las categorías ESTABLES. `phishing` y
   `malware` cambian todos los días a propósito: anclar uno haría fallar la tanda
   sola la semana que viene, que es la forma más rápida de que nadie la mire. */
const UNO_DE_CADA: Record<string, string> = {
  stalkerware: "mspy.com",
  dating: "tinder.com",
  chat: "omegle.com",
  shortener: "bit.ly",
  adult: "pornhub.com",
  games: "roblox.com",
  social_networks: "whatsapp.com",
  vpn: "nordvpn.com",
};

const sinRespaldo: string[] = [];
for (const [categoria, ejemplo] of Object.entries(UNO_DE_CADA)) {
  const lectura = categoriasDe(ejemplo);
  if (!lectura?.categorias.includes(categoria)) {
    sinRespaldo.push(`${categoria} (${ejemplo}: ${lectura?.categorias.join(", ") ?? "sin categoría"})`);
  }
}

comprobar(
  "🔑 y un sitio conocido de cada categoría estable contesta lo que tiene que contestar",
  sinRespaldo.length === 0,
  sinRespaldo.join(" · "),
);

/* ── 2. Las dos más filosas ─────────────────────────────────────────────── */

comprobar(
  "🔑 `dating` contesta — un chico en un sitio de citas es la señal más directa",
  categoriasDe("tinder.com")?.categorias.includes("dating") === true,
  `salió: ${categoriasDe("tinder.com")?.categorias.join(", ") ?? "nada"}`,
);

comprobar(
  "🔑 `stalkerware` contesta — es la única que ve a alguien actuando SOBRE el chico",
  categoriasDe("mspy.com")?.categorias.includes("stalkerware") === true,
  `salió: ${categoriasDe("mspy.com")?.categorias.join(", ") ?? "nada"}`,
);

/* ── 3. La búsqueda sube por el árbol, igual que el catálogo propio ──────── */

comprobar(
  "un subdominio hereda del dominio: www.tinder.com → tinder.com",
  categoriasDe("www.tinder.com")?.coincidio === "tinder.com",
  `coincidió con: ${categoriasDe("www.tinder.com")?.coincidio ?? "nada"}`,
);

comprobar(
  "🔑 y los dominios de nivel superior de contenido adulto están enteros: algo.xxx",
  categoriasDe("cualquiercosa.xxx")?.categorias.includes("adult") === true,
  `salió: ${categoriasDe("cualquiercosa.xxx")?.categorias.join(", ") ?? "nada"}`,
);

/* ── 4. 🔴 Ningún dominio de nivel superior genérico catalogado ──────────── */

const GENERICOS = ["com", "net", "org", "ar", "es", "com.ar", "io", "app"];
const catalogados = GENERICOS.filter((t) => categoriasDe(t) !== null);

comprobar(
  "🔴 ningún TLD genérico está catalogado — si entrara `com`, medio internet quedaría etiquetado",
  catalogados.length === 0,
  `catalogados: ${catalogados.map((t) => `${t} → ${categoriasDe(t)?.categorias.join(",")}`).join(" · ")}`,
);

/* ── 5. Lo que no está, no está ─────────────────────────────────────────── */

comprobar(
  "un dominio que no existe no inventa categoría",
  categoriasDe("esto-no-existe-en-ninguna-lista-12345.com") === null,
);

/* ── 6. 🔴 El catálogo propio manda sobre la lista de afuera ─────────────── */

comprobar(
  "🔴🔴 WhatsApp sigue siendo destino para nosotros, aunque UT1 lo llame red social",
  puertaDe("whatsapp.com") === "requiere_entrega" &&
    categoriasDe("whatsapp.com")?.categorias.includes("social_networks") === true,
  `puerta: ${puertaDe("whatsapp.com")} · UT1: ${categoriasDe("whatsapp.com")?.categorias.join(", ")}`,
);

comprobar(
  "🔴 y Snapchat sigue en contacto abierto, que es una decisión nuestra",
  puertaDe("snapchat.com") === "contacto_abierto",
  `puerta: ${puertaDe("snapchat.com")}`,
);

/* ── 7. Que la consulta no frene el análisis ─────────────────────────────── */

const arranque = Date.now();
for (let i = 0; i < 2000; i++) categoriasDe(`inventado${i}.ejemplo.com`);
const porConsulta = (Date.now() - arranque) / 2000;

comprobar(
  "🔑 el peor caso —un dominio que no está— tarda menos de un milisegundo",
  porConsulta < 1,
  `${porConsulta.toFixed(3)} ms por consulta`,
);

/* ── 8. El criterio: qué hace el sistema con cada categoría ─────────────── */

comprobar(
  "🔑 un sitio de citas habla a la primera, a cualquier edad — lo decidió él el 21/9",
  queEsEsteLugar("tinder.com")?.hace === "habla_a_la_primera",
  `salió: ${queEsEsteLugar("tinder.com")?.hace}`,
);

comprobar(
  "🔑 el software espía también, y es la única señal de alguien actuando SOBRE el chico",
  queEsEsteLugar("mspy.com")?.hace === "habla_a_la_primera",
  `salió: ${queEsEsteLugar("mspy.com")?.hace}`,
);

comprobar(
  "🔴 phishing y malware hablan, pero sólo después de un enlace: son 58 veces más superficie",
  desempatar(["phishing"]).criterio.condicion === "despues_de_un_enlace" &&
    desempatar(["malware"]).criterio.condicion === "despues_de_un_enlace",
);

comprobar(
  "un acortador pesa y adelanta los días exigidos, no habla solo",
  queEsEsteLugar("bit.ly")?.hace === "pesa_y_adelanta",
  `salió: ${queEsEsteLugar("bit.ly")?.hace}`,
);

comprobar(
  "las apuestas van al parte, no a la alerta — la alerta no se gasta",
  desempatar(["gambling"]).criterio.hace === "va_al_parte",
);

comprobar(
  "un juego da la línea base: suma el denominador, no el riesgo",
  queEsEsteLugar("roblox.com")?.hace === "linea_base",
  `salió: ${queEsEsteLugar("roblox.com")?.hace}`,
);

/* ── 9. 🔴 Los dos desempates, que salieron de mirar la lista de verdad ──── */

comprobar(
  "🔴🔴 la educación sexual le gana al contenido adulto — si no, la categoría no serviría de nada",
  desempatar(["adult", "sexual_education"]).categoria === "sexual_education" &&
    desempatar(["adult", "sexual_education"]).criterio.hace === "evita_el_falso_positivo",
  `mandó: ${desempatar(["adult", "sexual_education"]).categoria}`,
);

comprobar(
  "🔴 y es un caso real: cinco de los quince sitios de educación sexual están también en `adult`",
  queEsEsteLugar("kinseyconfidential.org")?.manda === "sexual_education",
  `categorías: ${queEsEsteLugar("kinseyconfidential.org")?.categorias.join(", ")} · mandó: ${queEsEsteLugar("kinseyconfidential.org")?.manda}`,
);

comprobar(
  "🔴 la publicidad descarta sólo cuando es lo único: con malware al lado, manda el riesgo",
  desempatar(["publicite"]).criterio.hace === "evita_el_falso_positivo" &&
    desempatar(["publicite", "malware"]).categoria === "malware",
  `sola: ${desempatar(["publicite"]).categoria} · con malware: ${desempatar(["publicite", "malware"]).categoria}`,
);

comprobar(
  "un dominio con varias categorías se queda con la que manda, pero las guarda todas",
  (queEsEsteLugar("badoo.com")?.categorias.length ?? 0) > 1 &&
    queEsEsteLugar("badoo.com")?.manda === "dating",
  `badoo: ${queEsEsteLugar("badoo.com")?.categorias.join(", ")} · mandó: ${queEsEsteLugar("badoo.com")?.manda}`,
);

comprobar(
  "🔑 una categoría sin uso identificado no se descarta: se guarda",
  desempatar(["cooking"]).criterio.hace === "se_guarda",
);

/* ── 10. ⚠ Cómo se dice: el hecho fechado, nunca la interpretación ──────── */

const frase = comoSeDice(queEsEsteLugar("tinder.com")!);

comprobar(
  "⚠ la frase dice que el teléfono CONSULTÓ, no que el chico entró",
  frase.includes("el teléfono consultó") && !frase.includes("entró"),
  frase,
);

comprobar(
  "⚠ y no interpreta: ni «tu hijo», ni «está siendo», ni «peligro»",
  !/tu hijo|está siendo|peligro|riesgo/i.test(frase),
  frase,
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
