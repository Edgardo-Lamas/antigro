"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import Tarjeta, { BOTON, CAMPO, ETIQUETA } from "../Tarjeta";

/**
 * «¿Olvidaste la contraseña?» — se pide el enlace (24/9). Ver
 * `/api/clave/olvide`: contesta lo mismo exista o no el correo.
 */
export default function Olvide() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState("");
  const [error, setError] = useState("");

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch("/api/clave/olvide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const datos = await res.json();
      if (!res.ok) setError(datos.error ?? "No pudimos pedir el enlace.");
      else setListo(datos.mensaje);
    } catch {
      /* Nunca dejar sin voz al que está del otro lado. */
      setError("No pudimos conectar. Fijate la señal y probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tarjeta
      titulo="Recuperar la clave"
      bajada="Poné el correo de tu cuenta y te mandamos un enlace para elegir una clave nueva."
    >
      {listo ? (
        <p className="rounded-md border border-calma/30 bg-calma/10 px-4 py-3 text-sm leading-relaxed text-calma">
          {listo}
        </p>
      ) : (
        <form onSubmit={pedir} className="flex flex-col gap-4">
          <div>
            <label className={ETIQUETA} htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CAMPO}
            />
          </div>
          {error && <p className="text-xs leading-relaxed text-riesgo">{error}</p>}
          <button type="submit" disabled={enviando} className={BOTON}>
            {enviando ? <LoaderCircle size={14} className="animate-spin" /> : null}
            {enviando ? "Pidiendo el enlace…" : "Mandarme el enlace"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-xs text-apagado">
        <Link href="/entrar" className="text-acento hover:underline">
          Volver a entrar
        </Link>
      </p>
    </Tarjeta>
  );
}
