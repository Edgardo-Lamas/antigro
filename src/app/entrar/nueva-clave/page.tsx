"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import CampoDeClave from "@/components/CampoDeClave";
import { CLAVE_MINIMA } from "@/lib/hogares";
import Tarjeta, { BOTON, ETIQUETA } from "../Tarjeta";

/**
 * La clave nueva, desde el enlace que llegó por correo (24/9). Ver
 * `/api/clave/restablecer`.
 */
export default function NuevaClave() {
  return (
    <Suspense fallback={null}>
      <Formulario />
    </Suspense>
  );
}

function Formulario() {
  const params = useSearchParams();
  const [enlace] = useState(() => params.get("t") ?? "");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");
  const [vencido, setVencido] = useState(false);

  /* 🔴 El enlace se saca de la barra de direcciones apenas se lee. Así no queda
     en el historial del navegador ni viaja si alguien copia la dirección para
     pedir ayuda. */
  useEffect(() => {
    if (enlace) window.history.replaceState(null, "", "/entrar/nueva-clave");
  }, [enlace]);

  async function cambiar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch("/api/clave/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enlace, nueva, repetida }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.error ?? "No pudimos cambiar la clave.");
        setVencido(Boolean(datos.vencido));
        return;
      }
      setListo(true);
    } catch {
      setError("No pudimos conectar. Fijate la señal y probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!enlace) {
    return (
      <Tarjeta titulo="Falta el enlace" bajada="Esta pantalla se abre desde el correo que te mandamos.">
        <p className="text-center text-xs">
          <Link href="/entrar/olvide" className="text-acento hover:underline">
            Pedir un enlace nuevo
          </Link>
        </p>
      </Tarjeta>
    );
  }

  if (listo) {
    return (
      <Tarjeta
        titulo="Listo, la clave quedó cambiada"
        bajada="Cualquier sesión que estuviera abierta con la clave anterior se cerró."
      >
        <Link href="/entrar" className={BOTON}>
          Entrar con la clave nueva
        </Link>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta titulo="Elegí una clave nueva" bajada={`Al menos ${CLAVE_MINIMA} caracteres.`}>
      <form onSubmit={cambiar} className="flex flex-col gap-4">
        <div>
          <label className={ETIQUETA} htmlFor="nueva">
            Clave nueva
          </label>
          <CampoDeClave
            id="nueva"
            value={nueva}
            onChange={setNueva}
            required
            minLength={CLAVE_MINIMA}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className={ETIQUETA} htmlFor="repetida">
            Otra vez
          </label>
          <CampoDeClave
            id="repetida"
            value={repetida}
            onChange={setRepetida}
            required
            minLength={CLAVE_MINIMA}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-xs leading-relaxed text-riesgo">
            {error}{" "}
            {vencido && (
              <Link href="/entrar/olvide" className="text-acento hover:underline">
                Pedir uno nuevo
              </Link>
            )}
          </p>
        )}
        <button type="submit" disabled={enviando} className={BOTON}>
          {enviando ? <LoaderCircle size={14} className="animate-spin" /> : null}
          {enviando ? "Guardando…" : "Guardar la clave nueva"}
        </button>
      </form>
    </Tarjeta>
  );
}
