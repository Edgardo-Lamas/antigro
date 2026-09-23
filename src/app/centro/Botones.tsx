"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function Salir() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/entrar" })}
      className="text-xs text-tenue underline decoration-borde underline-offset-4 transition hover:text-acento"
    >
      Salir
    </button>
  );
}

/** Copia un texto y lo dice. Si el navegador no deja copiar, el texto sigue a la vista. */
export function Copiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
  const [hecho, setHecho] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setHecho(true);
          setTimeout(() => setHecho(false), 2000);
        } catch {
          setHecho(false);
        }
      }}
      className="shrink-0 rounded border border-borde px-2.5 py-1 text-xs text-tenue transition hover:border-acento hover:text-acento"
    >
      {hecho ? "Copiado" : etiqueta}
    </button>
  );
}
