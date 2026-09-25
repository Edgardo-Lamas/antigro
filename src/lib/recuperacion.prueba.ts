/**
 * Las reglas de la recuperación de la contraseña — `npm run probar-recuperacion`.
 * Ver `recuperacion.ts`.
 */

import {
  MINUTOS_DE_VIGENCIA,
  correoDeRecuperacion,
  enlaceNuevo,
  huellaDelEnlace,
  sigueValiendo,
  venceEn,
} from "./recuperacion.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  if (!condicion) fallaron++;
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion && detalle) console.log(`    ${detalle}`);
}

/* ── El enlace ─────────────────────────────────────────────────────────── */

const a = enlaceNuevo();
const b = enlaceNuevo();
comprobar("🔴 dos enlaces seguidos no se repiten", a !== b);
comprobar("el enlace es largo: 32 bytes no se adivinan", a.length >= 43, `largo ${a.length}`);
comprobar("y va seguro dentro de una dirección (base64url)", /^[A-Za-z0-9_-]+$/.test(a), a);

/* ── La huella ─────────────────────────────────────────────────────────── */

comprobar("🔴 la huella NO es el enlace", huellaDelEnlace(a) !== a);
comprobar("la misma entrada da la misma huella", huellaDelEnlace(a) === huellaDelEnlace(a));
comprobar("dos enlaces dan dos huellas", huellaDelEnlace(a) !== huellaDelEnlace(b));

/* ── La vigencia ───────────────────────────────────────────────────────── */

const ahora = new Date("2026-09-24T20:00:00Z");
const vence = venceEn(ahora).toISOString();
comprobar(
  `vence a los ${MINUTOS_DE_VIGENCIA} minutos`,
  Date.parse(vence) - ahora.getTime() === MINUTOS_DE_VIGENCIA * 60_000,
);
comprobar("recién pedido, vale", sigueValiendo({ vence, usadoEn: null }, ahora));
comprobar(
  "🔴 pasados los 30 minutos, no vale",
  !sigueValiendo({ vence, usadoEn: null }, new Date(ahora.getTime() + 31 * 60_000)),
);
comprobar(
  "🔴 usado una vez, no vale más aunque no haya vencido",
  !sigueValiendo({ vence, usadoEn: ahora.toISOString() }, ahora),
);

/* ── El correo ─────────────────────────────────────────────────────────── */

const direccion = "https://antigro.vercel.app/entrar/nueva-clave?t=abc";
const correo = correoDeRecuperacion(direccion);
comprobar("el correo trae el enlace", correo.texto.includes(direccion));
comprobar("dice que vence y que sirve una vez", /una sola vez/.test(correo.texto) && /vence/.test(correo.texto));
comprobar("🔑 y qué hacer si no lo pidió uno: nada", /no fuiste vos, no hagas nada/i.test(correo.texto));
comprobar(
  "🔴 no nombra al chico, ni avisos, ni cómo viene",
  !/(hij[oa]|chic[oa]|alerta|aviso|patr[oó]n|grooming|acoso)/i.test(correo.asunto + correo.texto),
  correo.texto,
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
