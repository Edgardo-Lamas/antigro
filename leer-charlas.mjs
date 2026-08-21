/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LEER LAS CHARLAS CON EL ASISTENTE — 21/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **Lo pidió Edgardo antes de mandarle el enlace a las psicólogas:** *"¿podemos
 *  hacer que queden registradas las preguntas y respuestas de las psicólogas?"*.
 *
 *  🔑 **Registradas ya quedaban.** La tabla `charlas` guarda cada turno desde el
 *  16/8. Lo que no había era **dónde leerlas**: el panel de administración no las
 *  muestra, así que el material que él necesita para corregir `recomendaciones.ts`
 *  estaba en la base y no había forma de sacarlo sin escribir SQL a mano.
 *
 *  📌 Muestra también `origen` y `causa` de cada respuesta, que es lo que de
 *  verdad sirve para evaluar calidad: **una respuesta del respaldo no es una
 *  respuesta mala del asistente, es una respuesta que el asistente no dio.**
 *  Confundirlas haría que él corrija el prompt por algo que nunca escribió.
 *
 *      node leer-charlas.mjs            # todas
 *      node leer-charlas.mjs --frenadas # sólo las que el control frenó
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync(new URL(".env.local", import.meta.url), "utf8");
const leer = (k) => {
  const l = env.split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
};

const BASE = leer("POSTGRES_URL_NON_POOLING");
if (!BASE) {
  console.error("falta POSTGRES_URL_NON_POOLING en .env.local");
  process.exit(1);
}
const soloFrenadas = process.argv.includes("--frenadas");

const cli = new pg.Client({
  connectionString: BASE.replace(/[?&]sslmode=require/, ""),
  ssl: { rejectUnauthorized: false },
});
await cli.connect();

const { rows } = await cli.query(`
  select f.nombre as familia, c.familia_id, c.fecha, c.quien, c.texto, c.origen, c.causa
    from charlas c
    join familias f on f.id = c.familia_id
   order by c.familia_id, c.fecha
`);
await cli.end();

if (rows.length === 0) {
  console.log("No hay ninguna charla guardada todavía.\n");
  console.log("⚠ Ojo: eso NO prueba que nadie preguntó. «Borrar la charla» en el panel");
  console.log("  hace un delete de verdad, así que una charla borrada no deja rastro.");
  process.exit(0);
}

/* Agrupadas por familia: cada psicóloga se crea la suya, así que una familia
   es una persona probando. */
const porFamilia = new Map();
for (const r of rows) {
  if (!porFamilia.has(r.familia_id)) porFamilia.set(r.familia_id, []);
  porFamilia.get(r.familia_id).push(r);
}

const hora = (d) =>
  new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

let frenadas = 0;
let respuestas = 0;

for (const [id, turnos] of porFamilia) {
  const nombre = turnos[0].familia;
  console.log("\n" + "═".repeat(78));
  console.log(`👪 ${nombre}   ·   ${turnos.filter((t) => t.quien === "adulto").length} preguntas`);
  console.log("═".repeat(78));

  for (const t of turnos) {
    if (t.quien === "asistente") {
      respuestas++;
      if (t.causa === "control") frenadas++;
    }
    if (soloFrenadas && !(t.quien === "asistente" && t.causa === "control")) continue;

    if (t.quien === "adulto") {
      console.log(`\n👤 ${hora(t.fecha)}  ${t.texto}`);
    } else {
      /* 🔴 El sello importa tanto como el texto. Ver el encabezado. */
      const sello =
        t.origen === "respaldo"
          ? t.causa === "control"
            ? "⛔ RESPALDO · lo frenó el control"
            : "⚠ RESPALDO · se cayó la llamada"
          : "🤖 el asistente";
      console.log(`\n   [${sello}]`);
      console.log(
        t.texto
          .split("\n")
          .map((l) => "   " + l)
          .join("\n"),
      );
    }
  }
}

console.log("\n" + "═".repeat(78));
console.log(`${porFamilia.size} familia(s) · ${respuestas} respuestas · ${frenadas} frenadas por el control`);
if (frenadas > 0) {
  console.log("\n🔴 Las frenadas son las que hay que mirar primero: ahí el asistente escribió");
  console.log("   algo que la regla no dejó salir. Puede ser el control andando, o frenando de más.");
}
console.log("\n⚠ Lo que NO está acá: las charlas que alguien borró desde el panel.");
console.log("  «Borrar la charla» hace un delete de verdad y no deja rastro.");
