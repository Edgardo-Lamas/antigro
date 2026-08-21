/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ALTA DE CERO, EN EL NAVEGADOR — 21/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La pregunta que la origina es de Edgardo, antes de mandarle el enlace a
 *  las psicólogas:** *"quiero estar tranquilo que ellas crean un correo y
 *  contraseña y automáticamente ingresan"*.
 *
 *  🔑 **Y `prueba-entrar.mjs` NO contesta eso.** Esa mira la puerta —que el
 *  cartel de error aparezca, que el ojo funcione, que la clave buena entre— y
 *  **a propósito no escribe en la base**. O sea que el camino que va a hacer
 *  una persona de verdad la primera vez —crear la cuenta y quedar adentro sin
 *  volver a loguearse— no lo estaba probando nadie.
 *
 *  Esta prueba hace ese camino entero y **borra la familia al terminar**, así
 *  se puede correr las veces que haga falta. ⚠ Igual gasta una de las **40
 *  altas por día** del tope global.
 *
 *      SITIO=https://antigro.vercel.app node prueba-alta.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync(new URL(".env.local", import.meta.url), "utf8");
const leer = (k) => {
  const l = env.split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
};

const SITIO = process.env.SITIO ?? "http://localhost:3000";
const INVITACION = leer("CODIGO_DE_INVITACION");
const BASE = leer("POSTGRES_URL_NON_POOLING");
if (!INVITACION || !BASE) {
  console.error("faltan CODIGO_DE_INVITACION o POSTGRES_URL_NON_POOLING en .env.local");
  process.exit(1);
}

/* Una cuenta distinta cada vez: si dos corridas usaran la misma, la segunda
   fallaría por email repetido y parecería un fallo del producto. */
const marca = Date.now();
const CUENTA = `prueba-alta-${marca}@ejemplo.invalid`;
const CLAVE = `prueba-${marca}`;

const fallos = [];
const ok = (n, c, d) => {
  console.log(`${c ? "✓" : "✗"} ${n}`);
  if (!c) {
    fallos.push(n);
    if (d) console.log(`    ${d}`);
  }
};

/* ⚠ El chromium que trae playwright no arranca en esta máquina (mac-x64 sin
   Rosetta): se usa el Chrome del sistema. */
const nav = await chromium.launch({ channel: "chrome" });
console.log(`(contra ${SITIO})\n`);
console.log(`cuenta de prueba: ${CUENTA}\n`);

try {
  const ctx = await nav.newContext({ viewport: { width: 620, height: 950 } });
  const pag = await ctx.newPage();

  /* ── 0 · 🔴 EL BOTÓN DE LA HOME DICE LA VERDAD ────────────────────────
     Sin código prometía «Entrar o empezar» y abría un logueo donde empezar no
     se puede. Con código tiene que arrastrarlo, para poder mandar el enlace
     del SITIO y no el de la puerta. */
  await pag.goto(SITIO);
  await pag.waitForTimeout(2500);
  const pelada = await pag.locator("body").innerText();
  ok(
    "🔴 sin código, el botón NO promete «empezar»",
    /Entrar a mi familia/i.test(pelada) && !/Entrar o empezar/i.test(pelada),
    pelada.slice(0, 160).replace(/\s+/g, " "),
  );

  await pag.goto(`${SITIO}/?i=${encodeURIComponent(INVITACION)}`);
  await pag.waitForTimeout(2500);
  ok(
    "🔑 con código, la home ofrece empezar",
    /Entrar o empezar/i.test(await pag.locator("body").innerText()),
  );

  await pag.getByRole("link", { name: /Entrar o empezar/i }).first().click();
  await pag.waitForTimeout(4000);
  ok(
    "🔴 y el código LLEGA a la puerta — se puede mandar el enlace del sitio",
    /Es mi primera vez/i.test(await pag.locator("body").innerText()),
    `quedó en: ${pag.url()}`,
  );

  /* ── 1 · Llega por el enlace y ve la puerta de crear ─────────────────── */
  await pag.goto(`${SITIO}/entrar?i=${encodeURIComponent(INVITACION)}`);
  await pag.getByLabel(/email/i).waitFor({ timeout: 30000 });
  const puerta = await pag.locator("body").innerText();
  ok("el enlace abre directo en «es mi primera vez»", /Poné en marcha el sistema/i.test(puerta));

  /* ── 2 · Crea la cuenta: correo, contraseña y los términos ───────────── */
  await pag.getByLabel(/email/i).fill(CUENTA);
  await pag.getByLabel(/^Contraseña$/i).fill(CLAVE);

  const boton = pag.getByRole("button", { name: /Crear|Empezar|marcha/i }).last();
  ok("🔴 el botón NO se habilita sin aceptar los términos", await boton.isDisabled());

  await pag.getByRole("checkbox").check();
  await pag.waitForTimeout(200);
  ok("y se habilita al aceptarlos", await boton.isEnabled());

  /* ── 3 · 🔴 LO QUE PREGUNTÓ EDGARDO: queda adentro sin volver a loguearse ── */
  await boton.click();

  let entroSolo = true;
  try {
    await pag.waitForURL("**/alta", { timeout: 45000 });
  } catch {
    entroSolo = false;
  }
  ok(
    "🔴 crea la cuenta y ENTRA SOLA — no vuelve a pedir logueo",
    entroSolo,
    `quedó en: ${pag.url()}`,
  );

  const recorrido = await pag.locator("body").innerText();
  ok(
    "🔑 y cae en el recorrido, no en un panel vacío",
    /simulador|reloj|semana|escenario/i.test(recorrido),
    recorrido.slice(0, 220).replace(/\s+/g, " "),
  );

  /* ── 4 · La sesión es de verdad: el panel no la rebota ───────────────── */
  await pag.goto(`${SITIO}/mi-familia`);
  await pag.waitForTimeout(3000);
  ok(
    "la sesión sirve en todo el sistema, no sólo en el recorrido",
    !pag.url().includes("/entrar") && !pag.url().includes("/login"),
    `quedó en: ${pag.url()}`,
  );

  /* ── 5 · 🔴 Y VUELVE A ENTRAR AL DÍA SIGUIENTE ────────────────────────
     Sin esto, «entró» podría significar sólo que la sesión de ese momento
     quedó abierta. Navegador limpio, sin nada guardado. */
  const ctx2 = await nav.newContext({ viewport: { width: 620, height: 950 } });
  const pag2 = await ctx2.newPage();
  await pag2.goto(`${SITIO}/entrar`);
  await pag2.getByLabel(/email/i).fill(CUENTA);
  await pag2.getByLabel(/^Contraseña$/i).fill(CLAVE);
  await pag2.getByRole("button", { name: /^Entrar$/i }).click();
  await pag2.waitForTimeout(6000);
  ok(
    "🔴 y con esas credenciales vuelve a entrar desde cero",
    !pag2.url().includes("/entrar"),
    `quedó en: ${pag2.url()}`,
  );
} finally {
  await nav.close();
}

/* ── 6 · Limpieza: la familia de prueba NO se queda en producción ─────────
   `delete from familias` cascadea a chicos, adultos y usuarios. */
const cli = new pg.Client({
  connectionString: BASE.replace(/[?&]sslmode=require/, ""),
  ssl: { rejectUnauthorized: false },
});
await cli.connect();
const { rows } = await cli.query("select familia_id from usuarios where email = $1", [CUENTA]);
if (rows.length === 0) {
  ok("⚠ no había familia que borrar (la cuenta no llegó a crearse)", fallos.length > 0);
} else {
  await cli.query("delete from familias where id = $1", [rows[0].familia_id]);
  const { rows: quedan } = await cli.query("select 1 from usuarios where email = $1", [CUENTA]);
  ok("🧹 la familia de prueba se borró de producción", quedan.length === 0);
}
await cli.end();

console.log(`\n${fallos.length === 0 ? "todo bien" : `${fallos.length} fallaron`}`);
if (fallos.length > 0) process.exit(1);
