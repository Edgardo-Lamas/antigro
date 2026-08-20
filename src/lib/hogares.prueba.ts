/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS PUERTAS DE LA CASA, CON SUS CASOS — `npm run probar-hogares`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Acá lo que se rompe no se ve, y es lo peor que puede romperse en este
 *  producto: una puerta.** Si «cerrar» dejara cerrar una entrada que la otra
 *  casa ya usa, un progenitor podría sacar al otro del informe de su hijo — que
 *  es exactamente lo que el diseño del 18/8 existe para impedir, con la ley al
 *  lado. Y no daría error: se vería como que anduvo.
 *
 *  Por eso las reglas viven en `hogares.ts`, sin base y sin pantalla, y se
 *  comprueban una por una.
 */

import {
  CLAVE_MINIMA,
  COMO_SE_LEE,
  LARGO_MAXIMO_DE_CASA,
  PUERTAS_POR_FAMILIA,
  QUE_SE_REGISTRA,
  comoSeLlama,
  porQueNoSePuedeCerrar,
  revisarClaveNueva,
  revisarNombreDeCasa,
  sePuedeAbrirOtraPuerta,
  sePuedeCerrar,
  type Puerta,
} from "./hogares.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const AYER = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const CREADO = "2026-08-20T12:00:00.000Z";

function puerta(p: Partial<Puerta> = {}): Puerta {
  return {
    id: "u1",
    hogar: null,
    esLaMia: false,
    ultimoAcceso: null,
    creado: CREADO,
    ...p,
  };
}

/* ── Cómo se nombra una casa ─────────────────────────────────────────────── */

comprobar(
  "sin nombre, la mía se dice «esta casa» — no se inventa un nombre",
  comoSeLlama(puerta({ esLaMia: true })) === "esta casa",
  `salió: ${comoSeLlama(puerta({ esLaMia: true }))}`,
);

comprobar(
  "sin nombre, la otra se dice «la otra casa»",
  comoSeLlama(puerta({ esLaMia: false })) === "la otra casa",
);

comprobar(
  "con nombre, gana el nombre",
  comoSeLlama(puerta({ hogar: "Casa de papá", esLaMia: true })) === "Casa de papá",
);

comprobar(
  "un nombre con espacios de más se limpia",
  comoSeLlama(puerta({ hogar: "  Casa de mamá  " })) === "Casa de mamá",
);

comprobar(
  "🔑 un nombre en blanco NO cuenta como nombre",
  comoSeLlama(puerta({ hogar: "   ", esLaMia: true })) === "esta casa",
);

/* ── Cuántas puertas ─────────────────────────────────────────────────────── */

comprobar("con una puerta se puede abrir la segunda", sePuedeAbrirOtraPuerta([puerta()]));

comprobar(
  "🔴 con dos puertas NO se abre una tercera: un chico vive en una casa o en dos",
  !sePuedeAbrirOtraPuerta([puerta({ id: "u1" }), puerta({ id: "u2" })]),
);

comprobar("y el tope es dos, escrito una sola vez", PUERTAS_POR_FAMILIA === 2);

/* ── 🔴 CERRAR UNA PUERTA — la comprobación que sostiene todo el diseño ──── */

const mia = puerta({ id: "u1", esLaMia: true, ultimoAcceso: AYER, hogar: "Casa de mamá" });
const otraSinUsar = puerta({ id: "u2", hogar: "Casa de papá" });
const otraUsada = puerta({ id: "u2", hogar: "Casa de papá", ultimoAcceso: AYER });

comprobar(
  "🔴 una puerta que la otra casa YA USÓ no se cierra — nadie saca al otro del informe",
  !sePuedeCerrar(otraUsada, [mia, otraUsada]),
);

comprobar(
  "y el motivo lo dice, en vez de fallar callado",
  (porQueNoSePuedeCerrar(otraUsada, [mia, otraUsada]) ?? "").includes("es de esa casa"),
  `salió: ${porQueNoSePuedeCerrar(otraUsada, [mia, otraUsada])}`,
);

comprobar(
  "🔑 una que nadie usó SÍ se cierra: es corregir un correo mal tipeado, no sacar a nadie",
  sePuedeCerrar(otraSinUsar, [mia, otraSinUsar]),
  `motivo: ${porQueNoSePuedeCerrar(otraSinUsar, [mia, otraSinUsar])}`,
);

comprobar(
  "🔴 la puerta propia NO se cierra, aunque figure sin usar",
  !sePuedeCerrar(puerta({ id: "u1", esLaMia: true }), [
    puerta({ id: "u1", esLaMia: true }),
    otraSinUsar,
  ]),
);

comprobar(
  "🔴 la única puerta de la familia NO se cierra nunca",
  !sePuedeCerrar(otraSinUsar, [otraSinUsar]),
);

/* ── El nombre de la casa ────────────────────────────────────────────────── */

comprobar(
  "un nombre vacío se rechaza",
  revisarNombreDeCasa("   ", []) !== null,
);

comprobar(
  "🔴 dos casas no se pueden llamar igual: el nombre es lo que distingue quién aportó qué",
  revisarNombreDeCasa("Casa de papá", [otraSinUsar]) !== null,
);

comprobar(
  "y la comparación no se deja engañar por mayúsculas ni espacios",
  revisarNombreDeCasa("  CASA DE PAPÁ ", [otraSinUsar]) !== null,
);

comprobar(
  "un nombre distinto pasa",
  revisarNombreDeCasa("Casa de mamá", [otraSinUsar]) === null,
  `salió: ${revisarNombreDeCasa("Casa de mamá", [otraSinUsar])}`,
);

comprobar(
  "un nombre larguísimo se rechaza",
  revisarNombreDeCasa("x".repeat(LARGO_MAXIMO_DE_CASA + 1), []) !== null,
);

comprobar(
  "🔑 una casa sin nombre no bloquea el nombre de la otra",
  revisarNombreDeCasa("Casa de papá", [puerta({ hogar: null })]) === null,
);

/* ── La clave ────────────────────────────────────────────────────────────── */

comprobar(
  "una clave corta se rechaza",
  revisarClaveNueva("1234567", "1234567") !== null,
);

comprobar(
  "una clave de ocho pasa",
  revisarClaveNueva("12345678", "12345678") === null,
  `salió: ${revisarClaveNueva("12345678", "12345678")}`,
);

comprobar("y el mínimo es ocho, escrito una sola vez", CLAVE_MINIMA === 8);

comprobar(
  "si no coinciden, lo dice",
  (revisarClaveNueva("12345678", "12345679") ?? "").includes("no coinciden"),
);

comprobar(
  "🔴 la clave nueva no puede ser la que ya tenía",
  revisarClaveNueva("12345678", "12345678", "12345678") !== null,
);

comprobar(
  "⚠ y ese caso se dice como lo que es —no la cambiaste—, no como un error de tipeo",
  (revisarClaveNueva("12345678", "12345678", "12345678") ?? "").includes("ya tenías"),
  `salió: ${revisarClaveNueva("12345678", "12345678", "12345678")}`,
);

comprobar(
  "cambiándola de verdad, pasa",
  revisarClaveNueva("clave-nueva-larga", "clave-nueva-larga", "12345678") === null,
);

/* ── El registro ─────────────────────────────────────────────────────────── */

comprobar(
  "🔴 el cuestionario NO se registra acá: ya firma en observaciones",
  !QUE_SE_REGISTRA.some((q) => q.includes("cuestionario")),
);

comprobar(
  "🔴 y no se registra NADA de mirar: ni el informe, ni el asistente, ni las señales",
  !QUE_SE_REGISTRA.some(
    (q) => q.includes("mir") || q.includes("ley") || q.includes("abrio_el") || q.includes("vio"),
  ),
  `están: ${QUE_SE_REGISTRA.join(", ")}`,
);

for (const q of QUE_SE_REGISTRA) {
  comprobar(`«${q}» tiene cómo leerse en pantalla`, Boolean(COMO_SE_LEE[q]));
}

comprobar(
  "🔑 y ninguno tiene sujeto: el sistema sabe desde qué casa, no cuál de los dos padres",
  QUE_SE_REGISTRA.every((q) => COMO_SE_LEE[q].startsWith("Se ")),
  `salió: ${QUE_SE_REGISTRA.map((q) => COMO_SE_LEE[q]).join(" · ")}`,
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
