/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS CENTROS EDUCATIVOS, DE PUNTA A PUNTA — `node prueba-centros.mjs`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  El recorrido que hace una escuela de verdad, en el navegador:
 *    1. La administración da de alta el centro.
 *    2. El coordinador entra y cae en SU panel, no en el de una familia.
 *    3. El distintivo y su verificación responden.
 *    4. Una familia se da de alta con la invitación del centro y queda colgada.
 *    5. Un aviso registrado aparece en el panel del centro, sin ningún alumno.
 *    6. Pausado, el distintivo dice «no vigente» y la cuenta deja de abrir.
 *
 *  🧹 **Borra todo lo que crea al terminar**, pase lo que pase: el centro, la
 *  familia de prueba y el aviso. Escribe en la base de `.env.local`.
 *
 *      SITIO=http://localhost:3007 node prueba-centros.mjs
 */

import fs from "node:fs";
import pg from "pg";
import { chromium } from "playwright";

const SITIO = process.env.SITIO ?? "http://localhost:3007";
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const db = new pg.Client({
  connectionString: env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=require/, ""),
  ssl: { rejectUnauthorized: false },
});
await db.connect();

let fallaron = 0;
function comprobar(nombre, condicion, detalle) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const sello = Date.now().toString(36);
const NOMBRE = `Colegio de prueba ${sello}`;
const CORREO_CENTRO = `centro-${sello}@ejemplo.invalid`;
const CLAVE_CENTRO = `clave-centro-${sello}`;
const CORREO_FAMILIA = `familia-${sello}@ejemplo.invalid`;

/* 📌 `CANAL=chrome` usa el Chrome instalado si falta el navegador de Playwright. */
const navegador = await chromium.launch(process.env.CANAL ? { channel: process.env.CANAL } : {});
let centroId = null;

try {
  /* ── 1. La administración da de alta el centro ─────────────────────────── */
  const admin = await navegador.newContext();
  const pa = await admin.newPage();
  await pa.goto(`${SITIO}/panel/login`);
  await pa.fill("#email", env.ADMIN_EMAIL);
  await pa.fill("#password", env.ADMIN_PASSWORD);
  await pa.click('button[type="submit"]');
  await pa.waitForURL(/\/panel$/, { timeout: 30000 });

  await pa.getByRole("button", { name: "Dar de alta un centro" }).click();
  await pa.getByLabel("Nombre del centro").fill(NOMBRE);
  await pa.getByLabel("Licencias").fill("2");
  await pa.getByLabel(/Quién coordina/).fill("Laura Prueba");
  await pa.getByLabel("Correo de la cuenta del centro").fill(CORREO_CENTRO);
  await pa.getByLabel("Clave de la cuenta del centro").fill(CLAVE_CENTRO);
  await pa.getByRole("button", { name: "Crear el centro" }).click();
  await pa.getByText(NOMBRE).waitFor({ timeout: 30000 });
  comprobar("la administración crea el centro y aparece en la lista", true);

  const { rows } = await db.query("select * from centros where nombre = $1", [NOMBRE]);
  const centro = rows[0];
  centroId = centro?.id ?? null;
  comprobar("quedó en la base con código, distintivo y código de Telegram", Boolean(
    centro?.codigo && centro?.distintivo && centro?.codigo_vinculacion,
  ));
  const cuenta = await db.query("select rol, centro_id, familia_id from usuarios where email = $1", [
    CORREO_CENTRO,
  ]);
  comprobar(
    "y su cuenta es de rol centro, colgada del centro y de ninguna familia",
    cuenta.rows[0]?.rol === "centro" &&
      cuenta.rows[0]?.centro_id === centroId &&
      cuenta.rows[0]?.familia_id === null,
    JSON.stringify(cuenta.rows[0]),
  );

  /* ── 2. El coordinador entra ───────────────────────────────────────────── */
  const coord = await navegador.newContext();
  const pc = await coord.newPage();
  await pc.goto(`${SITIO}/entrar`);
  await pc.getByLabel(/email/i).fill(CORREO_CENTRO);
  await pc.getByLabel(/^Contraseña$/i).fill(CLAVE_CENTRO);
  await pc.locator('button[type="submit"]').click();
  await pc.waitForURL(/\/centro$/, { timeout: 30000 });
  comprobar("🔑 el coordinador entra por /entrar y cae en /centro", pc.url().endsWith("/centro"));

  const texto = await pc.locator("main").innerText();
  comprobar("ve su centro", texto.includes(NOMBRE));
  comprobar("ve las licencias: 0 de 2", /0\s*de 2 licencias/.test(texto), texto.slice(0, 400));
  comprobar("ve el enlace de invitación con su código", texto.includes(`/entrar?i=${centro.codigo}`));
  comprobar(
    "🔴 con datos de demostración dice que no avisa sobre datos inventados",
    texto.includes("datos de demostración"),
  );

  await pc.goto(`${SITIO}/mi-familia`);
  await pc.waitForURL(/\/centro$/, { timeout: 15000 });
  comprobar("🔴 un centro NO entra al panel de una familia: lo devuelve al suyo", pc.url().endsWith("/centro"));

  /* ── 3. El distintivo ──────────────────────────────────────────────────── */
  const svg = await fetch(`${SITIO}/distintivo/${centro.distintivo}/sello.svg`);
  const cuerpo = await svg.text();
  comprobar(
    "el sello responde como imagen SVG y lleva el nombre del centro",
    svg.status === 200 &&
      (svg.headers.get("content-type") ?? "").includes("image/svg+xml") &&
      cuerpo.includes(NOMBRE),
    `${svg.status} ${svg.headers.get("content-type")}`,
  );
  const publica = await navegador.newPage();
  await publica.goto(`${SITIO}/distintivo/${centro.distintivo}`);
  const verificacion = await publica.locator("main").innerText();
  comprobar("la verificación pública dice que está vigente", verificacion.includes("está vigente hoy"));
  comprobar(
    "🔴 y no muestra cuántas familias tiene",
    !/licencia|familias activ/i.test(verificacion),
    verificacion,
  );
  const falso = await fetch(`${SITIO}/distintivo/noexiste123`);
  comprobar("un distintivo que no existe da 404", falso.status === 404);

  /* ── 4. Una familia se da de alta con la invitación del centro ─────────── */
  const version = fs
    .readFileSync("src/lib/legal.ts", "utf8")
    .match(/VERSION_DE_LOS_TERMINOS\s*=\s*"([^"]+)"/)?.[1];
  const alta = await fetch(`${SITIO}/api/alta/hogar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.9.${sello.length}.1` },
    body: JSON.stringify({
      email: CORREO_FAMILIA,
      clave: "clave-de-la-familia",
      invitacion: centro.codigo,
      pais: "ES",
      terminos: version,
    }),
  });
  const altaJson = await alta.json();
  comprobar("🔑 una familia se da de alta con la invitación del centro", alta.ok, JSON.stringify(altaJson));
  const fam = await db.query("select centro_id from familias where id = $1", [altaJson.familiaId]);
  comprobar("y queda colgada del centro", fam.rows[0]?.centro_id === centroId);

  await pc.goto(`${SITIO}/centro`);
  comprobar(
    "el centro ve 1 de 2 licencias, y nada más de esa familia",
    /1\s*de 2 licencias/.test(await pc.locator("main").innerText()) &&
      !(await pc.locator("main").innerText()).includes(CORREO_FAMILIA),
  );

  /* ── 5. Un aviso registrado aparece en el panel ────────────────────────── */
  await db.query(
    `insert into avisos_centro (centro_id, dominio, alumnos, por_que, texto, entregado)
     values ($1, 'chat-secreto.top', 3, 'no es un sitio conocido', 'texto de prueba', false)`,
    [centroId],
  );
  await pc.goto(`${SITIO}/centro`);
  const conAviso = await pc.locator("main").innerText();
  comprobar(
    "el aviso aparece: el sitio y cuántos alumnos",
    conAviso.includes("chat-secreto.top") && conAviso.includes("3 alumnos distintos"),
  );
  comprobar("y dice que no salió por Telegram porque el canal no está conectado", conAviso.includes("No salió por Telegram"));
  await pc.screenshot({ path: "/tmp/antigro-centro.png", fullPage: true });

  /* ── 6. Pausado ────────────────────────────────────────────────────────── */
  await db.query("update centros set activo = false where id = $1", [centroId]);
  await publica.goto(`${SITIO}/distintivo/${centro.distintivo}`);
  comprobar(
    "🔴 pausado, la verificación dice que el distintivo no está vigente",
    (await publica.locator("main").innerText()).includes("no está vigente"),
  );
  const otra = await navegador.newContext();
  const po = await otra.newPage();
  await po.goto(`${SITIO}/entrar`);
  await po.getByLabel(/email/i).fill(CORREO_CENTRO);
  await po.getByLabel(/^Contraseña$/i).fill(CLAVE_CENTRO);
  await po.locator('button[type="submit"]').click();
  await po.getByText("El email o la contraseña no coinciden.").waitFor({ timeout: 20000 });
  comprobar("🔴 y la cuenta del centro deja de abrir", true);
} catch (e) {
  fallaron++;
  console.log("✗ se cortó:", e.message);
} finally {
  /* 🧹 Pase lo que pase. */
  if (centroId) {
    await db.query("delete from familias where centro_id = $1", [centroId]);
    await db.query("delete from centros where id = $1", [centroId]);
  }
  await db.query("delete from usuarios where email in ($1, $2)", [CORREO_CENTRO, CORREO_FAMILIA]);
  await navegador.close();
  await db.end();
}

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
