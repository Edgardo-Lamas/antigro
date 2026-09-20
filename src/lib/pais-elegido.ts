import { cookies } from "next/headers";
import { COOKIE_DEL_PAIS, esPais, PAIS_POR_DEFECTO, type Pais } from "@/lib/paises";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ PAÍS ESTÁ MIRANDO — la elección del que entra, sin cuenta
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **De dónde sale.** `paises.ts` tenía las dos listas cargadas y verificadas
 *  desde el 19/9, pero el país lo decidía una constante: quien entraba veía el
 *  país que estaba puesto en el código y no tenía forma de cambiarlo. Edgardo lo
 *  ordenó el 20/9: *"cuando seleccione el usuario el país recibe la información
 *  del país seleccionado… si selecciona España aparecen los contactos y términos
 *  de España"*.
 *
 *  🔴 **Lo que se elige son los CONTACTOS y las NORMAS, no el idioma.** Es su
 *  criterio, textual: *"el voseo no es lo importante ahora, sino que el usuario
 *  español encuentre los contactos de su país y el usuario argentino los del
 *  suyo"*. Un teléfono que no atiende, dado en el peor momento, es el peor error
 *  que puede cometer este producto; un «mirá» en vez de un «mira», no.
 *
 *  📌 **Una cookie y no un `?pais=`** porque la elección tiene que seguir puesta
 *  al pasar de la guía a los términos y a la consola. Un parámetro se pierde en
 *  el primer enlace que alguien no acordó de propagar, y ahí el que eligió
 *  España vuelve a leer teléfonos argentinos sin haber tocado nada.
 *
 *  ⚠ **Esto es la elección de quien MIRA, y NO manda sobre una familia dada de
 *  alta.** Para el que tiene cuenta manda `familias.pais` (migración 20): el
 *  país de una familia lo fija quien la creó y se cambia desde «La casa», no
 *  desde el navegador por el que se entre. Dos razones, y la segunda es la que
 *  obliga: los avisos salen solos, sin navegador del que leer nada; y con padres
 *  separados —dos puertas, un panel— la cookie podía dar dos teléfonos distintos
 *  para el mismo chico.
 */

/* ⚠ El nombre de la cookie, su duración y `esPais` viven en `paises.ts`, que no
   importa `next/headers`: lo necesita la pantalla de alta, que es de cliente.
   Acá queda sólo lo que LEE, que es server-only. */

/**
 * El país que está mirando quien pidió esta página.
 *
 * 🔑 Si no eligió nada todavía, el que está puesto. **No se adivina por el
 * idioma del navegador ni por la IP:** los dos países hablan castellano, y una
 * VPN o un viaje bastarían para que a un padre argentino le apareciera el 017.
 * Entre adivinar mal y preguntar, se pregunta.
 */
export function paisElegido(): Pais {
  const guardado = cookies().get(COOKIE_DEL_PAIS)?.value;
  return esPais(guardado) ? guardado : PAIS_POR_DEFECTO;
}

/**
 * Lo mismo, para un Route Handler que tiene el `Request` a mano y no quiere
 * depender de `next/headers`.
 */
export function paisDeLaPeticion(req: Request): Pais {
  const cookie = req.headers.get("cookie") ?? "";
  const encontrada = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_DEL_PAIS}=`));
  const valor = encontrada?.slice(COOKIE_DEL_PAIS.length + 1);
  return esPais(valor) ? valor : PAIS_POR_DEFECTO;
}
