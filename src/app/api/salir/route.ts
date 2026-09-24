import { signOut } from "@/auth";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA SALIDA DE UNA SESIÓN QUE YA NO VALE — auditoría del 24/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Existe para cortar un bucle.** Desde el 24/9 una sesión puede dejar de
 *  valer antes de vencer: se cambió la clave, se pausó la familia o el centro.
 *  La pantalla no puede mandar a `/entrar` a secas, porque el middleware ve una
 *  sesión —vencida para la base, viva para el token— y la devuelve al panel, y
 *  el panel a `/entrar`, y así. Acá se borra la sesión de verdad.
 *
 *  📌 Es `GET` porque la usa un `redirect()` de servidor. Lo único que alguien
 *  puede hacer con eso desde otra página es cerrarle la sesión a otro, que se
 *  arregla volviendo a entrar.
 */
export async function GET() {
  await signOut({ redirectTo: "/entrar" });
}
