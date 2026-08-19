/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUESTIONARIO EN EL NAVEGADOR — recorrido completo, 19/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Entrar → el panel sin contestar → la firma → las nueve preguntas → guardar →
 *  la firma de vuelta en el panel.
 *
 *  🔑 **No reemplaza a `npm run probar`: encuentra otra clase de error.** La
 *  tanda cuida la lógica; esto cuida lo que sólo se ve mirando. En la primera
 *  corrida encontró que la firma mostraba la fecha en ISO («2026-08-19»), que
 *  es el MISMO error que ya se había corregido el 15/8 en otro lugar y que el
 *  typecheck no puede ver.
 *
 *  ⚠ **NO está en `npm run probar` y es a propósito, por tres motivos:**
 *  1. **Escribe en la Supabase de PRODUCCIÓN** — no hay base de desarrollo.
 *  2. Necesita `playwright` y `pg`, que no son dependencias del proyecto
 *     (`npm install playwright pg --no-save`, y `npx playwright install chromium`).
 *  3. Necesita el servidor levantado en el 3000.
 *
 *  ⚠ **Va `headless: false`**: el binario headless que baja Playwright en esta
 *  Mac es x64 y no arranca (`spawn Unknown system error -88`).
 *
 *  🔴 **Borra las observaciones de la familia de prueba antes de correr**, y
 *  sólo las de ella. Sin eso la segunda corrida arranca con el panel ya firmado
 *  y comprueba otra cosa que la primera.
 *
 *  La clave sale de `.env.local` y nunca se escribe acá: el repo es público.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const REPO = "/Users/edgardolamas/Desktop/Trabajos/antigro";
const env = readFileSync(`${REPO}/.env.local`, "utf8");
const leer = (k) => {
  const l = env.split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
};

const CLAVE = leer("CUENTAS_DE_PRUEBA_CLAVE");
if (!CLAVE) { console.error("no está CUENTAS_DE_PRUEBA_CLAVE"); process.exit(1); }

/* 🔴 Se limpia ANTES, no después: la prueba corre contra la Supabase de
   producción y tiene que poder repetirse. Sin esto, la segunda corrida arranca
   con el panel ya firmado y comprueba otra cosa que la primera. */
{
  const { default: pg } = await import("pg");
  const url = leer("POSTGRES_URL_NON_POOLING").replace(/\?sslmode=require/, "");
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  /* Sólo las del chico de la familia con la que entra esta prueba. Acotado a
     propósito: nada de tocar la tabla entera. */
  const { rowCount } = await c.query(
    `delete from observaciones where chico_id in (
       select ch.id from chicos ch
         join usuarios u on u.familia_id = ch.familia_id
        where u.email = $1)`,
    ["mariana@ejemplo.ar"],
  );
  console.log(`(limpieza: ${rowCount} observaciones de la familia de prueba)`);
  await c.end();
}

const SP = process.env.SP;
const nav = await chromium.launch({ headless: false });
const pag = await (await nav.newContext({ viewport: { width: 1100, height: 1400 } })).newPage();
const fallos = [];
const ok = (n, c, d) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) { fallos.push(n); if (d) console.log(`    ${d}`); } };

// ── 1 · Entrar ──────────────────────────────────────────────────────────
await pag.goto("http://localhost:3000/entrar");
await pag.getByLabel(/email/i).fill("mariana@ejemplo.ar");
await pag.getByLabel(/contrase/i).fill(CLAVE);
await pag.getByRole("button", { name: /entrar/i }).click();
await pag.waitForURL("**/mi-familia", { timeout: 20000 });
ok("entra al panel", pag.url().includes("/mi-familia"));

// ── 2 · El bloque nuevo en el panel, sin nadie que haya contestado ──────
const bloque = pag.locator("section", { hasText: "Lo que ven ustedes" }).first();
await bloque.waitFor({ timeout: 10000 });
const textoAntes = await bloque.innerText();
ok("el panel dice que nadie contestó", /nadie contestó/i.test(textoAntes));
ok("y ofrece la salida", /Contestar el cuestionario/i.test(textoAntes));
ok("nombra los patrones de conducta", /patrones de conducta/i.test(textoAntes));
await bloque.screenshot({ path: `${SP}/1-panel-sin-contestar.png` });

// ── 3 · Al cuestionario ─────────────────────────────────────────────────
await pag.getByRole("link", { name: /Contestar el cuestionario/i }).click();
await pag.waitForURL("**/mi-familia/cuestionario");
// ⚠ La pantalla arranca en «Cargando…»: hay que esperar al fetch.
await pag.getByText(/Quién está contestando/i).waitFor({ timeout: 15000 });

const firma = await pag.locator("main").innerText();
ok("la firma es lo primero", /Quién está contestando/i.test(firma));
ok("explica hecho vs. declaración", /desde qué casa/i.test(firma) && /lo decís vos/i.test(firma));
await pag.screenshot({ path: `${SP}/2-firma.png`, fullPage: true });

// Elegir firmante (si hay más de uno, el primero)
const botonesFirmante = pag.locator("main section button");
const cuantos = await botonesFirmante.count();
if (cuantos > 0) await botonesFirmante.first().click();
await pag.getByRole("button", { name: /Empezar/i }).click();

// ── 4 · Las nueve preguntas ─────────────────────────────────────────────
let contestadas = 0;
for (let i = 1; i <= 9; i++) {
  const t = await pag.locator("main").innerText();
  ok(`pregunta ${i}: se ve el avance`, new RegExp(`Pregunta ${i} de 9`).test(t));
  ok(`pregunta ${i}: ofrece no contestar`, /prefiero no contestar/i.test(t));

  if (i === 1) {
    await pag.screenshot({ path: `${SP}/3-pregunta.png`, fullPage: true });
    // Abrir "de dónde sale"
    const info = pag.locator("main button", { hasText: /Se apoya|recomienda|hecho que se puede ver/i }).first();
    if (await info.count()) {
      await info.click();
      const conCita = await pag.locator("main").innerText();
      ok("muestra de dónde sale la pregunta", conCita.length > t.length);
      await pag.screenshot({ path: `${SP}/4-procedencia.png`, fullPage: true });
    }
  }

  // Contesto algunas y salteo otras a propósito
  if (i % 3 === 0) {
    await pag.getByRole("button", { name: /prefiero no contestar/i }).click();
  } else {
    await pag.locator("main section button").nth(i % 4).click();
    contestadas++;
  }

  if (i < 9) await pag.getByRole("button", { name: /^Seguir$/ }).click();
}

// ── 5 · Guardar ─────────────────────────────────────────────────────────
await pag.getByRole("button", { name: /^Guardar$/ }).click();
await pag.waitForTimeout(2500);

const cierre = await pag.locator("main").innerText();
ok("confirma que quedó anotado", /Quedó anotado|ya está en el sistema/i.test(cierre));
ok("dice que ahora mira con las dos cosas", /lo que ve la red y lo que ven ustedes/i.test(cierre));
ok("promete que no va a haber puntaje", /no te va a devolver un puntaje/i.test(cierre));

/* 🔴 La comprobación que importa: que NO aparezca ningún número que se pueda
   leer como una calificación del chico. Se permiten «5 de 9 preguntas». */
const sinContar = cierre.replace(/\d+\s+de\s+\d+\s+preguntas/gi, "").replace(/Contestaste \d+/gi, "");
const porcentaje = sinContar.match(/\d+\s*%/);
const decimal = sinContar.match(/0[.,]\d+/);
ok("no muestra ningún puntaje", !porcentaje && !decimal, `%: ${porcentaje} · decimal: ${decimal}`);
await pag.screenshot({ path: `${SP}/5-cierre.png`, fullPage: true });

// ── 6 · La firma, de vuelta en el panel ─────────────────────────────────
await pag.getByRole("button", { name: /Volver al panel/i }).click();
await pag.waitForURL("**/mi-familia");
const bloque2 = pag.locator("section", { hasText: "Lo que ven ustedes" }).first();
await bloque2.waitFor({ timeout: 10000 });
const textoDespues = await bloque2.innerText();

ok("ahora muestra quién contestó", /Contestó/i.test(textoDespues));
ok("marca la persona como DECLARADA", /declarado/i.test(textoDespues));
ok("marca la casa como que CONSTA", /consta/i.test(textoDespues));
ok("dice cuántas preguntas fueron", /de 9 preguntas/i.test(textoDespues));
ok("ya no dice que nadie contestó", !/nadie contestó/i.test(textoDespues));
await bloque2.screenshot({ path: `${SP}/6-panel-firmado.png` });

// ── 7 · El informe dejó de decir que mira con un ojo ────────────────────
const panel = await pag.locator("main").innerText();
ok(
  "el informe ya no dice «nadie contestó el cuestionario»",
  !/Nadie contestó el cuestionario todavía/i.test(panel),
);
await pag.screenshot({ path: `${SP}/7-panel-completo.png`, fullPage: true });

console.log(`\n${fallos.length === 0 ? "todo bien" : `${fallos.length} fallaron`}`);
await nav.close();
process.exit(fallos.length ? 1 : 0);
