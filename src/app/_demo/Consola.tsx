"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA CONSOLA — lo que ve cualquiera que entra, sin cuenta
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **No es una landing con una demo abajo: la demo ES la home.** Un padre y
 *  un jurado quieren lo mismo — ver el sistema andando sin registrarse.
 *
 *  🔑 **El simulador sólo emite señales. Quién decide es el motor**, con la
 *  misma regla de persistencia, el mismo perfil y el mismo alcance que correrían
 *  contra un NextDNS real. Lo único fabricado es de dónde salen los horarios y
 *  los dominios; el análisis que se ve en pantalla es el del sistema de verdad.
 *  Eso está dicho al pie, no escondido: es lo que hace que se le crea el resto.
 *
 *  ⚠ Los mensajes se piden **a demanda**, con un botón. Redactarlos llama al
 *  modelo, y hacerlo en cada movimiento del reloj sería lento y caro.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { NOMBRE_DE_ESTADO, type Estado, type Lectura } from "@/lib/motor/evaluar";

const DIAS = 21;

const ESCENARIOS = [
  { id: "normal", nombre: "Semana normal", pie: "Lo que se ve en la enorme mayoría de las casas." },
  { id: "cambio_leve", nombre: "Cambio leve", pie: "Unos días distintos que después vuelven a lo de siempre." },
  { id: "persistente", nombre: "Patrón que persiste", pie: "El cambio se sostiene y se profundiza." },
  { id: "evasion", nombre: "Intento de saltar el filtro", pie: "Aparece VPN, proxy o DNS alternativo." },
] as const;

const ADULTOS = [
  { id: "sin_responder", nombre: "Sin responder" },
  { id: "bajo", nombre: "Algunas cosas" },
  { id: "alto", nombre: "Bastantes cosas" },
] as const;

/** 🔴 Sólo se avisa con patrón sostenido: dos adultos y el chico. Si no, nadie. */
function destinatarios(estado: Estado): number {
  return estado === "patron_sostenido" ? 3 : 0;
}

const COLOR_ESTADO: Record<Estado, { texto: string; fondo: string; borde: string }> = {
  en_calma: { texto: "text-calma", fondo: "bg-calma/10", borde: "border-calma/30" },
  atencion: { texto: "text-atencion", fondo: "bg-atencionSuave", borde: "border-atencion/40" },
  patron_sostenido: { texto: "text-riesgo", fondo: "bg-riesgoSuave", borde: "border-riesgo/40" },
};

interface Redactado {
  texto?: string;
  /** 🔑 Se muestra en pantalla: el jurado tiene que poder ver de dónde salió. */
  origen?: "ia" | "respaldo";
  rechazado?: string | null;
}

interface Mensajes {
  paraLosAdultos?: Redactado;
  paraElChico?: Redactado;
}

export default function Consola() {
  const [escenario, setEscenario] = useState<string>("persistente");
  const [edad, setEdad] = useState(12);
  const [genero, setGenero] = useState("nena");
  const [adultos, setAdultos] = useState<string>("sin_responder");
  const [dia, setDia] = useState(DIAS - 1);
  const [corriendo, setCorriendo] = useState(false);

  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [cargando, setCargando] = useState(true);

  const [mensajes, setMensajes] = useState<Mensajes | null>(null);
  const [pidiendoMensajes, setPidiendoMensajes] = useState(false);

  const pedido = useRef(0);

  /* ── La lectura, cada vez que se toca un control ── */
  useEffect(() => {
    const mio = ++pedido.current;
    setCargando(true);
    const q = new URLSearchParams({
      escenario,
      dia: String(dia),
      edad: String(edad),
      genero,
      adultos,
    });
    fetch(`/api/motor/lectura?${q}`)
      .then((r) => r.json())
      .then((d) => {
        // Si mientras tanto entró otro pedido, éste ya no vale.
        if (mio === pedido.current && d?.lectura) setLectura(d.lectura as Lectura);
      })
      .catch(() => {})
      .finally(() => {
        if (mio === pedido.current) setCargando(false);
      });
  }, [escenario, dia, edad, genero, adultos]);

  /* ── El reloj: tres semanas en unos segundos ── */
  useEffect(() => {
    if (!corriendo) return;
    const t = setInterval(() => {
      setDia((d) => {
        if (d >= DIAS - 1) {
          setCorriendo(false);
          return d;
        }
        return d + 1;
      });
    }, 420);
    return () => clearInterval(t);
  }, [corriendo]);

  /* Cambiar de escenario invalida los mensajes que se habían pedido. */
  useEffect(() => setMensajes(null), [escenario, edad, genero, adultos, dia]);

  const reproducir = useCallback(() => {
    setMensajes(null);
    setDia(0);
    setCorriendo(true);
  }, []);

  const pedirMensajes = useCallback(async () => {
    setPidiendoMensajes(true);
    try {
      const q = new URLSearchParams({
        escenario,
        dia: String(dia),
        edad: String(edad),
        genero,
        nombre: genero === "varon" ? "Tomás" : "Ana",
      });
      const r = await fetch(`/api/mensajes?${q}`);
      setMensajes(await r.json());
    } catch {
      setMensajes({});
    } finally {
      setPidiendoMensajes(false);
    }
  }, [escenario, dia, edad, genero]);

  const estado: Estado = lectura?.estado ?? "en_calma";
  const color = COLOR_ESTADO[estado];
  const aCuantos = destinatarios(estado);
  const alcance = lectura?.alcance.valor ?? 0;
  const diasDePerfil = lectura?.perfil.diasObservados ?? 0;

  return (
    <div className="space-y-6">
      {/* ── LOS CONTROLES ─────────────────────────────────────────────── */}
      <section className="grid gap-px overflow-hidden rounded-xl border border-borde bg-borde md:grid-cols-3">
        <Panel titulo="El chico">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-tenue">Edad</span>
              <select
                value={edad}
                onChange={(e) => setEdad(Number(e.target.value))}
                className="rounded-md border border-borde bg-fondo px-2 py-1 text-tinta"
              >
                {Array.from({ length: 11 }, (_, i) => i + 7).map((n) => (
                  <option key={n} value={n}>{n} años</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-tenue">Género</span>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                className="rounded-md border border-borde bg-fondo px-2 py-1 text-tinta"
              >
                <option value="nena">nena</option>
                <option value="varon">varón</option>
                <option value="otro">otro</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-apagado">
            No son adornos: cambian el peso de las señales y cambian el texto del mensaje.
          </p>
        </Panel>

        <Panel titulo="La historia">
          <div className="space-y-1.5">
            {ESCENARIOS.map((e) => (
              <Opcion
                key={e.id}
                activa={escenario === e.id}
                onClick={() => setEscenario(e.id)}
                titulo={e.nombre}
                pie={e.pie}
              />
            ))}
          </div>
        </Panel>

        <Panel titulo="Lo que ven los adultos">
          <div className="space-y-1.5">
            {ADULTOS.map((a) => (
              <Opcion
                key={a.id}
                activa={adultos === a.id}
                onClick={() => setAdultos(a.id)}
                titulo={a.nombre}
              />
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-apagado">
            Nueve preguntas sobre hechos que ellos ven y la red no puede ver.
          </p>
        </Panel>
      </section>

      {/* ── EL RELOJ ──────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-borde bg-superficie px-5 py-4">
        <button
          onClick={reproducir}
          disabled={corriendo}
          className="rounded-lg bg-acento px-4 py-2 text-sm font-semibold text-fondo transition hover:brightness-110 disabled:opacity-40"
        >
          {corriendo ? "Corriendo…" : "▶ Reproducir tres semanas"}
        </button>
        <input
          type="range"
          min={0}
          max={DIAS - 1}
          value={dia}
          onChange={(e) => {
            setCorriendo(false);
            setDia(Number(e.target.value));
          }}
          className="h-1 min-w-[220px] flex-1 cursor-pointer appearance-none rounded-full bg-borde accent-acento"
          aria-label="Día de la historia"
        />
        <span className="tabular-nums text-sm text-tenue">
          día <strong className="text-tinta">{dia + 1}</strong> de {DIAS}
        </span>
      </section>

      {/* ── LA LECTURA ────────────────────────────────────────────────── */}
      <section
        className={`rounded-xl border ${color.borde} ${color.fondo} transition-colors ${
          cargando ? "opacity-70" : ""
        }`}
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-borde/60 px-5 py-4">
          <h2 className={`text-xl font-semibold tracking-tight ${color.texto}`}>
            {NOMBRE_DE_ESTADO[estado]}
          </h2>
          <p className="text-sm">
            {aCuantos === 0 ? (
              <span className="text-tenue">
                No le escribió <strong className="text-tinta">a nadie</strong>
              </span>
            ) : (
              <span className="text-tenue">
                Le escribió a <strong className={color.texto}>{aCuantos}</strong>: los dos adultos
                responsables y el propio chico
              </span>
            )}
          </p>
        </header>

        <div className="space-y-5 px-5 py-5">
          <Grafico dias={lectura?.dias ?? []} hasta={dia} />

          {/* 🔑 El despliegue, visible: la protección no espera, se despliega. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-tenue">
              Conoce a este chico hace{" "}
              <strong className="tabular-nums text-tinta">{diasDePerfil}</strong>{" "}
              {diasDePerfil === 1 ? "día" : "días"}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-apagado">alcance</span>
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-borde">
                <span
                  className="block h-full rounded-full bg-acento transition-all duration-300"
                  style={{ width: `${Math.round(alcance * 100)}%` }}
                />
              </span>
              <span className="tabular-nums text-tinta">{alcance.toFixed(2)}</span>
            </span>
          </div>

          <Lista titulo="Por qué" items={lectura?.porQue ?? []} />
          <Lista titulo="Lo que no se ve" items={lectura?.loQueNoSeVe ?? []} apagada />
        </div>
      </section>

      {/* ── LO QUE SALDRÍA ────────────────────────────────────────────── */}
      <section className="rounded-xl border border-borde bg-superficie px-5 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-tenue">
            Lo que saldría
          </h2>
          <button
            onClick={pedirMensajes}
            disabled={pidiendoMensajes}
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-tinta transition hover:border-acento disabled:opacity-40"
          >
            {pidiendoMensajes ? "Redactando…" : "Ver el mensaje"}
          </button>
        </div>

        {!mensajes && !pidiendoMensajes && (
          <p className="mt-3 text-sm leading-relaxed text-apagado">
            Los textos los escribe un modelo de lenguaje, pero el modelo no decide nada: decide el
            motor con el registro fechado. Lo generado pasa por un control automático y, si no lo
            aprueba, sale un texto fijo escrito de antemano.
          </p>
        )}

        {mensajes && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Mensaje titulo="A los adultos responsables" cuerpo={mensajes.paraLosAdultos} />
            <Mensaje titulo={`Al propio chico (${edad} años)`} cuerpo={mensajes.paraElChico} />
          </div>
        )}
      </section>

      {/* ── QUE LLEGUE DE VERDAD ──────────────────────────────────────── */}
      <Entrega
        escenario={escenario}
        dia={dia}
        edad={edad}
        genero={genero}
        estado={estado}
      />

      {/* ── 🔴 La nota que blinda, no la que debilita ─────────────────── */}
      <p className="px-1 text-xs leading-relaxed text-apagado">
        <strong className="text-tenue">Datos de ejemplo.</strong> El análisis es el del sistema
        real: el simulador sólo emite señales — quién decide es el motor, con la misma regla de
        persistencia que correría contra un filtro de red conectado.
      </p>
    </div>
  );
}

/* ── LA ENTREGA ──────────────────────────────────────────────────────────
 *
 * 🔑 Todo lo de arriba se puede mirar y dudar. Esto no: el aviso llega al
 * teléfono del que está mirando. Es la diferencia entre una pantalla que dice
 * que el sistema avisa y un sistema que avisa.
 *
 * 🔐 Tres a la vez, y el motivo está en `cupo-demo.ts`: es el modelo del
 * producto —dos adultos y el chico— y es el tope que hace que un QR público no
 * se pueda usar para inundar el bot.
 */

interface Lugar {
  rol: string;
  nombre: string;
  explica: string;
  ocupado: boolean;
  porQuien: string | null;
}

interface Cupo {
  tope: number;
  usados: number;
  lugares: Lugar[];
}

interface EstadoDelQR {
  disponible: boolean;
  motivo?: string;
  enlace?: string;
  qr?: string;
  cupo: Cupo;
}

interface Entrega {
  paraQuien: string;
  nombre: string;
  entregado: boolean;
  detalle: string | null;
}

function Entrega({
  escenario,
  dia,
  edad,
  genero,
  estado,
}: {
  escenario: string;
  dia: number;
  edad: number;
  genero: string;
  estado: Estado;
}) {
  const [qr, setQr] = useState<EstadoDelQR | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [entregas, setEntregas] = useState<Entrega[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const r = await fetch("/api/demo/telegram");
      setQr(await r.json());
    } catch {
      /* Que falle esto no puede voltear el resto de la consola. */
    }
  }, []);

  // Se relee cada 5 segundos: alguien escanea y el cupo tiene que verse cambiar
  // en la pantalla que está proyectada, sin que nadie recargue nada.
  useEffect(() => {
    refrescar();
    const t = setInterval(refrescar, 5000);
    return () => clearInterval(t);
  }, [refrescar]);

  const enviar = useCallback(async () => {
    setEnviando(true);
    setAviso(null);
    setEntregas(null);
    try {
      const r = await fetch("/api/demo/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escenario,
          dia,
          edad,
          genero,
          nombre: genero === "varon" ? "Tomás" : "Ana",
        }),
      });
      const d = await r.json();
      if (d.cupo) setQr((q) => (q ? { ...q, cupo: d.cupo } : q));
      if (d.enviado) {
        setEntregas(d.entregas as Entrega[]);
      } else if (d.motivo === "sin_conectados") {
        setAviso("Todavía no hay ningún Telegram conectado. Escaneá el código primero.");
      } else if (d.motivo === "sin_patron_sostenido") {
        setAviso(
          "Con esta historia el sistema no le escribe a nadie, así que no se manda nada. " +
            "No es un error: sólo se avisa cuando el patrón se sostiene.",
        );
      } else {
        setAviso("No se pudo entregar. El detalle queda abajo, sin disimular.");
        if (d.entregas) setEntregas(d.entregas as Entrega[]);
      }
    } catch {
      setAviso("No se pudo contactar al servidor.");
    } finally {
      setEnviando(false);
    }
  }, [escenario, dia, edad, genero]);

  const cupo = qr?.cupo;
  const hayAlguien = (cupo?.usados ?? 0) > 0;

  return (
    <section className="rounded-xl border border-borde bg-superficie px-5 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-tenue">
          Que te llegue a vos
        </h2>
        {cupo && (
          <span className="text-xs tabular-nums text-apagado">
            {cupo.usados} de {cupo.tope} conectados
          </span>
        )}
      </div>

      {qr && !qr.disponible && (
        <p className="mt-3 text-sm leading-relaxed text-atencion">
          El bot no está configurado: {qr.motivo}.
        </p>
      )}

      {qr?.disponible && (
        <div className="mt-4 grid gap-6 md:grid-cols-[auto,1fr]">
          <div className="flex flex-col items-center gap-2">
            <div
              // Tarjeta blanca a propósito: ver el comentario del color en la ruta.
              className="h-40 w-40 overflow-hidden rounded-lg bg-white [&>svg]:h-full [&>svg]:w-full"
              // El QR lo dibuja el servidor con la librería, no es HTML de nadie.
              dangerouslySetInnerHTML={{ __html: qr.qr ?? "" }}
            />
            <a
              href={qr.enlace}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-acento underline-offset-2 hover:underline"
            >
              o abrir en Telegram
            </a>
          </div>

          <div>
            <p className="text-sm leading-relaxed text-tenue">
              Escaneá el código, apretá <strong className="text-tinta">Iniciar</strong>, y el aviso
              te llega a tu propio Telegram. Se conectan hasta{" "}
              <strong className="text-tinta">{cupo?.tope}</strong> personas a la vez — que son las
              del modelo: dos adultos responsables y el propio chico.
            </p>

            {/* 🔴 Este aviso salió de probarlo con un teléfono de verdad el 16/8.
                Escanear con la cámara abre `t.me` en el NAVEGADOR, no en la app, y
                ahí Telegram no sabe quién sos: pide número de teléfono y código de
                verificación. Le pasó a Edgardo, que ya tenía cuenta y había
                construido el bot. A alguien que llega de afuera le pasa peor —
                y un pedido de teléfono, en un sistema que promete cuidar chicos,
                es la peor primera impresión posible. Decirlo antes cuesta dos
                líneas; no decirlo cuesta la visita. */}
            <p className="mt-2 text-xs leading-relaxed text-apagado">
              Hace falta tener Telegram en el teléfono con el que escaneás. Si la cámara te lo abre
              en el navegador y te pide el número, cerralo y abrí el enlace de acá abajo desde la
              app: es el mismo código, sin ningún registro de por medio.
            </p>

            <ul className="mt-3 space-y-1.5">
              {cupo?.lugares.map((l) => (
                <li
                  key={l.rol}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-borde px-3 py-2"
                >
                  <span className="text-sm">
                    <strong className={l.ocupado ? "text-tinta" : "text-tenue"}>{l.nombre}</strong>
                    <span className="ml-2 text-xs text-apagado">{l.explica}</span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase tracking-wider ${
                      l.ocupado ? "text-calma" : "text-apagado"
                    }`}
                  >
                    {l.ocupado ? (l.porQuien ?? "conectado") : "libre"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={enviar}
                disabled={enviando || !hayAlguien}
                className="rounded-lg bg-acento px-4 py-2 text-sm font-semibold text-fondo transition hover:brightness-110 disabled:opacity-40"
              >
                {enviando ? "Enviando…" : "Mandar el aviso a los conectados"}
              </button>
              {estado !== "patron_sostenido" && (
                <span className="text-xs leading-relaxed text-apagado">
                  Con esta historia el sistema no habla, así que no va a salir nada.
                </span>
              )}
            </div>

            {aviso && <p className="mt-3 text-sm leading-relaxed text-atencion">{aviso}</p>}

            {entregas && (
              <ul className="mt-3 space-y-1">
                {entregas.map((e, i) => (
                  <li key={i} className="text-sm text-tenue">
                    <span className={e.entregado ? "text-calma" : "text-riesgo"}>
                      {e.entregado ? "entregado" : "no salió"}
                    </span>{" "}
                    · {e.paraQuien}
                    {e.detalle && <span className="text-apagado"> — {e.detalle}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-apagado">
        🔐 El cupo no es una limitación de la demostración: es lo que impide que un código
        público sirva para conectar miles de chats al bot. Para soltar tu lugar antes de tiempo,
        escribile <strong className="text-tenue">/chau</strong> al bot; si no, se libera solo a la
        media hora.
      </p>
    </section>
  );
}

/* ── Piezas ──────────────────────────────────────────────────────────── */

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-superficie px-5 py-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-tenue">{titulo}</h3>
      {children}
    </div>
  );
}

function Opcion({
  activa,
  onClick,
  titulo,
  pie,
}: {
  activa: boolean;
  onClick: () => void;
  titulo: string;
  pie?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activa}
      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
        activa
          ? "border-acento bg-acentoSuave text-tinta"
          : "border-transparent text-tenue hover:border-borde hover:text-tinta"
      }`}
    >
      <span className="block text-sm font-medium">{titulo}</span>
      {pie && <span className="mt-0.5 block text-xs leading-snug text-apagado">{pie}</span>}
    </button>
  );
}

/** Una barra por día. La altura es cuánto se apartó de lo habitual para ese chico. */
function Grafico({ dias, hasta }: { dias: { dia: string; carga: number }[]; hasta: number }) {
  return (
    <div>
      <div className="flex h-24 items-end gap-1" role="img" aria-label="Carga diaria de las últimas tres semanas">
        {Array.from({ length: DIAS }, (_, i) => {
          const d = dias[i];
          const visible = i <= hasta;
          const carga = visible && d ? d.carga : 0;
          const alto = Math.max(2, carga * 100);
          const tono =
            carga >= 0.45 ? "bg-riesgo" : carga >= 0.25 ? "bg-atencion" : "bg-borde";
          return (
            <span
              key={i}
              className={`flex-1 rounded-sm transition-all duration-300 ${
                visible ? tono : "bg-borde/30"
              }`}
              style={{ height: `${alto}%` }}
              title={`Día ${i + 1}`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-apagado">
        <span>día 1</span>
        <span>día 7</span>
        <span>día 14</span>
        <span>día 21</span>
      </div>
    </div>
  );
}

function Lista({
  titulo,
  items,
  apagada,
}: {
  titulo: string;
  items: string[];
  apagada?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-tenue">{titulo}</h3>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li
            key={i}
            className={`flex gap-2 text-sm leading-relaxed ${apagada ? "text-apagado" : "text-tinta"}`}
          >
            <span aria-hidden className="select-none text-borde">·</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mensaje({ titulo, cuerpo }: { titulo: string; cuerpo?: Redactado }) {
  return (
    <div className="rounded-lg border border-borde bg-fondo px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-tenue">{titulo}</h3>
        {cuerpo?.origen && (
          <span className="shrink-0 text-[11px] text-apagado">
            {cuerpo.origen === "ia" ? "redactado por el modelo" : "texto de respaldo"}
          </span>
        )}
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-tinta">
        {cuerpo?.texto ?? "—"}
      </p>
      {/* 🔑 Mostrar lo que el control frenó vale más que mostrar lo que dejó pasar. */}
      {cuerpo?.rechazado && (
        <p className="mt-3 border-t border-borde pt-2 text-xs leading-relaxed text-apagado">
          <strong className="text-atencion">El control frenó esto:</strong> {cuerpo.rechazado}
        </p>
      )}
    </div>
  );
}
