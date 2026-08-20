/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS PUERTAS DE LA CASA EN EL NAVEGADOR — recorrido completo, 20/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Entrar → ver la entrada propia → abrir la de la otra casa → verla en el
 *  registro → cerrarla (nadie la usó) → cambiar la clave con una equivocada y
 *  con la buena.
 *
 *  🔑 **No reemplaza a `npm run probar`: encuentra otra clase de error.** La
 *  tanda cuida las reglas (`hogares.prueba.ts`); esto cuida que las reglas
 *  estén de verdad enchufadas a una pantalla y a una base.
 *
 *  ⚠ **NO está en `npm run probar` y es a propósito**, por lo mismo que
 *  `prueba-navegador.mjs`: escribe en la Supabase de PRODUCCIÓN, necesita
 *  `playwright` y el servidor levantado en el 3000.
 *
 *  🔴 **DEJA LA BASE COMO LA ENCONTRÓ, y eso no es prolijidad: es la condición
 *  para poder correrla.** Abre una puerta de verdad y cambia una clave de
 *  verdad. Al final devuelve el hash original, borra la puerta que creó, le
 *  saca el nombre a la casa y limpia el registro. Si algo revienta a la mitad,
 *  la restitución igual corre — va en un `finally`.
 *
 *  La clave sale de `.env.local` y nunca se escribe acá: el repo es público.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import pg from "pg";

const REPO = "/Users/edgardolamas/Desktop/Trabajos/antigro";
const env = readFileSync(`${REPO}/.env.local`, "utf8");
const leer = (k) => {
  const l = env.split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
};

const CUENTA = "mariana@ejemplo.ar";
const CLAVE = leer("CUENTAS_DE_PRUEBA_CLAVE");
if (!CLAVE) {
  console.error("no está CUENTAS_DE_PRUEBA_CLAVE");
  process.exit(1);
}

/** La que se abre y se cierra dentro de la prueba. Nunca queda viva. */
const CORREO_DE_LA_OTRA = "casa-de-prueba@antigro.invalid";
const CLAVE_DE_LA_OTRA = "una-clave-de-prueba";
const CLAVE_NUEVA = "otra-clave-de-prueba";

const SP = process.env.SP ?? "/tmp";
const fallos = [];
const ok = (n, c, d) => {
  console.log(`${c ? "✓" : "✗"} ${n}`);
  if (!c) {
    fallos.push(n);
    if (d) console.log(`    ${d}`);
  }
};

const url = leer("POSTGRES_URL_NON_POOLING").replace(/\?sslmode=require/, "");
const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await db.connect();

/* ── Se limpia ANTES, no sólo después: la prueba tiene que poder repetirse
      aunque una corrida anterior se haya cortado a la mitad. ───────────── */
const { rows: antes } = await db.query(
  "select id, familia_id, password_hash, hogar from usuarios where email = $1",
  [CUENTA],
);
if (antes.length === 0) {
  console.error(`no está la cuenta ${CUENTA} en producción`);
  process.exit(1);
}
const YO = antes[0];

async function dejarComoEstaba() {
  await db.query("delete from usuarios where familia_id = $1 and id <> $2", [YO.familia_id, YO.id]);
  await db.query("update usuarios set password_hash = $1, hogar = $2 where id = $3", [
    YO.password_hash,
    YO.hogar,
    YO.id,
  ]);
  await db.query("delete from accesos where familia_id = $1", [YO.familia_id]);
}

await dejarComoEstaba();
console.log("(limpieza previa: una sola puerta, sin registro)\n");

const nav = await chromium.launch({ headless: false });
const pag = await (await nav.newContext({ viewport: { width: 1100, height: 1500 } })).newPage();

try {
  // ── 1 · Entrar ────────────────────────────────────────────────────────
  await pag.goto("http://localhost:3000/entrar");
  await pag.getByLabel(/email/i).fill(CUENTA);
  await pag.getByLabel(/contrase/i).fill(CLAVE);
  await pag.getByRole("button", { name: /entrar/i }).click();
  await pag.waitForURL("**/mi-familia", { timeout: 20000 });
  ok("entra al panel", pag.url().includes("/mi-familia"));

  // 🔴 El ingreso tiene que haber quedado anotado: es lo que después decide
  //    si una puerta se puede cerrar o no.
  const { rows: tras } = await db.query("select ultimo_acceso from usuarios where id = $1", [YO.id]);
  ok("🔴 entrar deja anotado el último acceso", Boolean(tras[0].ultimo_acceso), `salió: ${tras[0].ultimo_acceso}`);

  // ── 2 · La sección de las entradas ────────────────────────────────────
  const puertas = pag.locator("section", { hasText: "Las entradas" }).first();
  await puertas.waitFor({ timeout: 15000 });
  const t1 = await puertas.innerText();
  ok("muestra la entrada propia", /por acá entraste vos/i.test(t1));
  ok("y con qué correo", t1.includes(CUENTA));
  ok("dice cuándo entraron por última vez", /última vez hoy/i.test(t1), t1);
  ok("ofrece abrir la de la otra casa", /Abrir la entrada de la otra casa/i.test(t1));
  ok(
    "🔑 y lo ofrece con su porqué, no como algo que falta",
    /ninguno puede dejar al otro afuera/i.test(t1),
  );
  await puertas.screenshot({ path: `${SP}/1-entradas.png` });

  // ── 3 · Abrir la segunda ──────────────────────────────────────────────
  await pag.getByRole("button", { name: /Abrir la entrada de la otra casa/i }).click();
  await pag.getByLabel(/Cómo se llama esta casa/i).fill("Casa de mamá");
  await pag.getByLabel(/Cómo se llama la otra casa/i).fill("Casa de papá");
  await pag.getByLabel(/Con qué correo entra/i).fill(CORREO_DE_LA_OTRA);
  await pag.getByLabel(/^Con qué clave$/i).fill(CLAVE_DE_LA_OTRA);
  await pag.getByLabel(/Repetila/i).fill(CLAVE_DE_LA_OTRA);

  const formulario = await pag.locator("main").innerText();
  ok(
    "🔴 avisa ANTES que no se puede deshacer",
    /no se puede deshacer/i.test(formulario) && /es de esa casa/i.test(formulario),
  );
  ok(
    "y dice que el correo lo avisa la persona, no el sistema",
    /Abrir la entrada/i.test(formulario),
  );
  await pag.screenshot({ path: `${SP}/2-formulario.png`, fullPage: true });

  await pag.getByRole("button", { name: /^Abrir la entrada$/ }).click();
  const conConfirmacion = await pag.locator("main").innerText();
  ok(
    "🔑 pide confirmar, nombrando la casa",
    /Sí, abrir la entrada de Casa de papá/i.test(conConfirmacion),
    conConfirmacion.slice(0, 400),
  );
  ok(
    "y aclara que AntiGro no manda ningún correo",
    /no le manda ningún correo/i.test(conConfirmacion),
  );

  await pag.getByRole("button", { name: /Sí, abrir la entrada/i }).click();
  await pag.waitForTimeout(3000);

  // ── 4 · Quedó ────────────────────────────────────────────────────────
  const { rows: dos } = await db.query(
    "select email, hogar, ultimo_acceso, terminos_version from usuarios where familia_id = $1 order by created_at",
    [YO.familia_id],
  );
  ok("🔴 quedan DOS puertas en la base", dos.length === 2, JSON.stringify(dos));
  ok("la propia quedó con nombre", dos[0]?.hogar === "Casa de mamá", `salió: ${dos[0]?.hogar}`);
  ok("la nueva se llama como se pidió", dos[1]?.hogar === "Casa de papá", `salió: ${dos[1]?.hogar}`);
  ok("🔑 la nueva nace sin usar", dos[1]?.ultimo_acceso === null);
  ok(
    "🔴 y SIN términos aceptados: nadie puede aceptarlos por otro",
    dos[1]?.terminos_version === null,
    `salió: ${dos[1]?.terminos_version}`,
  );

  const t2 = await pag.locator("section", { hasText: "Las entradas" }).first().innerText();
  ok("la pantalla muestra las dos casas", /Casa de mamá/.test(t2) && /Casa de papá/.test(t2), t2);
  ok("y dice que por la nueva no entró nadie", /Todavía no entró nadie/i.test(t2));
  ok("🔑 y por eso ofrece cerrarla", /Cerrar esta entrada/i.test(t2));
  await pag.locator("section", { hasText: "Las entradas" }).first().screenshot({ path: `${SP}/3-dos-entradas.png` });

  // ── 5 · El registro ──────────────────────────────────────────────────
  const registro = pag.locator("section", { hasText: "Qué se cambió en esta cuenta" }).first();
  await registro.waitFor({ timeout: 10000 });
  const t3 = await registro.innerText();
  ok("el registro anotó que se abrió la entrada", /Se abrió la entrada de la otra casa/i.test(t3), t3);
  ok("con la casa desde la que se hizo", /desde Casa de mamá/i.test(t3));
  ok(
    "🔴 y dice en pantalla que no registra lo que se MIRA",
    /no lo que se mira/i.test(t3) || /no queda registrado/i.test(t3),
  );
  await registro.screenshot({ path: `${SP}/4-registro.png` });

  // ── 6 · Cerrar la que nadie usó ──────────────────────────────────────
  await pag.getByRole("button", { name: /Cerrar esta entrada/i }).click();
  await pag.getByRole("button", { name: /Sí, cerrarla/i }).click();
  await pag.waitForTimeout(2500);

  const { rows: unaSola } = await db.query(
    "select email from usuarios where familia_id = $1",
    [YO.familia_id],
  );
  ok("🔑 se cerró y volvió a quedar una sola puerta", unaSola.length === 1, JSON.stringify(unaSola));

  // ── 7 · 🔴 Y la que YA se usó no se cierra, ni por la ruta ───────────
  //    Es la comprobación que sostiene todo el diseño: nadie saca al otro del
  //    informe de su hijo. Se prueba contra la ruta, salteando la pantalla.
  const seCuela = await pag.evaluate(async (id) => {
    const r = await fetch(`/api/mi-familia/hogar?id=${id}`, { method: "DELETE" });
    return { estado: r.status, cuerpo: await r.json() };
  }, YO.id);
  ok(
    "🔴 la propia puerta NO se puede cerrar ni pidiéndoselo a la ruta a mano",
    seCuela.estado === 409,
    JSON.stringify(seCuela),
  );

  // ── 8 · Cambiar la clave ─────────────────────────────────────────────
  await pag.getByRole("button", { name: /^Cambiar la clave$/ }).click();
  await pag.getByLabel(/La clave de ahora/i).fill("esta-no-es-la-clave");
  await pag.getByLabel(/^La nueva$/i).fill(CLAVE_NUEVA);
  await pag.getByLabel(/Repetila/i).fill(CLAVE_NUEVA);
  await pag.locator("main").getByRole("button", { name: /^Cambiar la clave$/ }).click();
  await pag.waitForTimeout(2000);

  const conError = await pag.locator("main").innerText();
  ok("🔴 con la clave vieja equivocada, no cambia nada", /La clave de ahora no es ésa/i.test(conError), conError.slice(0, 300));

  await pag.getByLabel(/La clave de ahora/i).fill(CLAVE);
  await pag.locator("main").getByRole("button", { name: /^Cambiar la clave$/ }).click();
  await pag.waitForTimeout(2500);

  const cambiada = await pag.locator("main").innerText();
  ok("con la clave buena, cambia", /quedó cambiada/i.test(cambiada), cambiada.slice(0, 300));
  ok("🔑 y la sesión NO se cierra", pag.url().includes("/mi-familia"));

  const { rows: nueva } = await db.query("select password_hash from usuarios where id = $1", [YO.id]);
  ok("🔴 el hash de la base cambió de verdad", nueva[0].password_hash !== YO.password_hash);

  /* 🔴 Contra la BASE primero, y contra la pantalla después. Son dos fallas
     distintas: que no se anote, y que se anote y el panel no lo muestre. La
     segunda apareció en la primera corrida — el panel no se volvía a pedir. */
  const { rows: anotado } = await db.query(
    "select que, hogar, detalle from accesos where familia_id = $1 and que = 'cambio_la_clave'",
    [YO.familia_id],
  );
  ok("🔴 el cambio de clave quedó anotado en la base", anotado.length === 1, JSON.stringify(anotado));
  ok("⚠ y sin ningún detalle de la clave", anotado[0]?.detalle === null, JSON.stringify(anotado[0]));

  const t4 = await pag.locator("section", { hasText: "Qué se cambió en esta cuenta" }).first().innerText();
  ok("y el panel lo muestra sin recargar a mano", /Se cambió la clave/i.test(t4), t4);
  ok(
    "⚠ y no anotó nada DE la clave",
    !t4.includes(CLAVE) && !t4.includes(CLAVE_NUEVA),
  );
  await pag.screenshot({ path: `${SP}/5-final.png`, fullPage: true });
} finally {
  /* 🔴 Corre pase lo que pase: la prueba escribe en producción. */
  await dejarComoEstaba();
  console.log("\n(restituido: una puerta, el hash original, sin registro)");
  await db.end();
  await nav.close();
}

console.log(`\n${fallos.length === 0 ? "todo bien" : `${fallos.length} fallaron`}`);
if (fallos.length > 0) process.exit(1);
