import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * El panel de contratación pide cuenta. El enlace de cada familia
 * (`/familia/[token]`) no: los adultos entran sin cuenta, con su enlace privado.
 */
export default auth((req) => {
  const enPanel = req.nextUrl.pathname.startsWith("/panel");
  const enLogin = req.nextUrl.pathname === "/panel/login";

  if (enPanel && !enLogin && !req.auth) {
    return NextResponse.redirect(new URL("/panel/login", req.url));
  }
  if (enLogin && req.auth) {
    return NextResponse.redirect(new URL("/panel", req.url));
  }
});

// ⚠ `/panel/:path*` por sí solo NO cubre `/panel`. Van los dos.
export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
