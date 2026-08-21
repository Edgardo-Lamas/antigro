"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, LoaderCircle } from "lucide-react";
import CampoDeClave from "@/components/CampoDeClave";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });

      /* 🔴 **`error`, no `ok`.** NextAuth v5 devuelve `ok: true` con las
         credenciales rechazadas —`{"error":"CredentialsSignin", …, "ok":true}`—
         así que la condición vieja daba por bueno un logueo fallido: empujaba a
         `/panel`, el middleware rebotaba por no haber sesión, y esta pantalla
         volvía muda. Medido y arreglado el 20/8; el mismo cambio está en
         `/entrar`, que es la puerta de las familias. */
      if (!res?.error) router.push("/panel");
      else setError("El email o la contraseña no coinciden.");
    } catch {
      /* Sin esto, un pedido cortado dejaba la pantalla sin decir nada. */
      setError("No pudimos conectar. Probá de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  }

  const campo =
    "w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-tinta outline-none focus:border-acento";
  const etiqueta =
    "mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-apagado";

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-borde bg-superficie px-7 py-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-lg bg-acentoSuave">
            <Lock size={19} className="text-acento" />
          </div>
          <p className="text-base font-semibold text-tinta">Panel AntiGro</p>
          <p className="mt-1 text-xs text-apagado">Alta y seguimiento de familias</p>
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
            <label className={etiqueta} htmlFor="password">
              Contraseña
            </label>
            <CampoDeClave
              id="password"
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
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
                <LoaderCircle size={14} className="animate-spin" /> Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
