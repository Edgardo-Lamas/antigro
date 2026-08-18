/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS TÉRMINOS, CON SUS CASOS — `npm run probar-terminos`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Lo que se rompe acá no da error de compilación: queda escrito.** Un
 *  documento legal es el lugar donde una frase de más cambia lo que el producto
 *  promete, y nadie se entera hasta que alguien la usa en contra.
 *
 *  🔑 **La comprobación que importa de verdad es la de las cláusulas de
 *  exención.** La tentación —en cualquier sesión futura, con cualquier apuro—
 *  va a ser agregar un «AntiGro no se responsabiliza por…». El art. 37 de la
 *  Ley 24.240 tiene esas cláusulas por no convenidas: no protegen, y de paso
 *  dejan al proveedor explicando por qué las escribió. Si alguna vez alguien la
 *  escribe, esta tanda se pone en rojo antes de que llegue a producción.
 *
 *  ⚠ También se comprueba que cada cita legal exista en `src/lib/legal.ts`. Una
 *  cita que no resuelve se renderiza vacía: la pantalla queda afirmando algo con
 *  el respaldo desaparecido, que es peor que no citar nada.
 */

import { NORMAS } from "../../lib/legal.ts";
import { LARGO_MAXIMO_PARRAFO, SECCIONES, VERSION } from "./terminos.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const TODO_EL_TEXTO = SECCIONES.flatMap((s) => [s.bajada, ...s.parrafos, ...(s.declaraciones ?? [])])
  .join(" ")
  .toLowerCase();

/* ── 1. 🔴 Nada que nos exima. Es el motivo de esta tanda ────────────────── */

/**
 * 🔑 Cada frase de acá la tacharía el art. 37, inc. a o b. Están escritas en
 * masculino y femenino donde hace falta porque lo que se busca es el giro, no
 * la palabra exacta.
 *
 * ⚠ **Ojo con lo que NO está en esta lista, y es a propósito:** «no detecta»,
 * «no puede», «no reemplaza» son descripciones del alcance real del sistema, y
 * ésas hay que escribirlas. La diferencia es entre decir qué hace el producto y
 * pretender que el daño no es de uno.
 */
const CLAUSULAS_QUE_NO_VAN = [
  "no nos hacemos responsables",
  "no nos hacemos cargo de",
  "no se hace responsable",
  "no será responsable",
  "no seremos responsables",
  "en ningún caso será responsable",
  "deslinda",
  "deslindamos",
  "exime de responsabilidad",
  "eximimos",
  "bajo su exclusiva responsabilidad",
  "renuncia a reclamar",
  "renuncia expresamente",
];

for (const frase of CLAUSULAS_QUE_NO_VAN) {
  /* 🔴 La sección «límites» habla de esto para explicar por qué NO está, y esa
     mención es legítima. Se la excluye del barrido para que explicar la regla
     no sea lo que la rompe. */
  const sinLaExplicacion = SECCIONES.filter((s) => s.id !== "limites")
    .flatMap((s) => [s.bajada, ...s.parrafos, ...(s.declaraciones ?? [])])
    .join(" ")
    .toLowerCase();

  comprobar(`🔴 no aparece la cláusula «${frase}»`, !sinLaExplicacion.includes(frase));
}

/* ── 2. Las citas legales existen ────────────────────────────────────────── */

const IDS_DE_NORMAS = new Set(NORMAS.map((n) => n.id));

for (const seccion of SECCIONES) {
  for (const id of seccion.normas ?? []) {
    comprobar(`la cita «${id}» de «${seccion.titulo}» existe en legal.ts`, IDS_DE_NORMAS.has(id));
  }
}

for (const n of NORMAS) {
  comprobar(
    `la norma «${n.id}» trae texto, enlace y fecha de verificación`,
    Boolean(n.texto.trim() && n.url.startsWith("http") && /^\d{4}-\d{2}-\d{2}$/.test(n.verificado)),
    `texto ${n.texto.length} · url ${n.url} · verificado ${n.verificado}`,
  );
}

/* ── 3. Las secciones que no pueden faltar ───────────────────────────────── */

/**
 * 🔴 Si alguna de éstas desaparece, el documento deja de cubrir lo que se
 * discutió el 18/8 con Edgardo. Están por `id` y no por título para que se
 * pueda reescribir el título sin romper la comprobación.
 */
const OBLIGATORIAS = [
  "que-es",
  "datos",
  "quien-da-de-alta",
  "el-otro-progenitor",
  "registro",
  "la-familia",
  "baja",
  "limites",
];

const IDS = new Set(SECCIONES.map((s) => s.id));
for (const id of OBLIGATORIAS) {
  comprobar(`está la sección «${id}»`, IDS.has(id));
}

comprobar("no hay dos secciones con el mismo id", IDS.size === SECCIONES.length);

/* ── 4. Lo que el documento tiene que decir sí o sí ──────────────────────── */

comprobar(
  "🔴 dice que no se lee el contenido de los mensajes",
  TODO_EL_TEXTO.includes("no ve, no guarda y no puede leer el contenido de los mensajes"),
);

comprobar("nombra la Línea 137", TODO_EL_TEXTO.includes("línea 137"));

comprobar(
  "dice que no es un detector de grooming",
  TODO_EL_TEXTO.includes("no es un detector de grooming"),
);

comprobar(
  "dice que no es prueba judicial",
  TODO_EL_TEXTO.includes("no es prueba judicial"),
);

comprobar(
  "🔑 hay una declaración de responsabilidad parental o tutela",
  SECCIONES.some((s) =>
    (s.declaraciones ?? []).some(
      (d) => d.toLowerCase().includes("responsabilidad parental") && d.toLowerCase().includes("tutela"),
    ),
  ),
);

comprobar(
  "🔑 la segunda entrada, una vez abierta, no se puede cerrar",
  TODO_EL_TEXTO.includes("no la puede cerrar"),
);

comprobar(
  "avisa que esto no es asesoramiento legal",
  TODO_EL_TEXTO.includes("no es asesoramiento legal"),
);

/* ── 5. Que se pueda leer ────────────────────────────────────────────────── */

for (const seccion of SECCIONES) {
  comprobar(
    `«${seccion.titulo}» tiene bajada y al menos un párrafo`,
    Boolean(seccion.bajada.trim()) && seccion.parrafos.length > 0,
  );

  for (const p of seccion.parrafos) {
    comprobar(
      `un párrafo de «${seccion.id}» entra en ${LARGO_MAXIMO_PARRAFO} caracteres`,
      p.length <= LARGO_MAXIMO_PARRAFO,
      `son ${p.length}: "${p.slice(0, 90)}…"`,
    );
  }
}

comprobar(
  "la versión del documento es una fecha",
  /^\d{4}-\d{2}-\d{2}$/.test(VERSION),
  VERSION,
);

console.log(
  fallaron === 0
    ? `\n✅ ${SECCIONES.length} secciones y ${NORMAS.length} normas, todo en orden.`
    : `\n❌ ${fallaron} comprobaciones fallaron.`,
);

process.exit(fallaron === 0 ? 0 : 1);
