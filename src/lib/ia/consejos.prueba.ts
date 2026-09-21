/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HASTA DÓNDE LLEGA UN CONSEJO — `npm run probar-consejos`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Esta tanda existe porque el 21/9 los consejos empezaron a cruzar la
 *  frontera.** Hasta entonces cada país veía sólo los suyos y no había nada que
 *  pudiera salir mal; ahora un consejo marcado `universal` viaja, y **el error
 *  posible dejó de ser cosmético**: mandar a un padre de Madrid a «la fiscalía
 *  más cercana» es mandarlo a un lugar que con ese nombre no existe, y darle un
 *  teléfono argentino en el peor momento es darle un número que no atiende.
 *
 *  🔑 **Lo que se prueba no es que la lista esté completa: es que nada que
 *  nombre un órgano, un teléfono o una ley pueda escaparse marcado
 *  `universal`.** Esa marca la pone una persona a mano, así que el día que
 *  alguien agregue una recomendación con un número adentro, esto se pone rojo
 *  antes de que llegue a un padre.
 *
 *  ⚠ Es la misma disciplina de `reglas.prueba.ts`: cada regla entra con su caso
 *  que pasa y su caso que se frena.
 */

import {
  FUENTES_POR_PAIS,
  recomendacionesParaElPrompt,
  type Recomendacion,
} from "./recomendaciones.ts";
import { type Pais } from "../paises.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const paises = Object.keys(FUENTES_POR_PAIS) as Pais[];
const todas: { pais: Pais; organismo: string; r: Recomendacion }[] = [];
for (const pais of paises) {
  for (const f of FUENTES_POR_PAIS[pais]) {
    for (const r of f.recomendaciones) todas.push({ pais, organismo: f.organismo, r });
  }
}

console.log(`\n── ${todas.length} recomendaciones en ${paises.length} países ──\n`);

/* ── 1. 🔴 Ninguna universal nombra algo que sea de un solo país ────────── */

/**
 * 🔑 **El corazón de la tanda.** Si una recomendación marcada `universal` trae
 * adentro un teléfono, una ley o un órgano, ese texto se le va a mostrar a
 * alguien de otro país como si le sirviera.
 */
const LO_QUE_NO_PUEDE_VIAJAR: { nombre: string; patron: RegExp }[] = [
  { nombre: "un teléfono", patron: /\b\d{3}[\s.-]?\d{3,4}[\s.-]?\d{0,4}\b|\bl[ií]nea\s+\d+/i },
  { nombre: "una ley con número", patron: /\bley(?:\s+org[áa]nica)?\s+n?[.º°]?\s*\d|\bart[íi]culo\s+\d|\bart\.\s*\d/i },
  { nombre: "un órgano judicial o policial", patron: /\bfiscal[íi]a|\bcomisar[íi]a|\bjuzgado|\bguardia civil|\bpolic[íi]a nacional|\bcarabineros/i },
  { nombre: "un organismo con nombre propio", patron: /\bINCIBE\b|\bANAR\b|\bAEPD\b|\bIS4K\b|\bUFECI\b|\bGAPP\b|\bministerio\b/i },
  { nombre: "un país", patron: /\bargentin|\bespañ|\bespanol/i },
];

const universales = todas.filter((x) => x.r.alcance === "universal");
const filtradas: string[] = [];

for (const { pais, r } of universales) {
  for (const { nombre, patron } of LO_QUE_NO_PUEDE_VIAJAR) {
    if (patron.test(r.texto)) {
      filtradas.push(`[${pais}] nombra ${nombre}: "${r.texto.slice(0, 70)}…"`);
    }
  }
}
comprobar(
  `🔴 ninguna de las ${universales.length} universales nombra un teléfono, una ley, un órgano ni un país`,
  filtradas.length === 0,
  filtradas.slice(0, 4).join(" | "),
);

/* ── 2. Y el caso que SÍ se tiene que frenar, para saber que el filtro mira ── */

/**
 * ⚠ Sin este caso no se sabe si la comprobación de arriba hace algo. Es la
 * mitad que falta en cualquier regla: el caso que pasa y el que se frena.
 */
const TRAMPAS = [
  "Denunciá al acosador en la fiscalía o comisaría más cercana.",
  "Llamá a la línea 137 si necesitás ayuda.",
  "La Ley 26.904 tipifica el grooming como delito.",
  "Contactá a INCIBE por el 017.",
];
const cazadas = TRAMPAS.filter((t) => LO_QUE_NO_PUEDE_VIAJAR.some((x) => x.patron.test(t)));
comprobar(
  "…y el filtro de verdad las caza: las 4 trampas dan positivo",
  cazadas.length === TRAMPAS.length,
  `cazó ${cazadas.length} de ${TRAMPAS.length}`,
);

/* ── 3. 🔴 Lo marcado `del_pais` NO aparece en el prompt de otro país ───── */

const delPais = todas.filter((x) => x.r.alcance === "del_pais");
comprobar(
  "hay al menos una recomendación marcada `del_pais` (si no, la marca no se usa)",
  delPais.length > 0,
);

const escapadas: string[] = [];
for (const { pais, r } of delPais) {
  for (const otro of paises.filter((p) => p !== pais)) {
    if (recomendacionesParaElPrompt(otro).includes(r.texto)) {
      escapadas.push(`"${r.texto.slice(0, 50)}…" (de ${pais}) se coló en el prompt de ${otro}`);
    }
  }
}
comprobar(
  "🔴 ninguna `del_pais` se cuela en el prompt de otro país",
  escapadas.length === 0,
  escapadas.join(" | "),
);

/* ── 4. 🔑 Un país sin fuentes propias ya no se queda mudo ──────────────── */

/**
 * Era el estado de España hasta el 21/9: `FUENTES_POR_PAIS.ES` en `[]`, y el
 * asistente sin un solo consejo respaldado que ofrecer.
 */
for (const pais of paises) {
  const prompt = recomendacionesParaElPrompt(pais);
  const sinFuentesPropias = FUENTES_POR_PAIS[pais].length === 0;
  if (sinFuentesPropias) {
    comprobar(
      `🔑 ${pais} no tiene organismos propios y AUN ASÍ recibe consejos universales`,
      prompt.includes("ANTES DE QUE PASE NADA") && prompt.length > 500,
      `${prompt.length} caracteres`,
    );
  }
  comprobar(
    `${pais}: el prompt no queda vacío`,
    prompt.trim().length > 0,
  );
}

/* ── 5. 🔴 Cuando hay prestadas, la advertencia de citar VA SIEMPRE ─────── */

/**
 * 🔑 **Es lo único que impide el error grave:** que el modelo le presente a un
 * padre de Sevilla un organismo argentino como si fuera su autoridad. El
 * criterio se puede ofrecer; la autoridad no se puede inventar.
 */
for (const pais of paises) {
  const hayPrestadas = paises
    .filter((p) => p !== pais)
    .some((p) => FUENTES_POR_PAIS[p].some((f) => f.recomendaciones.some((r) => r.alcance === "universal")));
  if (!hayPrestadas) continue;

  const prompt = recomendacionesParaElPrompt(pais);
  comprobar(
    `🔴 ${pais}: el prompt avisa que no presente un organismo de otro país como autoridad propia`,
    prompt.includes("ATENCIÓN AL CITAR") && prompt.includes("NUNCA las presentes"),
  );
  comprobar(
    `🔴 ${pais}: y prohíbe derivar a teléfonos o trámites de esas fuentes`,
    prompt.includes("NO derives"),
  );
  comprobar(
    `${pais}: las prestadas se identifican con su país al lado del organismo`,
    /\(.+ — (Argentina|España)\)/.test(prompt),
  );
}

/* ── 6. Todo país declarado tiene una entrada, aunque esté vacía ────────── */

/* 📌 `Pais` es un tipo, no una lista en tiempo de ejecución, así que lo que se
   puede comprobar es que toda entrada del catálogo tenga forma de lista. Un país
   nuevo sin entrada lo caza el typecheck, porque `FUENTES_POR_PAIS` es un
   `Record<Pais, …>` y TypeScript exige la clave. */
comprobar(
  "🔴 toda entrada del catálogo es una lista, aunque esté vacía",
  paises.every((p) => Array.isArray(FUENTES_POR_PAIS[p])),
);

console.log(fallaron === 0 ? "\ntodo bien" : `\n${fallaron} fallaron`);
process.exit(fallaron === 0 ? 0 : 1);
