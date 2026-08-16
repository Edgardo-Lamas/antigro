"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LoaderCircle, LogOut, QrCode, ShieldOff, UserMinus, MessageCircle } from "lucide-react";
import { NOMBRE_DE_SENAL, type SenalDeRed, type TipoDeSenal } from "@/lib/senales/tipos";
import { NOMBRE_DE_ESTADO, type Estado, type Lectura } from "@/lib/motor/evaluar";
import { MOTIVOS_DE_BAJA, type MotivoDeBaja } from "@/lib/datos/tipos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PANEL DE LA FAMILIA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Lo pidió Edgardo el 16/8: *"un panel donde los padres reciben las
 *  notificaciones, los informes, está el asistente, tienen el código QR para
 *  incluir a los referentes, incluso darlos de baja"*.
 *
 *  📌 Entran los **dos adultos responsables**, cada uno con su cuenta. El chico
 *  y cualquier otro referente no tienen cuenta: escanean y reciben por su canal.
 */

interface Persona {
  id?: string;
  nombre: string;
  vinculado: boolean;
  codigo?: string;
  enlace: string | null;
}

interface Adulto extends Persona {
  id: string;
  vinculo: string;
  elegidoPorElChico: boolean;
  canal: string;
  soyYo: boolean;
  activo?: boolean;
}

interface Respuesta {
  yo: { nombre: string | null; adultoId: string | null };
  familia: { nombre: string; faltantes: string[] };
  chico: {
    id: string;
    nombre: string;
    edad: number;
    canal: string;
    vinculado: boolean;
    codigo?: string;
    enlace: string | null;
    diasObservado: number;
    quienEligeAlReferente: "el_chico" | "los_padres" | null;
  } | null;
  adultos: Adulto[];
  lectura: Lectura | null;
  ventana: { dias: number };
  fuente: { simulada: boolean };
  senales: SenalDeRed[];
}

const COLOR_SENAL: Record<TipoDeSenal, string> = {
  volumen: "bg-acento",
  madrugada: "bg-atencion",
  plataforma_nueva: "bg-acento",
  evasion: "bg-riesgo",
};

const COLOR_ESTADO: Record<Estado, { texto: string; fondo: string; borde: string }> = {
  en_calma: { texto: "text-calma", fondo: "bg-calma/10", borde: "border-calma/30" },
  atencion: { texto: "text-atencion", fondo: "bg-atencionSuave", borde: "border-atencion/40" },
  patron_sostenido: { texto: "text-riesgo", fondo: "bg-riesgoSuave", borde: "border-riesgo/40" },
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

export default function MiFamilia() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [estadoCarga, setEstadoCarga] = useState<"cargando" | "ok" | "error" | "inactivo">(
    "cargando",
  );

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/mi-familia", { cache: "no-store" });
      if (res.status === 403) return setEstadoCarga("inactivo");
      if (!res.ok) return setEstadoCarga("error");
      setDatos(await res.json());
      setEstadoCarga("ok");
    } catch {
      setEstadoCarga("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estadoCarga === "cargando") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle size={22} className="animate-spin text-acento" />
      </div>
    );
  }

  if (estadoCarga !== "ok" || !datos) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
        <ShieldOff size={36} className="text-apagado" />
        <p className="text-sm text-tenue">
          {estadoCarga === "inactivo"
            ? "El servicio está pausado para esta familia."
            : "No pudimos cargar tu familia. Probá de nuevo en un momento."}
        </p>
        <button onClick={() => signOut({ callbackUrl: "/entrar" })} className="text-xs text-acento underline">
          Salir
        </button>
      </div>
    );
  }

  const estado: Estado = datos.lectura?.estado ?? "en_calma";
  const color = COLOR_ESTADO[estado];

  /* Señales agrupadas por día LOCAL, que es como se mira la persistencia.
     En UTC, una señal de las 22 caería al día siguiente y correría la línea. */
  const porDia = new Map<string, SenalDeRed[]>();
  for (const s of datos.senales) {
    const dia = diaLocal(s.fecha);
    porDia.set(dia, [...(porDia.get(dia) ?? []), s]);
  }
  const dias = Array.from(porDia.entries()).sort(([a], [b]) => a.localeCompare(b));

  const activos = datos.adultos.filter((a) => a.activo !== false);
  const deBaja = datos.adultos.filter((a) => a.activo === false);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4 border-b border-borde pb-7">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">AntiGro</p>
          <h1 className="mt-2.5 text-2xl font-bold text-tinta">{datos.familia.nombre}</h1>
          {datos.yo.nombre && (
            <p className="mt-1 text-xs text-apagado">Entraste como {datos.yo.nombre}</p>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/entrar" })}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-borde px-2.5 py-1.5 text-xs text-tenue transition hover:text-tinta"
        >
          <LogOut size={13} /> Salir
        </button>
      </header>

      {datos.fuente.simulada && (
        <p className="mt-5 inline-block rounded bg-atencionSuave px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-atencion">
          datos simulados
        </p>
      )}

      {/* ── Lo que falta para que el sistema trabaje completo ───────────── */}
      {datos.familia.faltantes.length > 0 && (
        <section className="mt-6 rounded-lg border border-atencion/40 bg-atencionSuave px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-atencion">
            Falta algo
          </h2>
          <ul className="mt-2.5 flex flex-col gap-1">
            {datos.familia.faltantes.map((f) => (
              <li key={f} className="text-sm text-atencion">
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── El informe ─────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Cómo viene
        </h2>

        <div className={`mt-3 rounded-lg border px-5 py-5 ${color.borde} ${color.fondo}`}>
          <p className={`text-lg font-semibold ${color.texto}`}>{NOMBRE_DE_ESTADO[estado]}</p>
          {datos.chico && (
            <p className="mt-1.5 text-xs text-tenue">
              Últimos {datos.ventana.dias} días de {datos.chico.nombre}. El sistema lo viene
              mirando hace {datos.chico.diasObservado}{" "}
              {datos.chico.diasObservado === 1 ? "día" : "días"}.
            </p>
          )}

          {datos.lectura && datos.lectura.porQue.length > 0 && (
            <>
              <p className="mt-4 text-[11px] uppercase tracking-[0.1em] text-apagado">Por qué</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {datos.lectura.porQue.map((p) => (
                  <li key={p} className="text-sm leading-relaxed text-tinta">
                    {p}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* 🔴 Va siempre, sobre todo cuando alerta: un sistema que dice lo
              que ve tiene que decir lo que no ve. */}
          {datos.lectura && datos.lectura.loQueNoSeVe.length > 0 && (
            <>
              <p className="mt-4 text-[11px] uppercase tracking-[0.1em] text-apagado">
                Lo que no se ve desde acá
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {datos.lectura.loQueNoSeVe.map((p) => (
                  <li key={p} className="text-sm leading-relaxed text-apagado">
                    {p}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* ── El asistente ───────────────────────────────────────────────── */}
      <section className="mt-8 rounded-lg border border-dashed border-borde px-5 py-5">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-apagado" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-apagado">
            El asistente
          </h2>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-tenue">
          Acá va a estar para explicarte el informe, ordenarte las opciones y decirte cómo abrir
          la conversación. <span className="text-apagado">Todavía no está escrito.</span>
        </p>
      </section>

      {/* ── Quiénes están ──────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Quiénes están
        </h2>

        {datos.chico && (
          <p className="mt-3 text-sm text-tinta">
            {datos.chico.nombre}, {datos.chico.edad} años.{" "}
            <span className="text-apagado">
              {datos.chico.quienEligeAlReferente === "el_chico"
                ? "A esta edad, la persona de confianza de afuera la elige ella o él."
                : "A esta edad, la persona de confianza de afuera la eligen ustedes."}
            </span>
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-4">
          {activos.map((a) => (
            <Referente key={a.id} adulto={a} chico={datos.chico?.nombre} alCambiar={cargar} />
          ))}

          {datos.chico && (
            <li className="flex flex-col gap-1.5 border-t border-borde pt-4">
              <div className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="text-tinta">{datos.chico.nombre}</span>
                <span className="text-apagado">— es a quien cuida el sistema</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-apagado">
                  {datos.chico.canal}
                </span>
              </div>
              <Conexion persona={datos.chico} />
            </li>
          )}
        </ul>

        {deBaja.length > 0 && (
          <div className="mt-6 border-t border-borde pt-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-apagado">Ya no están</p>
            <ul className="mt-2 flex flex-col gap-1">
              {deBaja.map((a) => (
                <li key={a.id} className="text-xs text-apagado">
                  {a.nombre} — {VINCULO[a.vinculo] ?? a.vinculo}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── La línea de tiempo ─────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Qué vio la red
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-apagado">
          Se ve cuándo pasó algo y de qué tipo era. No se ve —ni se guarda— nada de lo que{" "}
          {datos.chico?.nombre ?? "el chico"} escribió.
        </p>

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
                      className={`rounded px-2 py-0.5 text-[11px] text-fondo ${COLOR_SENAL[s.tipo]}`}
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

/* ═══════════════════════════════════════════════════════════════════════════
   PIEZAS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🔑 Acá se ve por qué nadie tiene que crear un bot: cada persona se conecta
 * con un toque. El código existe porque Telegram no deja escribirle a nadie por
 * teléfono — sólo se puede responder a quien le habló al bot primero.
 */
function Conexion({ persona }: { persona: Persona }) {
  const [qr, setQr] = useState<string | null>(null);
  const [pidiendo, setPidiendo] = useState(false);

  if (persona.vinculado) {
    return <p className="text-xs text-calma">Conectado. Los avisos le llegan.</p>;
  }
  if (!persona.codigo) {
    return <p className="text-xs text-atencion">Sin canal cargado.</p>;
  }

  async function verElQr() {
    setPidiendo(true);
    try {
      const res = await fetch(`/api/mi-familia/qr?codigo=${encodeURIComponent(persona.codigo!)}`);
      if (res.ok) setQr((await res.json()).qr);
    } finally {
      setPidiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs leading-relaxed text-atencion">
        Falta que {persona.nombre} escanee el código y apriete «Iniciar». No instala nada.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {persona.enlace && (
          <a href={persona.enlace} className="text-xs text-acento underline" rel="noreferrer">
            Abrir el enlace
          </a>
        )}
        <button
          onClick={verElQr}
          disabled={pidiendo}
          className="flex items-center gap-1.5 rounded-md border border-borde px-2.5 py-1.5 text-xs text-tenue transition hover:text-tinta disabled:opacity-50"
        >
          {pidiendo ? <LoaderCircle size={12} className="animate-spin" /> : <QrCode size={12} />}
          {qr ? "Actualizar el QR" : "Ver el QR"}
        </button>
      </div>

      {qr && (
        <div
          className="mt-1 w-40 overflow-hidden rounded-md"
          // El SVG lo dibuja nuestro propio servidor; no viene de afuera.
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      )}
    </div>
  );
}

/** Un adulto responsable: cómo está conectado y cómo se lo da de baja. */
function Referente({
  adulto,
  chico,
  alCambiar,
}: {
  adulto: Adulto;
  chico?: string;
  alCambiar: () => void;
}) {
  const [abriendoBaja, setAbriendoBaja] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDeBaja>("lo_cambio_el_chico");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function darDeBaja() {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/mi-familia/adultos/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultoId: adulto.id, motivo }),
      });
      if (!res.ok) {
        setError("No se pudo dar de baja. Probá de nuevo.");
        return;
      }
      setAbriendoBaja(false);
      alCambiar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="text-tinta">{adulto.nombre}</span>
        <span className="text-apagado">— {VINCULO[adulto.vinculo] ?? adulto.vinculo}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-apagado">
          {adulto.canal}
        </span>
        {adulto.elegidoPorElChico && (
          <span className="rounded bg-acentoSuave px-1.5 py-0.5 text-[10px] text-acento">
            elección de {chico ?? "el chico"}
          </span>
        )}
        {adulto.soyYo && <span className="text-[10px] text-apagado">(vos)</span>}
      </div>

      <Conexion persona={adulto} />

      {/* 🔴 El cambio no lleva traba: se muda, fallece, pierde el teléfono, o
          el chico lo quiere cambiar. Lo que lleva es motivo — y aviso al chico
          si era su elección. */}
      {!adulto.soyYo && !abriendoBaja && (
        <button
          onClick={() => setAbriendoBaja(true)}
          className="flex w-fit items-center gap-1.5 text-xs text-apagado transition hover:text-riesgo"
        >
          <UserMinus size={12} /> Dar de baja o cambiar
        </button>
      )}

      {abriendoBaja && (
        <div className="mt-1 rounded-md border border-borde bg-superficie px-4 py-3.5">
          <p className="text-xs text-tenue">¿Por qué se va {adulto.nombre}?</p>

          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoDeBaja)}
            className="mt-2 w-full rounded-md border border-borde bg-fondo px-2.5 py-1.5 text-xs text-tinta outline-none focus:border-acento"
          >
            {MOTIVOS_DE_BAJA.map((m) => (
              <option key={m.id} value={m.id}>
                {m.texto}
              </option>
            ))}
          </select>

          {adulto.elegidoPorElChico && (
            <p className="mt-2.5 text-xs leading-relaxed text-atencion">
              A {adulto.nombre} la eligió {chico ?? "el chico"}, así que le vamos a avisar por su
              canal. Después puede elegir a otra persona.
            </p>
          )}

          {error && <p className="mt-2 text-xs text-riesgo">{error}</p>}

          <div className="mt-3 flex gap-2">
            <button
              onClick={darDeBaja}
              disabled={enviando}
              className="flex items-center gap-1.5 rounded-md bg-riesgo px-3 py-1.5 text-xs font-semibold text-fondo disabled:opacity-50"
            >
              {enviando && <LoaderCircle size={12} className="animate-spin" />}
              Confirmar la baja
            </button>
            <button
              onClick={() => setAbriendoBaja(false)}
              className="rounded-md border border-borde px-3 py-1.5 text-xs text-tenue"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
