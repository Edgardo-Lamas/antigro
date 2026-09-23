"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CampoDeClave from "@/components/CampoDeClave";

/**
 * Los centros educativos, desde la administración: la lista y el alta.
 *
 * 📌 El alta crea el centro y la cuenta de su coordinador. Lo demás —el enlace
 * para las familias, el Telegram, el distintivo— lo ve el propio centro en su
 * panel, así que acá no se repite.
 */

export interface CentroEnLista {
  id: string;
  nombre: string;
  pais: string;
  licencias: number;
  familias: number;
  activo: boolean;
  distintivo: string;
  telegram: boolean;
}

const campo =
  "w-full rounded-md border border-borde bg-fondo px-3 py-2 text-base text-tinta outline-none transition focus:border-acento sm:text-sm";

export default function Centros({ centros, hayBase }: { centros: CentroEnLista[]; hayBase: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState<"ES" | "AR">("ES");
  const [licencias, setLicencias] = useState("50");
  const [coordinador, setCoordinador] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/panel/centros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          pais,
          licencias: Number(licencias),
          coordinador,
          email,
          clave,
        }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.error ?? "No se pudo crear el centro.");
        return;
      }
      setAbierto(false);
      setNombre("");
      setCoordinador("");
      setEmail("");
      setClave("");
      router.refresh();
    } catch {
      setError("No pudimos conectar. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(id: string, activo: boolean) {
    await fetch("/api/panel/centros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo }),
    }).catch(() => null);
    router.refresh();
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Centros educativos
        </h2>
        {hayBase && !abierto && (
          <button
            onClick={() => setAbierto(true)}
            className="text-xs text-acento underline underline-offset-4"
          >
            Dar de alta un centro
          </button>
        )}
      </div>

      {!hayBase && (
        <p className="mt-3 text-sm text-tenue">
          Sin base de datos no se pueden crear centros: su cuenta no sobreviviría a un reinicio.
        </p>
      )}

      {centros.length > 0 && (
        <ul className="mt-4 divide-y divide-borde rounded-lg border border-borde bg-superficie">
          {centros.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-tinta">{c.nombre}</p>
                <p className="mt-0.5 text-xs text-apagado">
                  {c.pais} · {c.familias} de {c.licencias} licencias ·{" "}
                  {c.telegram ? "Telegram conectado" : "Telegram sin conectar"} ·{" "}
                  <a
                    href={`/distintivo/${c.distintivo}`}
                    target="_blank"
                    className="underline decoration-borde underline-offset-4 hover:text-acento"
                  >
                    distintivo
                  </a>
                </p>
              </div>
              <button
                onClick={() => cambiarEstado(c.id, !c.activo)}
                className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  c.activo ? "bg-acentoSuave text-acento" : "bg-borde text-apagado"
                }`}
                title={c.activo ? "Pausar el centro" : "Reactivar el centro"}
              >
                {c.activo ? "activo" : "pausado"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <form
          onSubmit={crear}
          className="mt-4 flex flex-col gap-3 rounded-lg border border-borde bg-superficie px-5 py-5"
        >
          <label className="text-sm text-tenue">
            Nombre del centro
            <input className={`${campo} mt-1`} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-tenue">
              País
              <select
                className={`${campo} mt-1`}
                value={pais}
                onChange={(e) => setPais(e.target.value as "ES" | "AR")}
              >
                <option value="ES">España</option>
                <option value="AR">Argentina</option>
              </select>
            </label>
            <label className="flex-1 text-sm text-tenue">
              Licencias
              <input
                className={`${campo} mt-1`}
                type="number"
                min={1}
                value={licencias}
                onChange={(e) => setLicencias(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="text-sm text-tenue">
            Quién coordina (bienestar y protección)
            <input
              className={`${campo} mt-1`}
              value={coordinador}
              onChange={(e) => setCoordinador(e.target.value)}
              required
            />
          </label>
          <label className="text-sm text-tenue">
            Correo de la cuenta del centro
            <input
              className={`${campo} mt-1`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <div className="text-sm text-tenue">
            Clave de la cuenta del centro
            <div className="mt-1">
              <CampoDeClave
                value={clave}
                onChange={setClave}
                autoComplete="new-password"
                required
                minLength={8}
                aria-label="Clave de la cuenta del centro"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={cargando}
              className="rounded-md bg-acento px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {cargando ? "Creando…" : "Crear el centro"}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="text-sm text-tenue">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
