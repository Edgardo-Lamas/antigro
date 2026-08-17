import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import {
  APARATOS,
  COMPROBACION,
  guiaPara,
  perfilApple,
  scriptWindows,
  type Aparato,
} from "@/lib/instalacion";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ TIENE QUE INSTALAR LA FAMILIA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **El perfil sale de la SESIÓN, nunca del pedido.** Si el navegador pudiera
 *  pedir «dame el perfil tal», cualquiera con una cuenta se bajaría el perfil de
 *  otra casa — y ese perfil es la dirección exacta a la que ese chico le manda
 *  todas sus consultas de red.
 *
 *  🔑 **Y si la familia todavía no tiene perfil de NextDNS, no se inventa uno.**
 *  Hoy AntiGro corre con el simulador, así que muchas familias no lo van a
 *  tener. Entregar un archivo con un identificador vacío daría una instalación
 *  que parece hecha y no reporta nada — que es exactamente el fallo silencioso
 *  que toda esta pantalla existe para evitar.
 */

export const dynamic = "force-dynamic";

/** Nombres de archivo sin el nombre del chico: se bajan a una carpeta cualquiera. */
const NOMBRE_ARCHIVO = {
  apple: "antigro.mobileconfig",
  windows: "antigro-windows.bat",
} as const;

const TIPO = {
  apple: "application/x-apple-aspen-config",
  windows: "application/octet-stream",
} as const;

export async function GET(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string | null } | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const datos = await repositorio().familiaPorId(usuario.familiaId);
  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];
  const perfil = chico?.nextdnsProfileId;

  const url = new URL(req.url);
  const aparato = url.searchParams.get("aparato") as Aparato | null;
  const archivo = url.searchParams.get("archivo");

  /* ── Bajar un archivo ────────────────────────────────────────────────── */
  if (archivo) {
    if (!perfil) {
      return NextResponse.json({ error: "sin_perfil" }, { status: 409 });
    }
    if (archivo === "apple") {
      const cual: Aparato = aparato === "mac" ? "mac" : "iphone";
      return new NextResponse(perfilApple({ perfil, aparato: cual }), {
        headers: {
          "Content-Type": TIPO.apple,
          "Content-Disposition": `attachment; filename="${NOMBRE_ARCHIVO.apple}"`,
          "Cache-Control": "no-store",
        },
      });
    }
    if (archivo === "windows") {
      return new NextResponse(scriptWindows(perfil), {
        headers: {
          "Content-Type": TIPO.windows,
          "Content-Disposition": `attachment; filename="${NOMBRE_ARCHIVO.windows}"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ error: "archivo_desconocido" }, { status: 400 });
  }

  /* ── Las guías ───────────────────────────────────────────────────────── */
  return NextResponse.json({
    /**
     * 🔴 Si esto viene en `false`, la pantalla NO puede mostrar los pasos como
     * si fueran a servir. Que lo diga el servidor y no lo deduzca el navegador
     * es lo que evita que un cambio de diseño lo tape sin querer.
     */
    listo: Boolean(perfil),
    motivo: perfil
      ? null
      : "Esta familia todavía no tiene perfil de red asignado, así que la instalación no " +
        "reportaría nada. Hasta que lo tenga, el sistema trabaja con datos simulados y lo dice " +
        "en pantalla.",
    chico: chico ? { nombre: chico.nombre, edad: chico.edad } : null,
    comprobacion: COMPROBACION,
    /* Se manda con perfil vacío cuando no hay: los textos se leen igual, y lo
       que no aparece es el archivo ni el dato para copiar. Que un padre pueda
       LEER qué va a tener que hacer antes de poder hacerlo no molesta a nadie. */
    guias: APARATOS.map((a) => {
      const g = guiaPara(a.id, perfil ?? "");
      return { ...g, aCopiar: perfil ? g.aCopiar : undefined };
    }),
  });
}
