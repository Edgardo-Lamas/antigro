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
  "¿Cómo le hablo del tema sin que se cierre?",
  // 🔴 Estas dos ejercitan el material oficial nuevo (19/8): lo que hay que
  // hacer si el chico cuenta algo, y lo que hay que hacer si ya pasó.
  "Mi hija me contó que un tipo grande le escribe hace meses. ¿Qué hago?",
  "Encontré conversaciones feas en su teléfono. Ya las borré para que no las vea más. ¿Ahora qué?",
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
