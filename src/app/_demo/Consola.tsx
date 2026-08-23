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
import { EyeOff } from "lucide-react";
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

const GENEROS = [
  { id: "nena", label: "nena" },
  { id: "varon", label: "varón" },
  { id: "otro", label: "otro" },
] as const;

/** 🔴 Sólo se avisa con patrón sostenido: dos adultos y el chico. Si no, nadie. */
function destinatarios(estado: Estado): number {
  return estado === "patron_sostenido" ? 3 : 0;
}

const COLOR_ESTADO: Record<Estado, { texto: string; fondo: string; borde: string; punto: string }> = {
  en_calma: { texto: "text-calma", fondo: "bg-calma/10", borde: "border-calma/30", punto: "bg-calma" },
  atencion: { texto: "text-atencion", fondo: "bg-atencionSuave", borde: "border-atencion/40", punto: "bg-atencion" },
  patron_sostenido: { texto: "text-riesgo", fondo: "bg-riesgoSuave", borde: "border-riesgo/40", punto: "bg-riesgo" },
};

/** Una línea corta por estado, al lado del nombre. No inventa nada nuevo:
 *  es la misma idea de `NOMBRE_DE_ESTADO`, un paso más despacio. */
const DESCRIPCION_ESTADO: Record<Estado, string> = {
  en_calma: "Nada que se sostenga en el tiempo. El sistema mira y calla.",
  atencion: "Un cambio que todavía puede ser cualquier cosa. Se cuenta, no se alarma.",
  patron_sostenido: "El patrón se repite en días distintos y conviene mirarlo.",
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
  /**
   * 🔴 **Existe porque no existir escondió una función rota cuatro días.**
   * El `catch` de acá abajo dejaba `{}` y la pantalla dibujaba los dos mensajes
   * en «—», iguales en los cuatro escenarios. La ruta devolvía 404 desde el
   * 17/8 y no había forma de saberlo mirando. Si no sale, ahora se dice.
   */
  fallo?: string;
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

  /**
   * 🔴 **Va por `POST` a `/api/demo/mensajes`, y las dos cosas importan.**
   * Antes era un `GET` a `/api/mensajes`, una ruta que la auditoría del 17/8
   * borró creyendo que no la llamaba nadie — la llamaba esto. El `POST` es lo
   * que impide que una etiqueta `img` dispare una llamada al modelo, que era
   * el agujero real por el que se la había sacado.
   */
  const pedirMensajes = useCallback(async () => {
    setPidiendoMensajes(true);
    try {
      const r = await fetch("/api/demo/mensajes", {
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

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMensajes({
          fallo:
            r.status === 429
              ? `Se pidieron muchos seguidos. Probá de nuevo en ${Math.ceil((d.esperaSeg ?? 60) / 1)} segundos.`
              : `No se pudo pedir el texto (${r.status}).`,
        });
        return;
      }

      setMensajes(await r.json());
    } catch {
      setMensajes({ fallo: "No se pudo conectar para pedir el texto." });
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
      {/*
       * ── DOS COLUMNAS ──────────────────────────────────────────────────
       * 🔑 Izquierda angosta = lo que uno elige. Derecha ancha = lo que el
       * motor devuelve. En una sola columna esos dos roles se mezclaban en
       * una fila de controles arriba, después el reloj aparte, después la
       * lectura — tres bloques para una sola idea. El reloj ahora vive
       * DENTRO de la tarjeta de lectura, arriba de su propio gráfico, que es
       * lo que controla: no tiene sentido en otro lado.
       */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* ── LOS CONTROLES ────────────────────────────────────────────── */}
        <section id="tour-controles" className="space-y-4">
          <PanelControl titulo="El chico">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-tenue">Edad</span>
              <span className="text-sm font-semibold text-acento">{edad} años</span>
            </div>
            <input
              type="range"
              min={7}
              max={17}
              step={1}
              value={edad}
              onChange={(e) => setEdad(Number(e.target.value))}
              className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-borde accent-acento"
              aria-label="Edad"
            />
            <div className="mt-3 flex gap-2">
              {GENEROS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenero(g.id)}
                  aria-pressed={genero === g.id}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                    genero === g.id
                      ? "border-acento bg-acentoSuave text-tinta"
                      : "border-borde text-tenue hover:border-tenue/60 hover:text-tinta"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-apagado">
              No son adornos: cambian el peso de las señales y el texto del mensaje.
            </p>
          </PanelControl>

          <PanelControl titulo="La historia">
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
          </PanelControl>

          <PanelControl titulo="Lo que ven los adultos">
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
          </PanelControl>
        </section>

        {/* ── LA LECTURA: nivel + confianza arriba, reloj y gráfico abajo ── */}
        <div className="space-y-5">
          <section
            id="tour-lectura"
            className={`rounded-xl border ${color.borde} bg-superficie transition-colors ${
              cargando ? "opacity-70" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-6 px-5 pt-5">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-apagado">Lectura del motor</p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.punto} shadow-[0_0_0_5px_rgba(255,255,255,0.06)]`}
                    aria-hidden
                  />
                  <h2 className="text-2xl font-semibold tracking-tight text-tinta">
                    {NOMBRE_DE_ESTADO[estado]}
                  </h2>
                </div>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-tenue">
                  {DESCRIPCION_ESTADO[estado]}
                </p>
                <p className="mt-2 text-xs text-apagado">
                  {aCuantos === 0 ? (
                    <>No le escribió a nadie</>
                  ) : (
                    <>
                      Le escribió a <strong className={color.texto}>{aCuantos}</strong>: los dos
                      adultos responsables y el propio chico
                    </>
                  )}
                </p>
              </div>

              {/* 🔑 «Alcance» es el dato real del motor — cuánto se desplegó
                  la lectura de ese chico, de 0 a 1. Es el mismo número que
                  el mockup llamaba «confianza del cálculo»: no es otra
                  medida inventada, es el `alcance` con otro nombre visual. */}
              <div className="min-w-[150px] text-right">
                <p className="text-xs text-apagado">Alcance de la lectura</p>
                <p className="mt-1.5 text-2xl font-semibold text-acento tabular-nums">
                  {Math.round(alcance * 100)}%
                </p>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-borde">
                  <span
                    className="block h-full rounded-full bg-acento transition-all duration-300"
                    style={{ width: `${Math.round(alcance * 100)}%` }}
                  />
                </span>
                <p className="mt-1.5 text-[11px] text-apagado">
                  {diasDePerfil} {diasDePerfil === 1 ? "día" : "días"} conociéndolo
                </p>
              </div>
            </div>

            <div className="mt-5 px-5 pb-5">
              {/* ── EL RELOJ, arriba del gráfico que controla ── */}
              <div
                id="tour-reloj"
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={reproducir}
                    disabled={corriendo}
                    className="rounded-lg border border-acento px-3.5 py-1.5 text-[13px] font-medium text-acento transition hover:bg-acentoSuave disabled:opacity-40"
                  >
                    {corriendo ? "Corriendo…" : "▶ Reproducir tres semanas"}
                  </button>
                  <span className="text-xs text-apagado">
                    día <strong className="tabular-nums text-tinta">{dia + 1}</strong> de {DIAS}
                  </span>
                </div>
                <span className="text-xs text-apagado">riesgo por día</span>
              </div>

              <div className="mt-2.5">
                <Grafico
                  dias={lectura?.dias ?? []}
                  hasta={dia}
                  onElegirDia={(i) => {
                    setCorriendo(false);
                    setDia(i);
                  }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={DIAS - 1}
                value={dia}
                onChange={(e) => {
                  setCorriendo(false);
                  setDia(Number(e.target.value));
                }}
                className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-borde accent-acento"
                aria-label="Día de la historia"
              />

              {lectura && lectura.loQueNoSeVe.length > 0 && (
                <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-apagado">
                  <EyeOff size={13} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{lectura.loQueNoSeVe.join(" ")}</span>
                </p>
              )}
            </div>
          </section>

          {/* ── SEÑALES ACUMULADAS + EL MENSAJE, lado a lado ────────────── */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-xl border border-borde bg-superficie px-5 py-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-apagado">
                Señales acumuladas
              </h2>
              {lectura && lectura.porQue.length > 0 ? (
                <ul className="mt-3.5 space-y-3">
                  {lectura.porQue.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color.punto}`}
                      />
                      <span className="text-tinta">{t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3.5 text-sm leading-relaxed text-apagado">
                  Nada que reportar todavía. La enorme mayoría de las semanas se ven así.
                </p>
              )}
            </section>

            <section id="tour-mensajes" className="flex flex-col rounded-xl border border-borde bg-superficie px-5 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-apagado">
                  El mensaje que te llegaría
                </h2>
                <button
                  onClick={pedirMensajes}
                  disabled={pidiendoMensajes}
                  className="shrink-0 rounded-lg border border-borde px-3 py-1.5 text-xs text-tinta transition hover:border-acento disabled:opacity-40"
                >
                  {pidiendoMensajes ? "Redactando…" : "Ver el mensaje"}
                </button>
              </div>

              {/* 🔴 El diseño mostraba el mensaje siempre puesto, calculado
                  gratis en el navegador. Acá NO: cada mensaje real son dos
                  llamadas al modelo (adultos + chico), y mostrarlo solo con
                  un botón es la regla documentada arriba del archivo — sale
                  a demanda porque redactarlo en cada movimiento del reloj
                  sería lento y caro. */}
              {!mensajes && !pidiendoMensajes && (
                <div className="mt-3.5 flex-1 rounded-lg border border-dashed border-borde px-4 py-3.5 text-sm leading-relaxed text-apagado">
                  Quién decide es el sistema, mirando qué pasó y en qué días. La inteligencia
                  artificial sólo lo pone en palabras, y se revisa antes de salir.
                </div>
              )}

              {mensajes?.fallo && (
                <p className="mt-3.5 rounded-md border border-atencion/40 bg-atencionSuave px-3.5 py-3 text-sm leading-relaxed text-atencion">
                  {mensajes.fallo}
                </p>
              )}

              {mensajes && !mensajes.fallo && (
                <div className="mt-3.5 space-y-3">
                  <Mensaje
                    titulo="A los adultos responsables"
                    cuerpo={mensajes.paraLosAdultos}
                    acento="border-t-acento"
                  />
                  <Mensaje
                    titulo={`Al propio chico (${edad} años)`}
                    cuerpo={mensajes.paraElChico}
                    acento="border-t-acentoDos"
                  />
                </div>
              )}

              <div className="mt-3.5 flex items-center gap-2 text-[11px] text-apagado">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color.punto}`} aria-hidden />
                Decide el motor. La IA sólo lo pone en palabras, y se revisa antes de salir.
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── QUE LLEGUE DE VERDAD ────────────────────────────────────────── */}
      <Entrega escenario={escenario} dia={dia} edad={edad} genero={genero} estado={estado} />

      {/* ── 🔴 La nota que blinda, no la que debilita ───────────────────── */}
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
      } else if (d.motivo === "demasiado_seguido") {
        /* Se dice el número y se dice por qué. Cada aviso son dos llamadas al
           modelo y tres mensajes a teléfonos de verdad: que el freno exista es
           parte de lo que se está mostrando, no una falla que haya que tapar. */
        setAviso(
          `Vas muy seguido: cada aviso escribe con el modelo y sale a tres teléfonos de ` +
            `verdad. Probá de nuevo en ${d.esperaSeg} segundos.`,
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

/** Cada control es su propia tarjeta — antes las tres compartían una fila
 *  con bordes divisorios, que dejaba de tener sentido apiladas en columna. */
function PanelControl({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-borde bg-superficie px-4 py-4">
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

/**
 * Una barra por día. La altura es cuánto se apartó de lo habitual para ese
 * chico. 🔑 Cada barra YA VISTA es un botón: tocarla lleva el reloj a ese
 * día, para poder ir directo al que llamó la atención sin arrastrar el
 * control de más arriba paso a paso.
 */
function Grafico({
  dias,
  hasta,
  onElegirDia,
}: {
  dias: { dia: string; carga: number }[];
  hasta: number;
  onElegirDia: (dia: number) => void;
}) {
  /* 🔴 Altura en PÍXELES, calculada acá, y no un `height: X%` en el span
   *  anidado dentro del botón: eso dependía de que cada nivel de flex
   *  (contenedor → botón → span) tuviera una altura "definida" para que el
   *  porcentaje del hijo pudiera resolverse, y en un caso así de anidado no
   *  se sostuvo — las barras quedaban aplastadas. Con píxeles calculados acá
   *  mismo no hay nada que resolver: el navegador no tiene que adivinar. */
  const ALTO_CONTENEDOR_PX = 96; // el mismo número que h-24

  return (
    <div>
      <div className="flex h-24 items-end gap-1" role="group" aria-label="Carga diaria de las últimas tres semanas">
        {Array.from({ length: DIAS }, (_, i) => {
          const d = dias[i];
          const visible = i <= hasta;
          const carga = visible && d ? d.carga : 0;
          const altoPct = Math.max(2, carga * 100);
          const esHoy = i === hasta;
          const tono =
            carga >= 0.45 ? "bg-riesgo" : carga >= 0.25 ? "bg-atencion" : "bg-borde";
          return (
            <button
              key={i}
              type="button"
              disabled={!visible}
              onClick={() => onElegirDia(i)}
              aria-pressed={esHoy}
              aria-label={`Día ${i + 1}${visible ? `, carga ${Math.round(carga * 100)}%` : ", todavía no llegó"}`}
              title={`Día ${i + 1}`}
              style={{ height: `${(altoPct / 100) * ALTO_CONTENEDOR_PX}px` }}
              className={`flex-1 rounded-sm transition-all duration-300 ${
                visible ? `${tono} hover:brightness-125 cursor-pointer` : "bg-borde/30 cursor-default"
              } ${esHoy ? "ring-2 ring-tinta/70 ring-offset-1 ring-offset-superficie" : ""}`}
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

function Mensaje({
  titulo,
  cuerpo,
  acento,
}: {
  titulo: string;
  cuerpo?: Redactado;
  /** Franja de color arriba de la tarjeta, para distinguir de un vistazo a
   *  quién le habla cada mensaje — violeta a los adultos, cian al chico. */
  acento: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = useCallback(async () => {
    if (!cuerpo?.texto) return;
    try {
      await navigator.clipboard.writeText(cuerpo.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* Sin permiso de portapapeles o navegador viejo: no rompe nada más. */
    }
  }, [cuerpo?.texto]);

  return (
    <div className={`rounded-lg border border-t-2 border-borde bg-fondo px-4 py-3 ${acento}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-tenue">{titulo}</h3>
        <div className="flex shrink-0 items-center gap-3">
          {cuerpo?.origen && (
            <span className="text-[11px] text-apagado">
              {cuerpo.origen === "ia" ? "redactado por el modelo" : "texto de respaldo"}
            </span>
          )}
          {cuerpo?.texto && (
            <button
              type="button"
              onClick={copiar}
              className="text-[11px] text-apagado underline-offset-2 transition hover:text-tinta hover:underline"
            >
              {copiado ? "copiado" : "copiar"}
            </button>
          )}
        </div>
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
