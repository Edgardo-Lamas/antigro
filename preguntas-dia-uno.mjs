/**
 * Las preguntas que un padre hace el PRIMER DÍA, contra el asistente real.
 * Con lectura de día 1 y sin cuestionario: el peor escenario de datos.
 */
/* ⚠ tsx no carga `.env.local` como hace Next: hay que meterlo a mano. */
import { readFileSync } from "node:fs";
for (const linea of readFileSync("/Users/edgardolamas/Desktop/Trabajos/antigro/.env.local", "utf8").split("\n")) {
  const i = linea.indexOf("=");
  if (i > 0 && !linea.trimStart().startsWith("#")) {
    process.env[linea.slice(0, i).trim()] ||= linea.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

const { responderAlAdulto } = await import("/Users/edgardolamas/Desktop/Trabajos/antigro/src/lib/ia/index.ts");
const { evaluar } = await import("/Users/edgardolamas/Desktop/Trabajos/antigro/src/lib/motor/index.ts");

const lectura = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [],
  hasta: new Date(),
  diasObservados: 1,
});

const PREGUNTAS = [
  "¿Esto lee los mensajes de mi hija?",
  "¿Qué es el grooming exactamente? Nunca lo tuve muy claro.",
  "Recién lo instalé y no dice nada. ¿Está funcionando?",
  "¿Cómo le hablo del tema sin que se cierre?",
];

for (const p of PREGUNTAS) {
  const r = await responderAlAdulto({ pregunta: p, historia: [], chico: { nombre: "Ana", edad: 12 }, lectura });
  console.log("═".repeat(78));
  console.log("👤", p);
  console.log("   [origen:", r.origen, r.causa ? `· causa: ${r.causa}` : "", "]");
  console.log();
  console.log(r.texto);
  console.log();
}
