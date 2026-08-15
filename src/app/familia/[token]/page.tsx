"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, ShieldOff } from "lucide-react";
import { NOMBRE_DE_SENAL, type SenalDeRed, type TipoDeSenal } from "@/lib/senales/tipos";

/**
 * El enlace privado de cada familia. Se entra sin cuenta.
 *
 * 📌 Se ve quién está en el sistema y qué señales llegaron. La lectura en
 * pantalla —qué vio la red, qué contaron los adultos, qué mirar ahora— es la
 * fase 4.
 */

interface Respuesta {
  familia: { nombre: string; faltantes: string[] };
  chico: {
    id: string;
    nombre: string;
    edad: number;
    genero: string;
    canal: string;
    vinculado: boolean;
    codigo?: string;
    enlace: string | null;
  } | null;
  adultos: {
    nombre: string;
    vinculo: string;
    elegidoPorElChico: boolean;
    canal: string;
    vinculado: boolean;
    codigo?: string;
    enlace: string | null;
  }[];
  almacenamiento: string;
  ventana: { desde: string; hasta: string; dias: number };
  fuente: { id: string; nombre: string; simulada: boolean; motivo?: string };
  escenario: string;
  senales: SenalDeRed[];
}

const COLOR: Record<TipoDeSenal, string> = {
  volumen: "bg-acento",
  madrugada: "bg-atencion",
  plataforma_nueva: "bg-acento",
  evasion: "bg-riesgo",
};

const VINCULO: Record<string, string> = {
  madre: "Madre",
  padre: "Padre",
  tia_tio: "Tía o tío",
  hermano_a: "Hermano o hermana",
  abuelo_a: "Abuelo o abuela",
  otro: "Otro",
};

/** `YYYY-MM-DD` en la hora local del que mira, no en UTC. */
function diaLocal(iso: string): string {
  const d = new Date(iso);
  const mes = `${d.getMonth() + 1}`.padStart(2, "0");
  const dia = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * 🔑 Acá se ve por qué nadie tiene que crear un bot: cada persona se conecta
 * con un toque. El código existe porque Telegram no deja escribirle a nadie
 * por teléfono — sólo se puede responder a quien le habló al bot primero.
 */
function Vinculacion({
  persona,
}: {
  persona: { nombre: string; vinculado: boolean; codigo?: string; enlace: string | null };
}) {
  if (persona.vinculado) {
    return <p className="text-xs text-calma">Conectado. Los avisos le llegan.</p>;
  }
  if (!persona.codigo) {
    return <p className="text-xs text-atencion">Sin canal cargado.</p>;
  }
  return (
    <p className="text-xs leading-relaxed text-atencion">
      Falta que {persona.nombre} entre una vez y apriete «Iniciar».{" "}
      {persona.enlace ? (
        <a href={persona.enlace} className="text-acento underline" rel="noreferrer">
          Abrir el enlace
        </a>
      ) : (
        <span className="text-apagado">
          (el enlace aparece cuando se configure el bot; código{" "}
          <span className="font-mono">{persona.codigo}</span>)
        </span>
      )}
    </p>
  );
}

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

  /* Señales agrupadas por día LOCAL, que es como se mira la persistencia.
     En UTC, una señal de las 22 caería al día siguiente y correría la línea. */
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
        <h1 className="mt-3 text-2xl font-bold text-tinta">{datos.familia.nombre}</h1>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          Últimos {datos.ventana.dias} días. Se ve cuándo pasó algo y de qué tipo era. No se ve
          —ni se guarda— nada de lo que {datos.chico?.nombre ?? "el chico"} escribió.
        </p>
        {datos.fuente.simulada && (
          <p className="mt-3 inline-block rounded bg-atencionSuave px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-atencion">
            datos simulados · escenario {datos.escenario}
          </p>
        )}
      </header>

      {/* Quiénes están en el sistema */}
      <section className="mt-8 rounded-lg border border-borde bg-superficie px-5 py-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Quiénes están
        </h2>

        {datos.chico && (
          <p className="mt-3 text-sm text-tinta">
            {datos.chico.nombre}, {datos.chico.edad} años.{" "}
            <span className="text-apagado">
              La edad no es un dato de ficha: cambia el peso de cada señal y cambia el texto que
              se le escribe.
            </span>
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {datos.adultos.map((a) => (
            <li key={a.nombre} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="text-tinta">{a.nombre}</span>
                <span className="text-apagado">— {VINCULO[a.vinculo] ?? a.vinculo}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-apagado">
                  {a.canal}
                </span>
                {a.elegidoPorElChico && (
                  <span className="rounded bg-acentoSuave px-1.5 py-0.5 text-[10px] text-acento">
                    elección de {datos.chico?.nombre ?? "el chico"}
                  </span>
                )}
              </div>
              <Vinculacion persona={a} />
            </li>
          ))}
          {datos.chico && (
            <li className="flex flex-col gap-1 border-t border-borde pt-3">
              <div className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="text-tinta">{datos.chico.nombre}</span>
                <span className="text-apagado">— es a quien cuida el sistema</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-apagado">
                  {datos.chico.canal}
                </span>
              </div>
              <Vinculacion persona={datos.chico} />
            </li>
          )}
        </ul>

        {datos.familia.faltantes.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1 border-t border-borde pt-3">
            {datos.familia.faltantes.map((f) => (
              <li key={f} className="text-xs text-atencion">
                {f}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* La línea de tiempo */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Qué vio la red
        </h2>

        {dias.length === 0 ? (
          <p className="mt-3 text-sm text-tenue">
            Sin señales en estas tres semanas. Cuando no pasa nada, el sistema no dice nada.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-borde">
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
