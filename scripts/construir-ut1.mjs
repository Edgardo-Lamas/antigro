#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ÍNDICE DE CATEGORÍAS — Universidad de Toulouse (UT1), 21/9/2026
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Baja la lista de categorización de `dsi.ut-capitole.fr/blacklists` (Creative
 *  Commons BY-SA, actualización diaria) y la deja en un índice que el sistema
 *  puede consultar dominio por dominio.
 *
 *  🔑 **Qué agrega, dicho corto:** hasta hoy el sistema reconoce 260 dominios
 *  propios y todo el resto de internet le cae como «sin clasificar». Esta lista
 *  no dice «acá hay grooming» —eso no existe públicamente y no hay que volver a
 *  buscarlo—: dice **qué es** cada sitio, y con eso un dominio desconocido deja
 *  de serlo.
 *
 *  ─── 🔴 ENTRAN TODAS LAS CATEGORÍAS, NO LAS TRECE QUE HOY SE USAN ──────────
 *
 *  Decisión de Edgardo del 21/9: bajar 66 cuesta lo mismo que bajar 13, y **el
 *  histórico no se recupera hacia atrás**. Una categoría que hoy no sabemos leer,
 *  el día que aparezca en un caso real se va a querer mirar en los meses
 *  anteriores; si no está cargada desde el principio, ese pasado no existe.
 *
 *  Sólo quedan afuera las listas administrativas de la propia universidad
 *  (`liste_blanche`, `liste_bu`, `examen_pix`, `tricheur_pix`, `reaffected`,
 *  `special`, `exceptions_liste_bu`): no son categorías de sitios, son material
 *  interno de su red.
 *
 *  ─── 📦 POR QUÉ UN BINARIO Y NO UNA TABLA ─────────────────────────────────
 *
 *  Son **5,19 millones de dominios**. En texto ocupan 175 MB; en la base serían
 *  millones de filas que hay que volver a escribir todos los días. Acá cada
 *  dominio son **9 bytes**: 7 de huella y 2 que dicen qué combinación de
 *  categorías le toca. Total ~47 MB, ordenado por huella, y la consulta es una
 *  búsqueda binaria de veintitrés saltos sobre el archivo — sin red, sin base y
 *  sin cargar nada en memoria.
 *
 *  📌 **Se genera en cada compilación, no se guarda en el repositorio.** Así la
 *  lista viaja adentro del despliegue, siempre del día, y el repositorio no
 *  engorda 47 MB por jornada.
 *
 *  ⚠ **Si UT1 no contesta, la compilación NO se cae.** Se escribe un índice
 *  vacío y el sistema sigue andando sin categorías, que es exactamente lo que
 *  hace hoy. Un dato externo que se cae no puede voltear el producto.
 *
 *  Uso:  node scripts/construir-ut1.mjs
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "datos");
const FUENTE = "https://dsi.ut-capitole.fr/blacklists/download/blacklists.tar.gz";

/** Listas internas de la universidad: no son categorías de sitios. */
const NO_SON_CATEGORIAS = new Set([
  "liste_blanche",
  "liste_bu",
  "exceptions_liste_bu",
  "examen_pix",
  "tricheur_pix",
  "reaffected",
  "special",
]);

/** Huella de 56 bits del dominio. Ver la nota de colisiones más abajo. */
function huella(dominio) {
  const d = createHash("sha1").update(dominio).digest();
  return (BigInt(d.readUInt32BE(0)) << 24n) | BigInt(d.readUIntBE(4, 3));
}

function aviso(texto) {
  process.stdout.write(`${texto}\n`);
}

/* El tarball ronda los 25 MB. Cualquier cosa mucho más chica no es la lista:
   es una página de error, una redirección o un bloqueo contestado con un 200. */
const MINIMO_CREIBLE = 5e6;

/**
 * 🔴 **Con `curl` esto falló en Vercel el 21/9 y falló en silencio:** bajó 0 MB
 * y recién se vio porque `tar` no pudo abrir el archivo. El `--fail` de curl no
 * cubre una redirección ni un cuerpo de error servido con 200.
 *
 * Con `fetch` se puede mirar el código, el tipo de contenido y el tamaño, y
 * **decir qué pasó en el registro de la compilación** en vez de dejar un archivo
 * roto. Además sigue las redirecciones solo y no depende de que curl esté.
 */
async function bajar(destino) {
  let ultimo = "";
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetch(FUENTE, {
        headers: { "user-agent": "AntiGro/1.0 (+https://antigro.vercel.app)" },
        redirect: "follow",
      });
      const tipo = res.headers.get("content-type") ?? "sin tipo";
      if (!res.ok) throw new Error(`contestó ${res.status} (${tipo})`);
      const datos = Buffer.from(await res.arrayBuffer());
      if (datos.length < MINIMO_CREIBLE) {
        throw new Error(
          `trajo ${datos.length} bytes (${tipo}) — no es la lista: ` +
            `«${datos.toString("utf8", 0, 200).replace(/\s+/g, " ").trim()}»`,
        );
      }
      writeFileSync(destino, datos);
      aviso(`· Bajado: ${(datos.length / 1e6).toFixed(1)} MB (intento ${intento})`);
      return;
    } catch (error) {
      ultimo = error instanceof Error ? error.message : String(error);
      aviso(`  intento ${intento} de 3: ${ultimo}`);
      if (intento < 3) await new Promise((listo) => setTimeout(listo, 3000 * intento));
    }
  }
  throw new Error(`no se pudo bajar la lista: ${ultimo}`);
}

async function bajarYExtraer(carpeta) {
  const tar = join(carpeta, "ut1.tar.gz");
  aviso(`· Bajando ${FUENTE}`);
  await bajar(tar);
  execFileSync("tar", ["xzf", tar, "-C", carpeta]);
  return join(carpeta, "blacklists");
}

function construir(carpetaListas) {
  const categorias = [];
  const porCategoria = {};
  /* Cada par (dominio, categoría) entra como un entero de 64 bits:
     56 bits de huella + 8 bits de número de categoría. Empaquetados así se
     ordenan de una sola pasada, que es lo que permite agrupar sin un diccionario
     de cinco millones de entradas en memoria. */
  const trozos = [];
  let actual = new BigUint64Array(1 << 20);
  let enActual = 0;
  let pares = 0;

  const nombres = readdirSync(carpetaListas, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.isSymbolicLink() && !NO_SON_CATEGORIAS.has(e.name))
    .map((e) => e.name)
    .sort();

  for (const nombre of nombres) {
    const archivo = join(carpetaListas, nombre, "domains");
    let crudo;
    try {
      crudo = readFileSync(archivo);
    } catch {
      continue; /* Categoría sin archivo de dominios: no es un error. */
    }
    if (categorias.length > 255) {
      throw new Error("Más de 256 categorías: el número de categoría ya no entra en un byte.");
    }
    const numero = BigInt(categorias.length);
    categorias.push(nombre);
    let cuenta = 0;

    let ini = 0;
    while (ini <= crudo.length) {
      let fin = crudo.indexOf(10, ini);
      if (fin < 0) fin = crudo.length;
      if (fin > ini) {
        const dominio = crudo.toString("utf8", ini, fin).trim().toLowerCase();
        if (dominio && !dominio.startsWith("#")) {
          if (enActual === actual.length) {
            trozos.push(actual);
            actual = new BigUint64Array(1 << 20);
            enActual = 0;
          }
          actual[enActual++] = (huella(dominio) << 8n) | numero;
          pares++;
          cuenta++;
        }
      }
      ini = fin + 1;
    }
    porCategoria[nombre] = cuenta;
  }

  trozos.push(actual.subarray(0, enActual));
  aviso(`· ${categorias.length} categorías · ${pares.toLocaleString("es-AR")} pares dominio-categoría`);

  const todos = new BigUint64Array(pares);
  let puesto = 0;
  for (const trozo of trozos) {
    todos.set(trozo, puesto);
    puesto += trozo.length;
  }
  trozos.length = 0;
  todos.sort();

  /* Agrupar: todas las categorías de un mismo dominio quedan juntas porque
     comparten los 56 bits altos. */
  const combos = [];
  const numeroDeCombo = new Map();
  const cuerpo = Buffer.allocUnsafe(pares * 9);
  let escritas = 0;
  let i = 0;
  while (i < pares) {
    const clave = todos[i] >> 8n;
    const cats = [];
    let j = i;
    while (j < pares && todos[j] >> 8n === clave) {
      const cat = Number(todos[j] & 0xffn);
      if (!cats.includes(cat)) cats.push(cat);
      j++;
    }
    cats.sort((a, b) => a - b);
    const firma = cats.join(",");
    let combo = numeroDeCombo.get(firma);
    if (combo === undefined) {
      combo = combos.length;
      combos.push(cats);
      numeroDeCombo.set(firma, combo);
    }
    if (combos.length > 65535) {
      throw new Error("Más de 65.535 combinaciones: el número de combinación ya no entra en dos bytes.");
    }
    const base = escritas * 9;
    cuerpo.writeUIntBE(Number(clave >> 24n), base, 4);
    cuerpo.writeUIntBE(Number(clave & 0xffffffn), base + 4, 3);
    cuerpo.writeUInt16BE(combo, base + 7);
    escritas++;
    i = j;
  }

  return {
    categorias,
    porCategoria,
    combos,
    dominios: escritas,
    pares,
    cuerpo: cuerpo.subarray(0, escritas * 9),
  };
}

function escribir(indice, alDia) {
  mkdirSync(DESTINO, { recursive: true });
  const cabecera = Buffer.from(
    JSON.stringify({
      version: 1,
      fuente: FUENTE,
      licencia: "Creative Commons BY-SA · Université Toulouse 1 Capitole",
      generado: new Date().toISOString(),
      alDia,
      dominios: indice.dominios,
      pares: indice.pares,
      categorias: indice.categorias,
      porCategoria: indice.porCategoria,
      combos: indice.combos,
    }),
    "utf8",
  );
  const preambulo = Buffer.alloc(20);
  preambulo.write("UT1A", 0, "ascii");
  preambulo.writeUInt8(1, 4); /* versión */
  preambulo.writeUInt8(7, 5); /* bytes de huella */
  preambulo.writeUInt8(2, 6); /* bytes de número de combinación */
  preambulo.writeUInt8(0, 7);
  preambulo.writeUInt32BE(indice.dominios, 8);
  preambulo.writeUInt32BE(20 + cabecera.length, 12);
  preambulo.writeUInt32BE(cabecera.length, 16);

  const archivo = join(DESTINO, "ut1.bin");
  writeFileSync(archivo, Buffer.concat([preambulo, cabecera, indice.cuerpo]));
  return archivo;
}

/**
 * Con `--si-hace-falta` no vuelve a bajar 25 MB si el índice ya es del día. En
 * Vercel la compilación arranca limpia, así que ahí siempre baja; el que se
 * ahorra la espera es el que compila en su máquina.
 */
function estaAlDia() {
  try {
    const horas = (Date.now() - statSync(join(DESTINO, "ut1.bin")).mtimeMs) / 3.6e6;
    return horas < 20;
  } catch {
    return false;
  }
}

async function main() {
  const arranque = Date.now();
  if (process.argv.includes("--si-hace-falta") && estaAlDia()) {
    aviso("· El índice de categorías ya es del día: no se vuelve a bajar.");
    return;
  }
  const carpeta = join(tmpdir(), `ut1-${process.pid}`);
  mkdirSync(carpeta, { recursive: true });
  try {
    const listas = await bajarYExtraer(carpeta);
    const alDia = statSync(join(listas, "README")).mtime.toISOString();
    const indice = construir(listas);
    const archivo = escribir(indice, alDia);
    const peso = statSync(archivo).size;
    aviso(
      `✅ ${indice.dominios.toLocaleString("es-AR")} dominios · ${indice.combos.length} combinaciones · ` +
        `${(peso / 1e6).toFixed(1)} MB · ${((Date.now() - arranque) / 1000).toFixed(1)} s`,
    );
    aviso(`   ${archivo}`);
  } catch (error) {
    /* 🔴 Que UT1 esté caído no puede voltear una compilación: el sistema ya sabe
       andar sin categorías, que es lo que hace hoy. */
    aviso(`⚠ No se pudo construir el índice de UT1: ${error instanceof Error ? error.message : error}`);
    aviso("  Se escribe un índice vacío y el sistema sigue sin categorías externas.");
    escribir({ categorias: [], porCategoria: {}, combos: [], dominios: 0, pares: 0, cuerpo: Buffer.alloc(0) }, null);
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
}

await main();
