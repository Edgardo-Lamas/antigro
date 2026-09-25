import { NextResponse } from "next/server";
import { deQuienViene, tomarTurno } from "@/lib/limite";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DÓNDE LLEGAN LOS AVISOS DE LA CSP — AUD-007, 25/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  La política va en `Content-Security-Policy-Report-Only` (ver
 *  `next.config.mjs`): el navegador NO bloquea nada, sólo cuenta acá lo que
 *  bloquearía. Cada aviso queda en el registro de Vercel con la marca `[csp]`.
 *
 *  🔑 Se mira durante unos días y recién entonces se pasa a la cabecera que
 *  bloquea. Si aparece algo legítimo (un recurso propio que la política no
 *  contempla), se agrega a la política antes de encenderla.
 *
 *  📌 Es pública por necesidad —la llama el navegador de cualquiera—, así que
 *  tiene tope por IP y sólo registra los campos que sirven, recortados.
 */

export const dynamic = "force-dynamic";

const TOPE = 30;
const VENTANA_SEG = 60;

type Aviso = Record<string, unknown>;

/** Los dos formatos que mandan los navegadores: el viejo y el de Reporting API. */
function avisosDe(cuerpo: unknown): Aviso[] {
  if (Array.isArray(cuerpo)) {
    return cuerpo
      .filter((r) => r && typeof r === "object" && (r as Aviso).type === "csp-violation")
      .map((r) => ((r as Aviso).body ?? {}) as Aviso);
  }
  if (cuerpo && typeof cuerpo === "object" && "csp-report" in cuerpo) {
    return [(cuerpo as Record<string, Aviso>)["csp-report"]];
  }
  return [];
}

const corto = (v: unknown) => String(v ?? "").slice(0, 200);

export async function POST(req: Request) {
  const turno = await tomarTurno(`csp:${deQuienViene(req)}`, VENTANA_SEG, TOPE);
  if (!turno.permitido) return new NextResponse(null, { status: 204 });

  const cuerpo = await req.json().catch(() => null);
  for (const a of avisosDe(cuerpo).slice(0, 10)) {
    console.warn(
      "[csp]",
      JSON.stringify({
        directiva: corto(a["effectiveDirective"] ?? a["effective-directive"] ?? a["violated-directive"]),
        bloqueado: corto(a["blockedURL"] ?? a["blocked-uri"]),
        pagina: corto(a["documentURL"] ?? a["document-uri"]),
        origen: corto(a["sourceFile"] ?? a["source-file"]),
      }),
    );
  }
  return new NextResponse(null, { status: 204 });
}
