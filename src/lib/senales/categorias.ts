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

import { desempatar, type Condicion, type QueHace } from "./criterio.ts";
import { loDecidimosNosotros } from "./plataformas.ts";
import type { SenalDeRed } from "./tipos.ts";

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

/* ─────────────────────────────────────────────────────────────────────────────
    QUÉ ES ESTE LUGAR Y QUÉ HACE EL SISTEMA CON ÉL
   ───────────────────────────────────────────────────────────────────────────*/

export interface LecturaDelLugar {
  /** El dominio consultado, tal como se preguntó. */
  dominio: string;
  /** El sufijo que coincidió en la lista: puede ser el padre del consultado. */
  coincidio: string;
  /** Todas las categorías, sin filtrar. Lo que se guarda. */
  categorias: string[];
  /** La que manda después del desempate. */
  manda: string;
  hace: QueHace;
  condicion?: Condicion;
  esto: string;
  porque: string;
}

/** Qué es este lugar y qué hace el sistema con él. `null` si no está catalogado. */
export function queEsEsteLugar(dominio: string): LecturaDelLugar | null {
  const lectura = categoriasDe(dominio);
  if (!lectura) return null;

  const elegido = desempatar(lectura.categorias);

  return {
    dominio,
    coincidio: lectura.coincidio,
    categorias: lectura.categorias,
    manda: elegido.categoria,
    hace: elegido.criterio.hace,
    condicion: elegido.criterio.condicion,
    esto: elegido.criterio.esto,
    porque: elegido.criterio.porque,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔑 DÓNDE SE ANOTA LA CATEGORÍA: EN LA PUERTA DE ENTRADA, NO EN EL MOTOR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **El motor no consulta el índice: recibe la señal ya anotada.** Son dos
 * motivos y los dos mandan:
 *
 * 1. 🔴 **El motor corre en el navegador** (la consola de la home y el panel lo
 *    llaman desde el cliente). Leer un archivo de 47 MB con `fs` ahí no existe.
 * 2. 🔑 **La categoría es un dato de la señal, no del análisis.** Anotada en el
 *    contexto viaja con ella, **se guarda con ella** y queda en el histórico: el
 *    día que se mire un caso hacia atrás, va a decir qué era ese lugar *ese
 *    día*, no lo que UT1 diga el día que se mire.
 *
 * ⚠ Las claves son metadatos y pasan el guardarraíl de privacidad: dicen **qué
 * clase de lugar** era, nunca qué se hizo ahí ni qué se dijo.
 *
 * ─── 🔴🔴 Y EL CATÁLOGO PROPIO SIGUE MANDANDO ────────────────────────────
 *
 * **Si el dominio ya lo tenemos catalogado, UT1 se guarda pero NO decide.** El
 * caso que lo obliga es WhatsApp: para UT1 es `chat`, que pesa y adelanta el
 * aviso; **para nosotros es un destino, no un lugar de riesgo** —es donde habla
 * con la familia—, y eso se decidió el 15/8 mirando el producto. Si la lista de
 * afuera pudiera pisarlo, un cambio de ellos aceleraría las alertas de todas
 * las familias **sin que nadie se entere**. Pasa lo mismo con Snapchat y Discord.
 *
 * 📌 La categoría real se anota igual (el histórico la va a querer), pero
 * `que_hace` queda en `se_guarda`: entra al registro y no toca el motor.
 *
 * ⚠ **Y son SÓLO las decisiones nuestras, no los 400 dominios importados de
 * NextDNS.** Que Tinder tenga nombre en esa lista no es una decisión sobre
 * Tinder: es un nombre. Confundir las dos cosas dejaba mudo justo al sitio de
 * citas, que es el ejemplo con el que se explica todo esto — encontrado el 21/9
 * al escribir la tanda de pruebas.
 */
export function anotarLugares(senales: SenalDeRed[]): SenalDeRed[] {
  return senales.map((senal) => {
    const dominio = senal.contexto?.dominio;
    if (typeof dominio !== "string") return senal;
    const lugar = queEsEsteLugar(dominio);
    if (!lugar) return senal;
    const loConocemos = loDecidimosNosotros(dominio);
    return {
      ...senal,
      contexto: {
        ...senal.contexto,
        categoria_del_lugar: lugar.manda,
        que_hace: loConocemos ? "se_guarda" : lugar.hace,
        lugar_es: lugar.esto,
        ...(loConocemos ? { manda_el_catalogo_propio: 1 } : {}),
        ...(!loConocemos && lugar.condicion ? { condicion_del_lugar: lugar.condicion } : {}),
      },
    };
  });
}
