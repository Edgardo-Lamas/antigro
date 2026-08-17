/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS CARTELES DEL TOUR, CON SUS CASOS — `npm run probar-tour`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Lo que se rompe acá no da error: se lee mal.** Un cartel que creció tres
 *  renglones sigue compilando, sigue apareciendo, y simplemente nadie lo lee.
 *  Y un tour que no se lee es peor que no tener tour, porque ocupa la pantalla
 *  del jurado en los primeros diez segundos.
 *
 *  🔑 Por eso el tope de largo se comprueba y no se confía. Si un texto no
 *  entra, **se reescribe el texto** — no se agranda el número.
 *
 *  ⚠ Y se comprueba que las anclas apunten a `id` que de verdad existen en la
 *  pantalla. El tour se saltea solo un ancla que no encuentra, así que un `id`
 *  mal escrito no rompe nada: hace que ese cartel deje de señalar, callado.
 */

import fs from "node:fs";
import { LARGO_MAXIMO, PASOS } from "./pasos-del-tour.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* ── 1. Cortitos, que es todo el pedido ─────────────────────────────────── */

for (const p of PASOS) {
  comprobar(
    `«${p.titulo}» entra en ${LARGO_MAXIMO} caracteres`,
    p.texto.length <= LARGO_MAXIMO,
    `son ${p.texto.length}: "${p.texto}"`,
  );
}

comprobar(
  "🔑 los títulos son de una línea — cinco palabras o menos",
  PASOS.every((p) => p.titulo.split(/\s+/).length <= 5),
  PASOS.map((p) => p.titulo).join(" · "),
);

comprobar(
  "ningún cartel viene vacío",
  PASOS.every((p) => p.titulo.trim() && p.texto.trim()),
);

/* ── 2. 🔴 El segundo cartel dice que no se leen los mensajes ───────────── */

/* No es un capricho del orden: si alguien abandona el tour después de dos
   carteles, eso es lo que se tiene que llevar. */
comprobar(
  "🔴 el segundo cartel es el que dice que no se lee contenido",
  /no lee|no leer|no lee un solo mensaje|no es contenido/i.test(
    `${PASOS[1]?.titulo} ${PASOS[1]?.texto}`,
  ),
  `salió: "${PASOS[1]?.titulo} — ${PASOS[1]?.texto}"`,
);

/* ── 3. Las anclas existen en la pantalla ───────────────────────────────── */

const pantallas = ["src/app/_demo/Consola.tsx", "src/app/page.tsx"]
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

for (const ancla of new Set(PASOS.map((p) => p.ancla).filter(Boolean))) {
  comprobar(
    `el ancla «${ancla}» existe en la pantalla`,
    pantallas.includes(`id="${ancla}"`),
    "un id que no está hace que ese cartel deje de señalar, y no avisa",
  );
}

/* ── 4. El recorrido cuenta una historia completa ───────────────────────── */

comprobar(
  "son entre 4 y 7 pasos — menos no cuenta nada, más no se termina",
  PASOS.length >= 4 && PASOS.length <= 7,
  `son ${PASOS.length}`,
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
