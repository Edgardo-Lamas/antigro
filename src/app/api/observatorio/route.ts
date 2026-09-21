import { NextResponse } from "next/server";

import { estadoDelIndice, queEsEsteLugar } from "@/lib/senales/categorias";
import { edadDelDominio } from "@/lib/senales/edad-del-dominio";
import { repositorio } from "@/lib/datos";
import { analizar, conLaEdad, type FilaDelObservatorio, type Universo } from "@/lib/observatorio";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL OBSERVATORIO, EXPUESTO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Hoy el observatorio real está VACÍO y esta ruta lo dice.** Hay una sola
 *  familia sembrada: no hay dos casas distintas que comparar, así que no hay
 *  nada que informar. Publicar un hallazgo con un caso sería exactamente el
 *  error que el módulo entero está escrito para evitar.
 *
 *  Con `?ejemplo=1` corre el mismo cálculo sobre un juego de números
 *  **inventados y rotulados como tales**, para poder mostrar el método sin
 *  inventar un dato. La diferencia entre mostrar el método y mostrar un
 *  resultado es la diferencia entre explicarse y mentir.
 */

export const dynamic = "force-dynamic";

/**
 * Números a mano, elegidos para que se vea la trampa que el módulo resuelve.
 * 100 chicos observados, 10 con patrón sostenido — o sea, el 10% de base.
 */
const UNIVERSO_EJEMPLO: Universo = { chicos: 100, chicosConAlerta: 10 };

const FILAS_EJEMPLO: FilaDelObservatorio[] = [
  {
    // 🔴 LA TRAMPA: está en TODOS los chicos. Contando, sería el nº 1.
    dominio: "whatsapp.net",
    puerta: "requiere_entrega",
    chicosQueLoVieron: 100,
    chicosConAlerta: 10,
    primeraVez: "2026-06-01",
    ultimaVez: "2026-08-15",
  },
  {
    /* Público DIVERSO: es lo que tiene un juego de verdad. Sirve de contraste. */
    dominio: "roblox.com",
    puerta: "contacto_abierto",
    chicosQueLoVieron: 60,
    chicosConAlerta: 8,
    primeraVez: "2026-06-03",
    ultimaVez: "2026-08-14",
    porPerfil: {
      "7-10|nena": 14,
      "7-10|varon": 16,
      "11-13|nena": 12,
      "11-13|varon": 11,
      "14-17|nena": 4,
      "14-17|varon": 3,
    },
  },
  {
    /**
     * 🔑 EL CASO DE EDGARDO: diez chicos en el mismo lugar, **todas nenas de 10**.
     * Ojo con lo que pasa acá: el `lift` es apenas 2,0 —la mitad no tiene alerta
     * todavía— y aun así el hallazgo entra, **por el perfil**. Es exactamente lo
     * que el índice agrega: ve el patrón ANTES de que la mitad de esos chicos
     * llegue a tener una alerta.
     */
    dominio: "amigos-secretos.click",
    puerta: "desconocida",
    chicosQueLoVieron: 10,
    chicosConAlerta: 2,
    primeraVez: "2026-08-05",
    ultimaVez: "2026-08-12",
    porPerfil: { "7-10|nena": 10 },
  },
  {
    // 🔑 EL HALLAZGO: pocos chicos, casi todos alertados, y en pocos días.
    dominio: "chat-libre-24.top",
    puerta: "desconocida",
    chicosQueLoVieron: 4,
    chicosConAlerta: 4,
    primeraVez: "2026-08-02",
    ultimaVez: "2026-08-09",
  },
  {
    dominio: "tiktok.com",
    puerta: "contacto_abierto",
    chicosQueLoVieron: 82,
    chicosConAlerta: 9,
    primeraVez: "2026-06-01",
    ultimaVez: "2026-08-15",
  },
];

export async function GET(req: Request) {
  const ejemplo = new URL(req.url).searchParams.get("ejemplo") === "1";

  if (!ejemplo) {
    /* 📌 Cuando el registro agregado exista de verdad, acá se lo lee y se lo
       pasa por `analizar`. La función ya está escrita y probada: lo que falta
       es la acumulación, que necesita más de una familia para significar algo.

       🔴 **El universo se MIDE, no se afirma — corregido el 20/8.** Acá estaba
       escrito a mano (`{ chicos: 1 }`) junto con la frase «hay una sola familia
       sembrada». Era verdad el día que se escribió y deja de serlo el primer día
       que alguien se da de alta, **sin que nada avise**. Y es justo el reproche
       que la guía del producto le hace a los demás: *un observatorio que informa
       un hallazgo sin decir sobre cuántos casos se apoya*. */
    const universo = await repositorio().universoObservado();

    return NextResponse.json({
      ejemplo: false,
      universo,
      hallazgos: [],
      nota:
        `El observatorio se apoya hoy en ${universo.chicos} ` +
        `${universo.chicos === 1 ? "chico observado" : "chicos observados"}, ` +
        `${universo.chicosConAlerta} con alerta. ` +
        "Todavía no informa nada: para comparar hacen falta chicos de casas distintas, " +
        "y publicar un hallazgo sin eso sería el error que este módulo existe para evitar. " +
        "Probá con ?ejemplo=1 para ver el método.",
    });
  }

  /* 🔑 Acá se le pasa la lista de categorización, que sólo existe del lado del
     servidor. Ver `QueEsAfuera` en el observatorio. */
  const queEsAfuera = (dominio: string) => {
    const lugar = queEsEsteLugar(dominio);
    if (!lugar) return null;
    return { esto: lugar.esto, daLineaBase: lugar.hace === "linea_base" };
  };
  const crudos = analizar(FILAS_EJEMPLO, UNIVERSO_EJEMPLO, queEsAfuera);

  /* 🔑 La edad del dominio se pregunta SÓLO por los que ya pasaron el filtro, y
     con tope: es una consulta de red por dominio. Si el registro no contesta, el
     observatorio contesta igual sin ese dato. */
  const edades = new Map<string, { dias: number; nuevo: boolean } | null>();
  await Promise.all(
    crudos.slice(0, 10).map(async (h) => {
      const edad = await edadDelDominio(h.dominio);
      edades.set(h.dominio, edad ? { dias: edad.dias, nuevo: edad.nuevo } : null);
    }),
  );
  const hallazgos = conLaEdad(crudos, edades);

  /* 🔑 Con qué lista está trabajando, y de cuándo es. Va en la respuesta por el
     mismo motivo que el parte dice cuándo el sistema dejó de ver: **un sistema
     que perdió una fuente tiene que poder contarlo.** Y de paso es la única
     forma de verificar desde afuera que el índice llegó al despliegue. */
  return NextResponse.json({
    ejemplo: true,
    lista: estadoDelIndice(),
    advertencia:
      "🔴 NÚMEROS INVENTADOS. Sirven para mostrar cómo decide el observatorio, no son " +
      "un hallazgo ni una medición. Ningún dato de acá se puede citar.",
    universo: UNIVERSO_EJEMPLO,
    hallazgos,
    descartados: FILAS_EJEMPLO.filter((f) => !hallazgos.some((h) => h.dominio === f.dominio)).map(
      (f) => f.dominio,
    ),
  });
}
