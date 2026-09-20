import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Globe } from "lucide-react";
import { COOKIE_DEL_PAIS, DURACION_DE_LA_COOKIE, esPais, NOMBRE_DEL_PAIS, type Pais } from "@/lib/paises";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL SELECTOR DE PAÍS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Lo que cambia no es el idioma: son los teléfonos, los organismos y las
 *  normas.** Por eso el rótulo dice «Contactos y normas de» y no «Idioma». Un
 *  selector que promete idioma y devuelve teléfonos miente dos veces: al que
 *  esperaba que le cambiara el texto y al que no entendió que le cambió el
 *  número de emergencia.
 *
 *  📌 **Es un `form`, no un `select` con JavaScript.** Anda sin JS, el teclado
 *  lo maneja solo, y cada opción es un botón que se ve — con dos países, un
 *  desplegable esconde justo la mitad de la función.
 */

/**
 * 🔴 La cookie se escribe en una Server Action porque es el único lugar donde
 * Next deja escribirla. `revalidatePath("/", "layout")` es lo que hace que la
 * guía, los términos y la consola se vuelvan a dibujar con el país nuevo: sin
 * eso, la elección queda guardada y la pantalla sigue mostrando la anterior,
 * que es la forma más rápida de que alguien crea que el selector no anda.
 */
async function elegirPais(formData: FormData) {
  "use server";
  const elegido = formData.get("pais");
  if (!esPais(elegido)) return;

  cookies().set(COOKIE_DEL_PAIS, elegido, {
    maxAge: DURACION_DE_LA_COOKIE,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
}

const PAISES: Pais[] = ["AR", "ES"];

export default function SelectorDePais({
  actual,
  className = "",
}: {
  actual: Pais;
  className?: string;
}) {
  return (
    <form
      action={elegirPais}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <span className="flex items-center gap-1.5 text-xs text-apagado">
        <Globe size={13} aria-hidden />
        Contactos y normas de
      </span>
      <div className="flex gap-1.5">
        {PAISES.map((p) => (
          <button
            key={p}
            type="submit"
            name="pais"
            value={p}
            aria-pressed={actual === p}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              actual === p
                ? "border-acento bg-acentoSuave text-tinta"
                : "border-borde text-tenue hover:border-tenue/60 hover:text-tinta"
            }`}
          >
            {NOMBRE_DEL_PAIS[p]}
          </button>
        ))}
      </div>
    </form>
  );
}
