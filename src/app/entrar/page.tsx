"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LoaderCircle } from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA PUERTA DE LA FAMILIA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 No es la misma que `/panel/login`. Esa es la de administración; ésta es
 *  la que abre un padre o una madre, muchas veces por primera vez y muchas
 *  veces preocupado. Por eso dice qué es esto antes de pedir nada.
 *
 *  📌 **No hay «crear cuenta», y es a propósito.** Las cuentas las crea AntiGro
 *  al dar de alta el servicio, porque un alta trae decisiones que no se toman
 *  en un formulario: quiénes son los dos adultos responsables, quién es el
 *  referente de afuera y la conversación con el chico. Poner un botón de
 *  registro acá sería prometer un autoservicio que el producto no tiene.
 */

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await signIn("credentials", { email, password: clave, redirect: false });
      if (res?.ok) router.push("/mi-familia");
      /* ⚠ Un solo mensaje para las dos fallas —email que no existe y
         contraseña equivocada— a propósito: si dijera cuál de las dos es,
         cualquiera podría averiguar qué direcciones tienen cuenta en un
         sistema que cuida chicos. */
      else setError("El email o la contraseña no coinciden.");
    } finally {
      setCargando(false);
    }
  }

  const campo =
    "w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-tinta outline-none focus:border-acento";
  const etiqueta = "mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-apagado";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-borde bg-superficie px-7 py-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-lg bg-acentoSuave">
              <ShieldCheck size={19} className="text-acento" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
              AntiGro
            </p>
            <p className="mt-2 text-base font-semibold text-tinta">Entrá a tu familia</p>
            <p className="mt-1.5 text-xs leading-relaxed text-tenue">
              Acá están los avisos, los informes y el asistente. Sólo los adultos responsables
              tienen cuenta.
            </p>
          </div>

          <form onSubmit={enviar} className="flex flex-col gap-3.5">
            <div>
              <label className={etiqueta} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={campo}
              />
            </div>

            <div>
              <label className={etiqueta} htmlFor="clave">
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                autoComplete="current-password"
                className={campo}
              />
            </div>

            {error && <p className="text-xs text-riesgo">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="mt-1 flex items-center justify-center gap-2 rounded-md bg-acento px-4 py-2.5 text-sm font-semibold text-fondo transition disabled:cursor-not-allowed disabled:bg-borde disabled:text-apagado"
            >
              {cargando ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" /> Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-apagado">
          ¿Todavía no tenés cuenta? Las crea AntiGro cuando se da de alta el servicio en tu casa.
          Podés{" "}
          <Link href="/" className="text-acento underline">
            ver cómo funciona
          </Link>{" "}
          sin registrarte.
        </p>
      </div>
    </div>
  );
}
