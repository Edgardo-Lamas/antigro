/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA PUERTA DE LA FAMILIA, EN EL NAVEGADOR — 20/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Existe por un fallo que no se veía de ninguna otra forma.** Lo encontró
 *  Edgardo probando el alta: *"nunca dijo «email y/o contraseña no coinciden»
 *  pero debería decirlo"*. Detrás había algo peor que un cartel que falta.
 *
 *  **NextAuth v5 devuelve `ok: true` con las credenciales RECHAZADAS:**
 *
 *      {"error":"CredentialsSignin","code":"credentials",
 *       "status":200,"ok":true,"url":null}
 *
 *  Con `if (res?.ok)` una clave equivocada se daba por buena, se empujaba a
 *  `/mi-familia`, el middleware rebotaba a `/entrar` por no haber sesión, y la
 *  persona volvía a ver la pantalla de logueo **muda**. Sin cartel y sin error
 *  en consola: se leía como que el botón no hacía nada.
 *
 *  🔑 **Ni el typecheck ni `npm run probar` pueden ver esto**, porque no hay
 *  nada roto en el código: hay un contrato de una librería que cambió de
 *  significado. Sólo se ve escribiendo una clave mal y mirando la pantalla.
 *
 *  ⚠ Igual que las otras pruebas de navegador: necesita `playwright` y el
 *  servidor levantado. `SITIO=…` para correrla contra producción.
 *  📌 **Esta NO escribe nada en la base**: entra y mira. Es la única que se
 *  puede correr las veces que haga falta sin limpiar después.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL(".env.local", import.meta.url), "utf8");
const leer = (k) => {
  const l = env.split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
};

const SITIO = process.env.SITIO ?? "http://localhost:3000";
const CUENTA = "mariana@ejemplo.ar";
const CLAVE = leer("CUENTAS_DE_PRUEBA_CLAVE");
const INVITACION = leer("CODIGO_DE_INVITACION");
if (!CLAVE || !INVITACION) {
  console.error("faltan CUENTAS_DE_PRUEBA_CLAVE o CODIGO_DE_INVITACION en .env.local");
  process.exit(1);
}

const fallos = [];
const ok = (n, c, d) => {
  console.log(`${c ? "✓" : "✗"} ${n}`);
  if (!c) {
    fallos.push(n);
    if (d) console.log(`    ${d}`);
  }
};

const nav = await chromium.launch({ headless: false });
const ctx = await nav.newContext({ viewport: { width: 620, height: 950 } });
const pag = await ctx.newPage();
console.log(`(contra ${SITIO})\n`);

try {
  /* ── 1 · Sin código de invitación no se puede crear ──────────────────────
     No es cosmética: ofrecer un registro que después contesta «este enlace no
     habilita crear una cuenta» manda a la gente contra una puerta cerrada. */
  await pag.goto(`${SITIO}/entrar`);
  await pag.getByLabel(/email/i).waitFor({ timeout: 30000 });
  const pelada = await pag.locator("body").innerText();
  ok("sin código, NO se ofrece crear cuenta", !/Es mi primera vez/i.test(pelada));
  ok("y se ve el logueo igual", /Entrá a tu familia/i.test(pelada));

  /* ── 2 · 🔴 LA CLAVE EQUIVOCADA TIENE QUE DECIR ALGO ─────────────────── */
  await pag.getByLabel(/email/i).fill("no-existe@ejemplo.invalid");
  await pag.getByLabel(/^Contraseña$/i).fill("una-clave-que-no-es");
  await pag.getByRole("button", { name: /^Entrar$/i }).click();
  await pag.waitForTimeout(4000);

  const trasFallar = await pag.locator("body").innerText();
  ok(
    "🔴 con la clave equivocada, LO DICE — no se queda muda",
    /no coinciden/i.test(trasFallar),
    trasFallar.split("\n").filter((l) => l.trim()).slice(0, 10).join(" · "),
  );
  ok(
    "🔑 y no se va a ningún lado: el que se equivocó sigue en la puerta",
    pag.url().includes("/entrar"),
    pag.url(),
  );
  ok(
    "⚠ y no dice CUÁL de las dos está mal",
    !/no existe|no está registrado|contraseña incorrecta/i.test(trasFallar),
  );

  /* ── 3 · El ojo de la contraseña ─────────────────────────────────────── */
  const campoClave = pag.getByLabel(/^Contraseña$/i);
  ok("la contraseña arranca oculta", (await campoClave.getAttribute("type")) === "password");

  await pag.getByRole("button", { name: /Mostrar la contraseña/i }).click();
  await pag.waitForTimeout(300);
  ok(
    "🔑 el ojo la muestra",
    (await campoClave.getAttribute("type")) === "text",
    `salió: ${await campoClave.getAttribute("type")}`,
  );
  ok(
    "🔴 y NO envía el formulario al tocarlo",
    pag.url().includes("/entrar"),
    pag.url(),
  );

  await pag.getByRole("button", { name: /Ocultar la contraseña/i }).click();
  await pag.waitForTimeout(300);
  ok("y la vuelve a ocultar", (await campoClave.getAttribute("type")) === "password");

  /* ── 4 · Con el enlace de invitación sí se puede crear ───────────────── */
  await pag.goto(`${SITIO}/entrar?i=${encodeURIComponent(INVITACION)}`);
  await pag.getByLabel(/email/i).waitFor({ timeout: 30000 });
  const conCodigo = await pag.locator("body").innerText();
  ok("🔑 con el enlace, aparece «Es mi primera vez»", /Es mi primera vez/i.test(conCodigo));
  ok("y abre directo en crear, que es a lo que viene el que llega por ahí",
    /Poné en marcha el sistema/i.test(conCodigo), conCodigo.slice(0, 200));
  ok("las declaraciones de los términos están a la vista",
    /responsabilidad parental|declaro/i.test(conCodigo));

  /* ── 5 · 🔴 Y LO MÁS IMPORTANTE: la clave BUENA sigue entrando ────────
     Arreglar el caso del error rompiendo el caso bueno seria mucho peor que
     el fallo original. Por eso esta comprobacion va última y va siempre. */
  await pag.goto(`${SITIO}/entrar`);
  await pag.getByLabel(/email/i).fill(CUENTA);
  await pag.getByLabel(/^Contraseña$/i).fill(CLAVE);
  await pag.getByRole("button", { name: /^Entrar$/i }).click();

  let entro = true;
  try {
    await pag.waitForURL("**/mi-familia", { timeout: 30000 });
  } catch {
    entro = false;
  }
  ok("🔴 con la clave BUENA entra al panel", entro, `quedó en: ${pag.url()}`);
} finally {
  await nav.close();
}

console.log(`\n${fallos.length === 0 ? "todo bien" : `${fallos.length} fallaron`}`);
if (fallos.length > 0) process.exit(1);
