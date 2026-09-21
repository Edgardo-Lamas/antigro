#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS CLIPS DE LA PRESENCIA — de lo que sale de Flow a lo que usa el panel
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Toma los videos crudos generados en Google Flow y deja en `public/avatar/`
 *  los archivos que `src/components/Presencia.tsx` espera.
 *
 *  ── Cómo se usa ───────────────────────────────────────────────────────────
 *
 *      npm run avatar
 *
 *  Busca en `~/Desktop/avatar-antigro/` archivos que se llamen `reposo` y
 *  `pensando` (con cualquier extensión de video) y escribe
 *  `public/avatar/reposo.webm` y `public/avatar/pensando.webm`.
 *  Con `npm run avatar -- --desde <carpeta>` se le puede dar otra carpeta.
 *
 *  ── Qué le hace a cada clip, y por qué ────────────────────────────────────
 *
 *  🔑 **Le saca el audio.** Flow le inventa una pista de sonido a todo lo que
 *  genera —a un clip de una caldera le puso una explicación hablada— y acá
 *  además no hay audio de salida en la web por decisión del 20/9. `-an`.
 *
 *  🔑 **Lo cierra en bucle de ida y vuelta.** Un clip que arranca y termina
 *  distinto da un salto visible cada vez que repite, y esta figura está en
 *  pantalla todo el tiempo: el salto se vuelve un tic. Duplicándolo al revés,
 *  el final empalma exacto con el principio. 📌 Sirve porque el movimiento es
 *  una respiración; si alguna vez hay un gesto con dirección, `--sin-espejo`.
 *
 *  🔑 **Lo achica a 640 px de alto.** El lugar más grande donde se ve son los
 *  ~420 px de la franja del monitor. Más resolución que esa no se ve y sí se
 *  descarga.
 *
 *  🔴 **NO le toca el negro del fondo.** El panel lo funde con `mix-blend-mode:
 *  screen`, que hace desaparecer el negro y sumar sólo la luz: por eso el clip
 *  tiene que venir filmado como luz sobre negro puro y por eso no hace falta
 *  canal alfa, que Flow no entrega.
 */

import { spawn } from "node:child_process";
import { mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/** Los estados que hoy piden las pantallas. Ver el comentario de `CLIP_DE`. */
const ESTADOS = ["reposo", "pensando"];

const VIDEO = new Set([".mp4", ".mov", ".webm", ".m4v", ".mkv"]);

const argumentos = process.argv.slice(2);
const valorDe = (bandera) => {
  const i = argumentos.indexOf(bandera);
  return i !== -1 ? argumentos[i + 1] : undefined;
};

const carpeta = valorDe("--desde") ?? path.join(homedir(), "Desktop", "avatar-antigro");
const espejo = !argumentos.includes("--sin-espejo");
const segundos = Number(valorDe("--segundos") ?? 0); // 0 = el clip entero
const destino = path.join(process.cwd(), "public", "avatar");

/** ffmpeg escribe todo por el error estándar; sólo interesa si terminó mal. */
function correr(orden, args) {
  return new Promise((listo, falla) => {
    const proceso = spawn(orden, args, { stdio: ["ignore", "ignore", "pipe"] });
    let ruido = "";
    proceso.stderr.on("data", (d) => (ruido += d.toString()));
    proceso.on("error", falla);
    proceso.on("close", (codigo) =>
      codigo === 0 ? listo() : falla(new Error(ruido.split("\n").slice(-12).join("\n"))),
    );
  });
}

async function buscarCrudo(estado) {
  const archivos = await readdir(carpeta);
  const encontrado = archivos.find(
    (a) => path.parse(a).name.toLowerCase() === estado && VIDEO.has(path.extname(a).toLowerCase()),
  );
  return encontrado ? path.join(carpeta, encontrado) : null;
}

function filtro() {
  const recorte = segundos > 0 ? `trim=0:${segundos},setpts=PTS-STARTPTS,` : "";
  const base = `[0:v]${recorte}scale=-2:640,format=yuv420p`;
  if (!espejo) return `${base}[v]`;
  return `${base},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]`;
}

async function procesar(estado) {
  const crudo = await buscarCrudo(estado);
  if (!crudo) {
    console.log(`   ⬜ ${estado}: no hay archivo todavía`);
    return false;
  }
  const salida = path.join(destino, `${estado}.webm`);
  await correr("ffmpeg", [
    "-y",
    "-i", crudo,
    "-filter_complex", filtro(),
    "-map", "[v]",
    "-an",
    "-c:v", "libvpx-vp9",
    "-b:v", "0",
    "-crf", "38",
    "-row-mt", "1",
    "-deadline", "good",
    "-cpu-used", "2",
    salida,
  ]);
  const { size } = await stat(salida);
  console.log(`   ✅ ${estado}: ${(size / 1024).toFixed(0)} KB  ←  ${path.basename(crudo)}`);
  return true;
}

async function principal() {
  if (!existsSync(carpeta)) {
    console.error(`\n🔴 No existe la carpeta ${carpeta}`);
    console.error(`   Creala y dejá ahí los clips de Flow como reposo.mp4 y pensando.mp4,`);
    console.error(`   o pasá otra con: npm run avatar -- --desde <carpeta>\n`);
    process.exit(1);
  }
  await mkdir(destino, { recursive: true });
  console.log(`\n🎬 Clips de la presencia — desde ${carpeta}\n`);

  let hechos = 0;
  for (const estado of ESTADOS) if (await procesar(estado)) hechos++;

  if (hechos === 0) {
    console.error(`\n🔴 No se encontró ninguno. Los nombres tienen que ser exactamente`);
    console.error(`   ${ESTADOS.join(".mp4 y ")}.mp4\n`);
    process.exit(1);
  }
  console.log(`\n📌 Quedaron en public/avatar/. Falta poner HAY_CLIPS en true`);
  console.log(`   dentro de src/components/Presencia.tsx.\n`);
}

principal().catch((e) => {
  console.error(`\n🔴 ffmpeg falló:\n${e.message}\n`);
  process.exit(1);
});
