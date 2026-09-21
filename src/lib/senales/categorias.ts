/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ ES ESE SITIO — la consulta a la lista de la Universidad de Toulouse
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **El problema que resuelve, dicho corto.** El sistema reconoce sus 260
 *  dominios propios (`plataformas.ts` y `servicios.ts`) y **todo el resto de
 *  internet le cae como «sin clasificar»**. Un dominio nuevo aparecido a las
 *  dos de la mañana es exactamente igual de mudo si es un sitio de citas, un
 *  acortador o la textura de un juego.
 *
 *  Esto le pone nombre: **5,19 millones de dominios en 62 categorías**, de la
 *  lista pública de la Universidad de Toulouse 1 Capitole (Creative Commons
 *  BY-SA, al día todos los días). El índice lo arma `scripts/construir-ut1.mjs`
 *  en cada compilación.
 *
 *  🔴 **Lo que esta lista NO dice, y hay que tenerlo escrito:** no dice «acá hay
 *  grooming». Listas públicas de dominios de captación **no existen** —
 *  verificado tres veces— y hay un motivo de fondo: una lista así sería un
 *  directorio para el agresor. Esto dice **qué es** cada sitio, que es otra cosa
 *  y es la que sí se puede saber.
 *
 *  ⚠ **Y el filtro ve la CONSULTA, no la visita.** Una publicidad incrustada en
 *  una página genera la consulta de un dominio sin que el chico haya entrado a
 *  ningún lado. Por eso lo que salga de acá se cuenta siempre como **hecho
 *  fechado** —«el teléfono consultó un dominio catalogado como sitio de citas el
 *  martes a las 2:14»— y nunca como interpretación.
 *
 *  ─── 🔴 EL ORDEN DE QUIÉN CONTESTA PRIMERO ───────────────────────────────
 *
 *  Igual que con los dominios importados de NextDNS: **el catálogo propio manda
 *  y esto contesta donde nosotros no dijimos nada.** Acá viven decisiones
 *  discutidas —WhatsApp es destino y no lugar peligroso, Snapchat va con los
 *  abiertos—; si una lista de afuera pudiera voltearlas, un cambio de ellos
 *  cambiaría el producto sin que nadie se entere.
 *
 *  ─── 📦 Cómo está guardado ────────────────────────────────────────────────
 *
 *  Un binario de ~47 MB ordenado por huella: 7 bytes de huella del dominio y 2
 *  que dicen qué combinación de categorías le toca. La consulta es una búsqueda
 *  binaria de veintitrés saltos sobre el archivo — **sin red, sin base de datos
 *  y sin cargar los 47 MB en memoria**.
 *
 *  📌 **Si el índice no está, esto devuelve `null` y el sistema sigue andando**
 *  exactamente como andaba antes. Un dato externo que falta no puede voltear el
 *  producto; lo que sí hace es decirlo (`estadoDelIndice()`), porque un sistema
 *  que dejó de ver tiene que poder contarlo.
 */

import { createHash } from "node:crypto";
import { openSync, readSync } from "node:fs";
import { join } from "node:path";

const ARCHIVO = join(process.cwd(), "datos", "ut1.bin");
const ANCHO = 9; /* 7 de huella + 2 de combinación */

interface Indice {
  fd: number;
  dominios: number;
  datos: number;
  combos: number[][];
  categorias: string[];
  porCategoria: Record<string, number>;
  alDia: string | null;
  generado: string;
}

let indice: Indice | null | undefined;
let motivo = "";

function abrir(): Indice | null {
  if (indice !== undefined) return indice;
  try {
    const fd = openSync(ARCHIVO, "r");
    const preambulo = Buffer.allocUnsafe(20);
    readSync(fd, preambulo, 0, 20, 0);
    if (preambulo.toString("ascii", 0, 4) !== "UT1A") {
      throw new Error("el archivo no tiene la marca UT1A");
    }
    const dominios = preambulo.readUInt32BE(8);
    const datos = preambulo.readUInt32BE(12);
    const largo = preambulo.readUInt32BE(16);
    const cabecera = Buffer.allocUnsafe(largo);
    readSync(fd, cabecera, 0, largo, 20);
    const meta = JSON.parse(cabecera.toString("utf8"));
    indice = {
      fd,
      dominios,
      datos,
      combos: meta.combos ?? [],
      categorias: meta.categorias ?? [],
      porCategoria: meta.porCategoria ?? {},
      alDia: meta.alDia ?? null,
      generado: meta.generado ?? "",
    };
    if (dominios === 0) motivo = "el índice se generó vacío (UT1 no contestó en la última compilación)";
  } catch (error) {
    motivo = error instanceof Error ? error.message : String(error);
    indice = null;
  }
  return indice;
}

/** La misma huella de 56 bits que escribe `scripts/construir-ut1.mjs`. */
function huella(dominio: string): { alto: number; bajo: number } {
  const d = createHash("sha1").update(dominio).digest();
  return { alto: d.readUInt32BE(0), bajo: d.readUIntBE(4, 3) };
}

function buscar(idx: Indice, alto: number, bajo: number): number | null {
  const buf = Buffer.allocUnsafe(ANCHO);
  let desde = 0;
  let hasta = idx.dominios - 1;
  while (desde <= hasta) {
    const medio = (desde + hasta) >> 1;
    readSync(idx.fd, buf, 0, ANCHO, idx.datos + medio * ANCHO);
    const mAlto = buf.readUInt32BE(0);
    const mBajo = buf.readUIntBE(4, 3);
    if (mAlto === alto && mBajo === bajo) return buf.readUInt16BE(7);
    if (mAlto < alto || (mAlto === alto && mBajo < bajo)) desde = medio + 1;
    else hasta = medio - 1;
  }
  return null;
}

export interface LecturaDeCategoria {
  /** El sufijo que efectivamente coincidió: puede ser el dominio o su padre. */
  coincidio: string;
  /** Las categorías de UT1, en su nombre original. */
  categorias: string[];
}

/**
 * Qué es este dominio, según UT1. `null` si no está en la lista o si no hay
 * índice.
 *
 * Busca del más específico al más general —`chat.ejemplo.com`, `ejemplo.com`,
 * `com`— y **gana la primera coincidencia**, que es la que sabe más. El
 * recorrido incluye el dominio de nivel superior a propósito: UT1 tiene
 * catalogados `xxx`, `porn`, `sex` y `adult` enteros, que es correcto.
 */
export function categoriasDe(dominio: string): LecturaDeCategoria | null {
  const idx = abrir();
  if (!idx || idx.dominios === 0) return null;

  let resto = dominio.trim().toLowerCase().replace(/\.$/, "");
  while (resto.length > 0) {
    const { alto, bajo } = huella(resto);
    const combo = buscar(idx, alto, bajo);
    if (combo !== null) {
      const cats = (idx.combos[combo] ?? []).map((n) => idx.categorias[n]).filter(Boolean);
      if (cats.length > 0) return { coincidio: resto, categorias: cats };
    }
    const punto = resto.indexOf(".");
    if (punto < 0) return null;
    resto = resto.slice(punto + 1);
  }
  return null;
}

/**
 * Las categorías que trajo la lista de hoy, con cuántos dominios tiene cada una.
 *
 * 🔑 **Existe para poder comprobar que las categorías que el criterio nombra
 * siguen estando.** La lista es de afuera y cambia todos los días: si mañana
 * renombran `stalkerware`, el motor dejaría de leer esa señal sin romperse y sin
 * avisar. Ver `categorias.prueba.ts`.
 */
export function catalogoDeCategorias(): { nombre: string; dominios: number }[] {
  const idx = abrir();
  if (!idx) return [];
  return idx.categorias.map((nombre) => ({ nombre, dominios: idx.porCategoria[nombre] ?? 0 }));
}

/** ¿Tiene el sistema la lista cargada, y de cuándo es? Para el parte y el diagnóstico. */
export function estadoDelIndice(): {
  disponible: boolean;
  motivo?: string;
  alDia?: string | null;
  generado?: string;
  dominios?: number;
  categorias?: number;
} {
  const idx = abrir();
  if (!idx || idx.dominios === 0) {
    return { disponible: false, motivo: motivo || "no hay índice de categorías" };
  }
  return {
    disponible: true,
    alDia: idx.alDia,
    generado: idx.generado,
    dominios: idx.dominios,
    categorias: idx.categorias.length,
  };
}
