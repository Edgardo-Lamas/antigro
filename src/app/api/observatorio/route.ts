import { NextResponse } from "next/server";
import { analizar, type FilaDelObservatorio, type Universo } from "@/lib/observatorio";

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
       es la acumulación, que necesita más de una familia para significar algo. */
    return NextResponse.json({
      ejemplo: false,
      universo: { chicos: 1, chicosConAlerta: 0 },
      hallazgos: [],
      nota:
        "El observatorio no tiene datos todavía: hay una sola familia sembrada. " +
        "Con un solo chico no hay nada que comparar, y publicar un hallazgo así sería " +
        "el error que este módulo existe para evitar. Probá con ?ejemplo=1 para ver el método.",
    });
  }

  return NextResponse.json({
    ejemplo: true,
    advertencia:
      "🔴 NÚMEROS INVENTADOS. Sirven para mostrar cómo decide el observatorio, no son " +
      "un hallazgo ni una medición. Ningún dato de acá se puede citar.",
    universo: UNIVERSO_EJEMPLO,
    hallazgos: analizar(FILAS_EJEMPLO, UNIVERSO_EJEMPLO),
    descartados: FILAS_EJEMPLO.filter(
      (f) => !analizar(FILAS_EJEMPLO, UNIVERSO_EJEMPLO).some((h) => h.dominio === f.dominio),
    ).map((f) => f.dominio),
  });
}
