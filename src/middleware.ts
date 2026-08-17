import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUIÉN PUEDE ESTAR DÓNDE — hay DOS puertas, y no son la misma
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  | Dirección      | Quién entra                    | Con qué          |
 *  |----------------|--------------------------------|------------------|
 *  | `/panel`       | La administración (Edgardo)    | cuenta `admin`   |
 *  | `/mi-familia`  | Los dos adultos responsables   | cuenta `adulto`  |
 *  | `/familia/[t]` | Cualquiera con el enlace       | nada             |
 *
 *  🔴 **Un `admin` NO entra a `/mi-familia`, aunque sea la cuenta más
 *  poderosa del sistema.** No es por permisos: es que una cuenta de
 *  administración no pertenece a ninguna familia, así que ahí no hay nada
 *  coherente que mostrarle. Y un producto que cuida chicos no debería tener
 *  una puerta lateral por la que la administración mire el informe de una
 *  criatura sin que la familia lo sepa. Si algún día hace falta soporte, se
 *  diseña con la familia enterada, no como efecto secundario de un rol.
 */

const puerta = (rol: unknown): "/panel" | "/mi-familia" =>
  rol === "adulto" ? "/mi-familia" : "/panel";

export default auth((req) => {
  const ruta = req.nextUrl.pathname;
  const sesion = req.auth;
  const rol = (sesion?.user as { rol?: unknown } | undefined)?.rol;

  const enPanel = ruta.startsWith("/panel");
  const enLoginDelPanel = ruta === "/panel/login";
  const enMiFamilia = ruta.startsWith("/mi-familia");
  const enEntrar = ruta === "/entrar";
  /** El recorrido de alta: ya hay credencial, falta quién vive en la casa. */
  const enAlta = ruta.startsWith("/alta");

  /* ── Las dos pantallas de logueo ──────────────────────────────────────── */
  // Ya con sesión abierta, ninguna de las dos tiene sentido: va a su casa.
  if ((enLoginDelPanel || enEntrar) && sesion) {
    return NextResponse.redirect(new URL(puerta(rol), req.url));
  }

  /* ── El panel de administración ───────────────────────────────────────── */
  if (enPanel && !enLoginDelPanel) {
    if (!sesion) return NextResponse.redirect(new URL("/panel/login", req.url));
    if (rol !== "admin") return NextResponse.redirect(new URL("/mi-familia", req.url));
  }

  /* ── El panel de la familia ───────────────────────────────────────────── */
  if (enMiFamilia) {
    if (!sesion) return NextResponse.redirect(new URL("/entrar", req.url));
    if (rol !== "adulto") return NextResponse.redirect(new URL("/panel", req.url));
  }

  /* ── El recorrido de alta ─────────────────────────────────────────────── */
  /* 🔑 Misma regla que el panel: es de la familia, no de la administración. Un
     `admin` no pertenece a ninguna familia, así que acá no tiene qué cargar. */
  if (enAlta) {
    if (!sesion) return NextResponse.redirect(new URL("/entrar", req.url));
    if (rol !== "adulto") return NextResponse.redirect(new URL("/panel", req.url));
  }
});

// ⚠ `/panel/:path*` por sí solo NO cubre `/panel`. Van los dos, y lo mismo
//   vale para `/mi-familia`.
export const config = {
  matcher: [
    "/panel",
    "/panel/:path*",
    "/mi-familia",
    "/mi-familia/:path*",
    "/entrar",
    "/alta",
    "/alta/:path*",
  ],
};
