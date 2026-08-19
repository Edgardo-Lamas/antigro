/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CIRCUITO DEL ACUSE, DE PUNTA A PUNTA — 19/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Siembra un aviso con su token, simula el toque del botón contra el webhook
 *  real, y comprueba lo que quedó en la base.
 *
 *  🔑 **Prueba lo que `probar-acuse` no puede:** esa tanda prueba la REGLA con
 *  datos en memoria; esto prueba que el webhook **escuche el toque** —que hasta
 *  el 19/8 no lo hacía— y que el un-solo-uso lo garantice de verdad la base.
 *
 *  ⚠ Escribe en la Supabase de PRODUCCIÓN y limpia lo suyo al terminar.
 *  ⚠ Necesita `pg` y el servidor en el 3000.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync("/Users/edgardolamas/Desktop/Trabajos/antigro/.env.local", "utf8");
const leer = (k) => {
  const l = env.split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
};

const SECRETO = leer("TELEGRAM_WEBHOOK_SECRET");
if (!SECRETO) { console.error("falta TELEGRAM_WEBHOOK_SECRET"); process.exit(1); }

let fallaron = 0;
const ok = (n, c, d) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) { fallaron++; if (d) console.log(`    ${d}`); } };

const c = new pg.Client({
  connectionString: leer("POSTGRES_URL_NON_POOLING").replace(/\?sslmode=require/, ""),
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const TOKEN = `prueba-${Date.now()}`;
const { rows: chicos } = await c.query("select id, nombre from chicos limit 1");
if (chicos.length === 0) { console.error("no hay chicos"); process.exit(1); }
const chico = chicos[0];

/* ── Se siembra un aviso como el que dejaría `avisar()` ── */
await c.query(
  `insert into respuestas (chico_id, fecha, clase, canal, destino, texto,
                           senales_que_la_sostienen, entregado, acuse_token)
   values ($1, now(), 'alerta_adultos', 'telegram', '999999', $2, '{}', true, $3)`,
  [chico.id, "Aviso de prueba del circuito del acuse.", TOKEN],
);
console.log(`(sembrado un aviso para ${chico.nombre} con token de prueba)`);

const toque = (data) =>
  fetch("http://localhost:3000/api/telegram/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": SECRETO },
    body: JSON.stringify({
      callback_query: { id: "toque-de-prueba", data, message: { message_id: 1, chat: { id: 999999 } } },
    }),
  });

const acusadoEn = async () =>
  (await c.query("select acusado_en from respuestas where acuse_token = $1", [TOKEN])).rows[0]
    ?.acusado_en ?? null;

/* ── 1 · Antes de tocar nada ── */
ok("el aviso arranca sin acuse", (await acusadoEn()) === null);

/* ── 2 · El toque ── */
const r1 = await toque(`vi:${TOKEN}`);
const d1 = await r1.json();
ok("el webhook contesta 200 al toque", r1.status === 200, `dio ${r1.status}`);
ok("y dice que lo registró", d1.acuse === "registrado", JSON.stringify(d1));

const primera = await acusadoEn();
ok("quedó la fecha del acuse en la base", primera !== null);

/* ── 3 · El segundo toque. UN SOLO USO ── */
const d2 = await (await toque(`vi:${TOKEN}`)).json();
ok("el segundo toque NO vuelve a registrar", d2.acuse === "ya_estaba", JSON.stringify(d2));
ok(
  "y la fecha del acuse no se movió",
  String(await acusadoEn()) === String(primera),
  "Si se movió, el un-solo-uso no lo está garantizando la base.",
);

/* ── 4 · Un token inventado no abre nada ── */
const d3 = await (await toque("vi:token-que-no-existe")).json();
ok("un token inventado no registra nada", d3.acuse === undefined || d3.acuse === "ya_estaba", JSON.stringify(d3));

/* ── 5 · 🔐 Y sin el secreto de Telegram, no entra ── */
const sinSecreto = await fetch("http://localhost:3000/api/telegram/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ callback_query: { id: "x", data: `vi:${TOKEN}` } }),
});
ok("sin el secreto de Telegram, 401", sinSecreto.status === 401, `dio ${sinSecreto.status}`);

/* ── Limpieza ── */
const { rowCount } = await c.query("delete from respuestas where acuse_token = $1", [TOKEN]);
console.log(`(limpieza: ${rowCount} aviso de prueba borrado)`);
await c.end();

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
process.exit(fallaron ? 1 : 0);
