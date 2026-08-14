"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, ShieldOff } from "lucide-react";
import { NOMBRE_DE_SENAL, type SenalDeRed, type TipoDeSenal } from "@/lib/senales/tipos";

/**
 * El enlace privado de cada familia. Se entra sin cuenta.
 *
 * 📌 Fase 0: se ve qué señales llegaron y por qué fuente. La lectura en
 * pantalla —qué vio la red, qué contaron los adultos, qué mirar ahora— es la
 * fase 4.
 */

interface Respuesta {
  nombre: string;
  demo: boolean;
  ventana: { desde: string; hasta: string; dias: number };
  fuente: { id: string; nombre: string; simulada: boolean; motivo?: string };
  escenario: string;
  senales: SenalDeRed[];
  actualizado: string;
}

/** `YYYY-MM-DD` en la hora local del que mira, no en UTC. */
function diaLocal(iso: string): string {
  const d = new Date(iso);
  const mes = `${d.getMonth() + 1}`.padStart(2, "0");
  const dia = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const COLOR: Record<TipoDeSenal, string> = {
  volumen: "bg-acento",
  madrugada: "bg-atencion",
  plataforma_nueva: "bg-acento",
  evasion: "bg-riesgo",
};

export default function EnlaceDeFamilia({ params }: { params: { token: string } }) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [estado, setEstado] = useState<"cargando" | "ok" | "error" | "inactivo">("cargando");

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/familia/${params.token}`, { cache: "no-store" });
      if (res.status === 404) return setEstado("error");
      if (res.status === 403) return setEstado("inactivo");
      setDatos(await res.json());
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, [params.token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado === "cargando") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle size={22} className="animate-spin text-acento" />
      </div>
    );
  }

  if (estado !== "ok" || !datos) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
        <ShieldOff size={36} className="text-apagado" />
        <p className="text-sm text-tenue">
          {estado === "inactivo"
            ? "El servicio está pausado para esta familia."
            : "Este enlace no es válido o fue desactivado."}
        </p>
      </div>
    );
  }

  /* Señales agrupadas por día, que es como se mira la persistencia.
     ⚠ Por día LOCAL, no UTC: una señal de las 22 en Argentina cae al día
     siguiente en UTC, y correría toda la línea de tiempo un día. */
  const porDia = new Map<string, SenalDeRed[]>();
  for (const s of datos.senales) {
    const dia = diaLocal(s.fecha);
    porDia.set(dia, [...(porDia.get(dia) ?? []), s]);
  }
  const dias: [string, SenalDeRed[]][] = Array.from(porDia.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <header className="border-b border-borde pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">AntiGro</p>
        <h1 className="mt-3 text-2xl font-bold text-tinta">{datos.nombre}</h1>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          Últimos {datos.ventana.dias} días. Se ve cuándo pasó algo y de qué tipo era. No se ve
          —ni se guarda— nada de lo que el chico escribió.
        </p>
        {datos.fuente.simulada && (
          <p className="mt-3 inline-block rounded bg-atencionSuave px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-atencion">
            datos simulados · escenario {datos.escenario}
          </p>
        )}
      </header>

      <section className="mt-8">
        {dias.length === 0 ? (
          <p className="text-sm text-tenue">
            Sin señales en estas tres semanas. Cuando no pasa nada, el sistema no dice nada.
          </p>
        ) : (
          <ul className="divide-y divide-borde">
            {dias.map(([dia, senales]) => (
              <li key={dia} className="flex items-center gap-4 py-3">
                <span className="w-20 shrink-0 font-mono text-xs text-apagado">
                  {new Date(`${dia}T12:00:00`).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {senales.map((s) => (
                    <span
                      key={s.id}
                      title={`${NOMBRE_DE_SENAL[s.tipo]} · intensidad ${s.intensidad.toFixed(2)}`}
                      className={`rounded px-2 py-0.5 text-[11px] text-fondo ${COLOR[s.tipo]}`}
                    >
                      {NOMBRE_DE_SENAL[s.tipo]}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
