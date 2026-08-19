"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowRight,
  BellRing,
  LoaderCircle,
  LogOut,
  Eye,
  QrCode,
  Send,
  ShieldOff,
  Trash2,
  UserMinus,
  MessageCircle,
  Download,
  Copy,
  Check,
  TriangleAlert,
  Smartphone,
} from "lucide-react";
import { NOMBRE_DE_SENAL, type SenalDeRed, type TipoDeSenal } from "@/lib/senales/tipos";
import { NOMBRE_DE_ESTADO, type Estado, type Lectura } from "@/lib/motor/evaluar";
import { MOTIVOS_DE_BAJA, type MotivoDeBaja } from "@/lib/datos/tipos";
import { COMO_FUNCIONA } from "@/lib/config";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PANEL DE LA FAMILIA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Lo pidió Edgardo el 16/8: *"un panel donde los padres reciben las
 *  notificaciones, los informes, está el asistente, tienen el código QR para
 *  incluir a los referentes, incluso darlos de baja"*.
 *
 *  🔴 **Entran los progenitores, con UNA clave de la casa** (rediseñado el 17/8;
 *  antes era una cuenta por adulto). El chico y el referente no entran: escanean
 *  y reciben por su canal. Entre padres no hay nada separado — ni el informe ni
 *  la charla con el asistente.
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
  /** 🔑 Quién entra al panel. El referente recibe avisos, pero no entra. */
  rol: "progenitor" | "referente";
  elegidoPorElChico: boolean;
  canal: string;
  activo?: boolean;
}

interface Sugerencia {
  que: string;
  porQue: string;
}

interface Respuesta {
  /* 🔴 Sin `adultoId`: desde el 17/8 la clave es del HOGAR, así que la pantalla
     NO sabe cuál de los dos padres la está mirando — y no puede inventarlo. */
  yo: { nombre: string | null; hogar: string | null };
  familia: { nombre: string; impedimentos: string[]; sugerencias: Sugerencia[] };
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
  /* 🔴 La firma del cuestionario, y se muestra partida a propósito (18/8):
     `hogar` lo comprobó el sistema, `nombre` lo declaró quien contestó. */
  cuestionario: {
    firmas: {
      adultoId: string;
      nombre: string | null;
      hogar: string | null;
      fecha: string;
      respondidas: number;
    }[];
    deUnTotalDe: number;
  };
  /* 🔴 Quién vio el aviso, que NO es lo mismo que a quién se le entregó.
     `entregado` significa que Telegram lo aceptó; esto, que alguien lo abrió. */
  acuse: {
    avisos: {
      destino: string;
      nombre: string | null;
      esResponsable: boolean;
      fecha: string;
      entregado: boolean;
      acusadoEn: string | null;
    }[];
    ultimaTanda: {
      destino: string;
      nombre: string | null;
      esResponsable: boolean;
      fecha: string;
      entregado: boolean;
      acusadoEn: string | null;
    }[];
    loVioUnResponsable: boolean;
    hayAvisosQueNoSalieron: boolean;
  };
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

/**
 * La fecha como la diría una persona.
 *
 * 🔴 **Existe porque `diaLocal` devuelve `YYYY-MM-DD`, y eso es una clave, no
 * un texto.** La firma del cuestionario salió «2026-08-19» en la primera prueba
 * del 19/8 — el MISMO error que ya se había corregido el 15/8 en la advertencia
 * del perfil, repetido en otro lugar. Un panel para padres no habla en ISO.
 *
 * 🔑 Y «hoy» / «ayer» no son un adorno: quien acaba de contestar tiene que
 * reconocer su propia firma sin hacer la cuenta.
 */
function fechaEnCriollo(iso: string): string {
  const cuando = new Date(iso);
  const dia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const hoy = new Date();
  if (dia(cuando) === dia(hoy)) return "hoy";

  const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
  if (dia(cuando) === dia(ayer)) return "ayer";

  return `el ${cuando.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`;
}

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

      {/* ── Lo que de verdad impide trabajar ────────────────────────────── */}
      {datos.familia.impedimentos.length > 0 && (
        <section className="mt-6 rounded-lg border border-atencion/40 bg-atencionSuave px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-atencion">
            Falta algo
          </h2>
          <ul className="mt-2.5 flex flex-col gap-1">
            {datos.familia.impedimentos.map((f) => (
              <li key={f} className="text-sm text-atencion">
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Lo que conviene, que NO es lo mismo ──────────────────────────
          🔴 Hasta el 17/8 esto y lo de arriba eran la misma lista, en el mismo
          cartel naranja de alerta. A un hogar con un solo progenitor le decía
          «hacen falta al menos 2 adultos responsables», que es falso: esa
          familia no está incompleta. Ahora se ve distinto porque ES distinto —
          gris, no naranja— y cada consejo viene con su porqué. Un consejo sin
          motivo se lee como una exigencia disfrazada. */}
      {datos.familia.sugerencias.length > 0 && (
        <section className="mt-6 rounded-lg border border-borde bg-superficie px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-apagado">
            Esto lo haría más completo
          </h2>
          <ul className="mt-2.5 flex flex-col gap-3">
            {datos.familia.sugerencias.map((s) => (
              <li key={s.que}>
                <p className="text-sm text-tinta">{s.que}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-tenue">{s.porQue}</p>
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

      {/* ── Quién vio el aviso ─────────────────────────────────────────── */}
      <ElAcuse acuse={datos.acuse} />

      {/* ── Lo que ven los adultos ─────────────────────────────────────── */}
      <ElCuestionario
        chico={datos.chico?.nombre}
        firmas={datos.cuestionario.firmas}
        deUnTotalDe={datos.cuestionario.deUnTotalDe}
      />

      {/* ── El asistente ───────────────────────────────────────────────── */}
      <Asistente chico={datos.chico?.nombre} />

      {/* ── La instalación ─────────────────────────────────────────────── */}
      <Instalacion chico={datos.chico?.nombre} />

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
 * Dibuja el texto del asistente con el poco markdown que usa: negrita y listas.
 *
 * 🔐 **Se arman elementos de React, nunca HTML.** El texto viene de un modelo, y
 * pasarlo por `dangerouslySetInnerHTML` sería dejar que lo que escriba el
 * modelo se ejecute en la pantalla del padre. Acá lo peor que puede pasar es
 * que se vea un asterisco de más.
 *
 * 📌 Se hace a mano y sin librería porque el markdown que aparece en la
 * práctica son tres cosas. Traer un intérprete entero para eso sería sumar
 * dependencia y superficie por nada.
 */
function conNegritas(linea: string, clave: string) {
  return linea.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={`${clave}-${i}`} className="font-semibold text-tinta">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${clave}-${i}`}>{parte.replace(/\*/g, "")}</span>
    ),
  );
}

function TextoDelAsistente({ texto }: { texto: string }) {
  const lineas = texto.split("\n");

  return (
    <div className="flex flex-col gap-2.5">
      {lineas.map((linea, i) => {
        const limpia = linea.trim();
        if (!limpia) return null;

        /* 🔑 La cita no es adorno de markdown: cuando el asistente escribe con
           `>` es porque le está dando al padre la frase para decirle al chico,
           y eso es lo más útil que contesta. Sin dibujarla se veía el signo
           colgando adelante de la única línea que el padre va a copiar. */
        if (/^>\s?/.test(limpia)) {
          return (
            <p
              key={i}
              className="border-l-2 border-acento pl-3 text-sm leading-relaxed text-tinta"
            >
              {conNegritas(limpia.replace(/^>\s?/, ""), `c${i}`)}
            </p>
          );
        }

        const vinieta = /^[-•]\s+/.test(limpia);
        const numerada = /^\d+\.\s+/.test(limpia);
        const cuerpo = limpia.replace(/^[-•]\s+/, "").replace(/^(\d+)\.\s+/, "");

        if (vinieta || numerada) {
          return (
            <p key={i} className="flex gap-2 pl-1 text-sm leading-relaxed text-tinta">
              <span className="shrink-0 text-acento">
                {numerada ? `${limpia.match(/^(\d+)\./)![1]}.` : "·"}
              </span>
              <span>{conNegritas(cuerpo, `l${i}`)}</span>
            </p>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-tinta">
            {conNegritas(limpia, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * La espera.
 *
 * 🔴 **El asistente no transmite mientras escribe, y es a propósito:** el
 * control tiene que ver el texto entero antes de que salga. El costo de esa
 * decisión lo paga el padre mirando una pantalla quieta unos quince segundos,
 * y ese rato hay que llenarlo con algo verdadero.
 *
 * 🔑 Así que lo que se muestra mientras espera es exactamente el motivo por el
 * que espera. No es una excusa: es la única parte del producto donde la
 * garantía se explica justo cuando se está cumpliendo.
 *
 * ⚠ Los segundos se cuentan de verdad. Una barra de progreso acá sería una
 * mentira chiquita —nadie sabe cuánto falta— y este es el peor sistema donde
 * acostumbrar a nadie a creerle a un número inventado.
 */
function Esperando() {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const reloj = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(reloj);
  }, []);

  return (
    <li className="rounded-md border border-borde bg-fondo px-3.5 py-3">
      <div className="flex items-center gap-2">
        <LoaderCircle size={12} className="animate-spin text-acento" />
        <span className="text-xs text-tenue">Escribiendo la respuesta entera</span>
        <span className="ml-auto font-mono text-[10px] text-apagado">{segundos}s</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-apagado">
        Tarda porque la escribe completa antes de mostrártela: el control la revisa entera
        antes de que salga. Si te fuera apareciendo palabra por palabra, cuando una frase no
        debiera haberse dicho ya la habrías leído.
      </p>
    </li>
  );
}

interface TurnoEnPantalla {
  quien: "adulto" | "asistente";
  texto: string;
  origen?: string | null;
  /** Si salió el respaldo: lo frenó el control, o falló el pedido. */
  causa?: string | null;
  fecha?: string;
}

/**
 * El asistente — el que contesta «¿y ahora qué hago?».
 *
 * 🔑 Vive acá adentro y no en una pantalla aparte: el padre lo consulta con el
 * informe a la vista, que es cuando le sirve. Sacarlo a otra dirección sería
 * pedirle que se acuerde de que existe justo cuando está preocupado.
 *
 * 🔴 **La charla se guarda y se retoma.** Un padre pregunta a las dos de la
 * mañana, cierra el navegador y vuelve al otro día: si se perdió, vuelve a
 * empezar de cero la conversación más difícil que va a tener. Es de él —el otro
 * adulto no la ve— y la borra cuando quiere.
 */
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE VEN LOS ADULTOS — la puerta al cuestionario y quién lo contestó
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Existe porque hasta el 19/8 el panel avisaba que faltaba y no había
 *  adónde ir.** El informe decía «nadie contestó el cuestionario todavía» —lo
 *  sigue diciendo, en «Lo que no se ve desde acá»— y ese cartel era un callejón
 *  sin salida. Un sistema que señala un hueco tiene que ofrecer la manera de
 *  taparlo, o el cartel entrena a ignorar los carteles.
 *
 *  🔴 **La firma se muestra, y decidido así por Edgardo el 18/8.** Se muestra
 *  PARTIDA, que es lo que la hace honesta: *«desde tu casa»* es un hecho que el
 *  sistema comprobó al abrir la sesión; *«dice ser Mariana»* es una declaración
 *  que no puede comprobar. Mostrarlas juntas y con el mismo tono convertiría
 *  una declaración en un hecho.
 *
 *  📌 **Sin puntaje, ni acá ni en ningún lado.** Lo que se dice es cuántas
 *  preguntas contestó cada uno y cuándo. Qué significa todo eso junto lo dice
 *  el informe, y lo dice en señales, nunca en un número sobre un chico.
 */
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUIÉN VIO EL AVISO — el acuse de recibo, 19/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **Lo pidió Edgardo el 16/8** y lo cerró el 19: *"supongamos que al padre le
 *  robaron el celular, o que muy atareado lo dejó pasar"*.
 *
 *  🔴 **El agujero que muestra:** hasta hoy el sistema decía «entregado», y eso
 *  significaba nada más que Telegram aceptó el mensaje. Teléfono robado,
 *  apagado o notificación deslizada sin leer se veían igual que leído. Esta
 *  sección es el primer lugar del producto donde se puede ver la diferencia.
 *
 *  🔑 **La regla que ordena el bloque, y la definió él:** *"el acuse es de uno
 *  de los responsables"*. No se cuentan acuses — se mira si acusó alguien con
 *  la responsabilidad. Por eso el estado de arriba no dice «2 de 3 vieron el
 *  aviso»: dice si lo vio un responsable o no.
 *
 *  ⚠ **Y separa lo que no hay que confundir:** a quien le falta apretar
 *  «Iniciar» el mensaje **nunca le salió**. Eso no es desatención, es una
 *  configuración a medias, y la respuesta correcta no es insistirle: es
 *  decirle que le falta un clic.
 */
function ElAcuse({
  acuse,
}: {
  acuse: {
    avisos: {
      destino: string;
      nombre: string | null;
      esResponsable: boolean;
      fecha: string;
      entregado: boolean;
      acusadoEn: string | null;
    }[];
    ultimaTanda: {
      destino: string;
      nombre: string | null;
      esResponsable: boolean;
      fecha: string;
      entregado: boolean;
      acusadoEn: string | null;
    }[];
    loVioUnResponsable: boolean;
    hayAvisosQueNoSalieron: boolean;
  };
}) {
  /* 📌 Sin avisos no se dibuja nada. Un bloque vacío que dice «nadie vio el
     aviso» cuando no hubo ningún aviso es un cartel que miente en calma. */
  if (acuse.avisos.length === 0) return null;

  const nadieResponsable = !acuse.loVioUnResponsable;
  const anteriores = acuse.avisos.length - acuse.ultimaTanda.length;

  return (
    <section
      className={`mt-8 rounded-lg border px-5 py-5 ${
        nadieResponsable ? "border-atencion/40 bg-atencionSuave" : "border-borde bg-superficie"
      }`}
    >
      <h2
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${
          nadieResponsable ? "text-atencion" : "text-acento"
        }`}
      >
        <BellRing size={13} /> Quién vio el aviso
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-tinta">
        {acuse.loVioUnResponsable
          ? "Del último aviso, al menos uno de los responsables confirmó que lo vio."
          : "Del último aviso, todavía no lo confirmó ninguno de los responsables."}
      </p>

      {/* 🔴 Sólo la ÚLTIMA tanda, y no el historial. Mezclarlos fue el error del
          19/8: con todo junto, un acuse de hace dos días se leía como que el
          aviso de hoy estaba visto. */}
      <ul className="mt-4 flex flex-col gap-2">
        {acuse.ultimaTanda.map((a) => (
          <li
            key={a.destino + a.fecha}
            className="flex items-start justify-between gap-3 rounded-md border border-borde bg-fondo px-4 py-3"
          >
            <div>
              <p className="text-sm text-tinta">
                {a.nombre ?? "Un contacto que ya no está en la familia"}
                {!a.esResponsable && (
                  <span className="text-apagado"> · recibe avisos, no es responsable</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-apagado">Se le mandó {fechaEnCriollo(a.fecha)}</p>
            </div>

            {/* 🔴 Tres estados y no dos, y el del medio es el que faltaba: que
                el mensaje haya salido no dice que alguien lo haya visto. */}
            {!a.entregado ? (
              /* ⚠ Esto NO es «no tiene canal conectado» — a ése `avisar()` ni
                 le registra fila. Es que el transporte lo rechazó: chat que no
                 existe, cuenta borrada, correo que rebotó. */
              <span className="shrink-0 text-xs text-apagado">No se pudo entregar</span>
            ) : a.acusadoEn ? (
              <span className="flex shrink-0 items-center gap-1 text-xs text-calma">
                <Check size={12} /> Lo vio
              </span>
            ) : (
              <span className="shrink-0 text-xs text-tenue">Sin confirmar</span>
            )}
          </li>
        ))}
      </ul>

      {acuse.hayAvisosQueNoSalieron && (
        <p className="mt-3 text-xs leading-relaxed text-tenue">
          Donde dice «no se pudo entregar», el mensaje salió y el canal lo rechazó. Eso no se
          arregla esperando: hay que revisar ese contacto más abajo.
        </p>
      )}

      {anteriores > 0 && (
        <p className="mt-3 text-xs text-tenue">
          Antes de éste hubo {anteriores} {anteriores === 1 ? "aviso" : "avisos"} en estos días.
          Lo que se mira acá es el último: confirmar uno viejo no dice nada del de ahora.
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-apagado">
        «Lo vio» quiere decir que esa persona apretó el botón del mensaje. No quiere decir que
        haya hecho algo, y el sistema no supone que sí.
      </p>
    </section>
  );
}

function ElCuestionario({
  chico,
  firmas,
  deUnTotalDe,
}: {
  chico?: string;
  firmas: {
    adultoId: string;
    nombre: string | null;
    hogar: string | null;
    fecha: string;
    respondidas: number;
  }[];
  deUnTotalDe: number;
}) {
  const nadieContesto = firmas.length === 0;

  return (
    <section className="mt-8 rounded-lg border border-borde bg-superficie px-5 py-5">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-acento">
        <Eye size={13} /> Lo que ven ustedes
      </h2>

      {nadieContesto ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-tinta">
            Todavía nadie contestó el cuestionario, así que el informe de{" "}
            {chico ?? "tu hijo"} se está armando <strong>sólo con lo que ve la red</strong>.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-tenue">
            Son nueve preguntas sobre lo que ustedes ven en casa. Sirven para conocer los patrones
            de conducta de {chico ?? "tu hijo"}, que es donde el sistema se apoya principalmente.
            Se pueden dejar sin contestar las que no sepas.
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-tinta">
            El informe de {chico ?? "tu hijo"} se arma con las dos cosas: lo que ve la red y lo que
            ven ustedes.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {firmas.map((f) => (
              <li
                key={f.adultoId}
                className="rounded-md border border-borde bg-fondo px-4 py-3"
              >
                <p className="text-sm text-tinta">
                  {/* 🔴 «Dice ser» no es desconfianza: es la verdad de lo que el
                      sistema sabe. Con una clave por casa no puede distinguir a
                      un padre del otro, y escribirlo liso sería afirmarlo. */}
                  Contestó <strong>{f.nombre ?? "un adulto que ya no está en la familia"}</strong>
                  <span className="text-apagado"> (declarado)</span>
                </p>
                <p className="mt-1 text-xs text-apagado first-letter:uppercase">
                  {fechaEnCriollo(f.fecha)} · {f.respondidas} de {deUnTotalDe} preguntas ·{" "}
                  {/* Esto sí consta: la sesión se abrió con la credencial de esa casa. */}
                  {f.hogar ? `desde ${f.hogar}` : "desde la casa"} <span>(consta)</span>
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[11px] leading-relaxed text-apagado">
            El sistema comprobó desde qué casa se contestó. Quién de ustedes lo hizo es lo que esa
            persona declaró al entrar: la clave es de la casa, no de una persona.
          </p>
        </>
      )}

      <Link
        href="/mi-familia/cuestionario"
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-acento px-4 py-2.5 text-sm font-semibold text-fondo transition"
      >
        {nadieContesto ? "Contestar el cuestionario" : "Volver a contestarlo"}
        <ArrowRight size={14} />
      </Link>

      {!nadieContesto && (
        <p className="mt-3 text-[11px] leading-relaxed text-apagado">
          De cada persona vale la última vez que contestó, así que cambiar una respuesta es
          simplemente volver a entrar.
        </p>
      )}
    </section>
  );
}

function Asistente({ chico }: { chico?: string }) {
  const [turnos, setTurnos] = useState<TurnoEnPantalla[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  /* Lo que ya se habló, apenas se abre el panel. */
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const res = await fetch("/api/mi-familia/asistente", { cache: "no-store" });
        if (res.ok && vigente) setTurnos((await res.json()).turnos ?? []);
      } catch {
        /* Sin charla previa se arranca de cero, que es lo que pasaba siempre
           antes. No vale la pena molestar al adulto con un error por esto. */
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  /* 📌 Arranques sugeridos. No son decoración: un padre preocupado muchas veces
     no sabe qué preguntar, y una caja de texto vacía es una pared. */
  const ARRANQUES = [
    "¿Qué significa este informe?",
    "¿Cómo le hablo del tema sin que se cierre?",
    "¿Qué mirar además de lo que ve el sistema?",
  ];

  async function preguntar(texto: string) {
    const limpio = texto.trim();
    if (!limpio || pensando) return;

    /* 📌 La historia ya no viaja en el pedido: la tiene el servidor. Desde el
       navegador sale la pregunta y nada más. */
    setTurnos((t) => [...t, { quien: "adulto", texto: limpio }]);
    setPregunta("");
    setPensando(true);
    setConfirmandoBorrado(false);

    try {
      const res = await fetch("/api/mi-familia/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: limpio }),
      });
      const d = await res.json();
      /* 🔑 Si el servidor mandó un texto, se muestra ése aunque el código no sea
         200. El límite de frecuencia contesta 429 con una explicación escrita
         —cuánto falta, y la Línea 137 mientras tanto—, y taparla con el cartel
         genérico dejaría al adulto sin saber si el sistema se rompió. El
         genérico queda para cuando de verdad no vino nada. */
      setTurnos((t) => [
        ...t,
        {
          quien: "asistente",
          texto:
            typeof d?.texto === "string" && d.texto.trim()
              ? d.texto
              : "No pude contestarte ahora. Probá de nuevo en un momento.",
          origen: d.origen,
          causa: d.causa,
        },
      ]);
    } catch {
      setTurnos((t) => [
        ...t,
        { quien: "asistente", texto: "No pude contestarte ahora. Probá de nuevo en un momento." },
      ]);
    } finally {
      setPensando(false);
    }
  }

  async function borrar() {
    setTurnos([]);
    setConfirmandoBorrado(false);
    await fetch("/api/mi-familia/asistente", { method: "DELETE" }).catch(() => undefined);
  }

  /* Si el último turno guardado no es de hoy, se dice: el que vuelve al otro
     día tiene que ver de cuándo es lo que está leyendo. */
  const ultima = turnos.length > 0 ? turnos[turnos.length - 1]?.fecha : undefined;
  const deOtroDia = ultima ? diaLocal(ultima) !== diaLocal(new Date().toISOString()) : false;

  return (
    <section className="mt-8 rounded-lg border border-borde bg-superficie px-5 py-5">
      <div className="flex items-center gap-2">
        <MessageCircle size={15} className="text-acento" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Preguntale al asistente
        </h2>
        {turnos.length > 0 && !confirmandoBorrado && (
          <button
            onClick={() => setConfirmandoBorrado(true)}
            className="ml-auto flex items-center gap-1.5 text-[11px] text-apagado transition hover:text-riesgo"
          >
            <Trash2 size={11} /> Borrar la charla
          </button>
        )}
      </div>

      {cargando ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-apagado">
          <LoaderCircle size={12} className="animate-spin" /> Buscando lo que ya hablaron…
        </div>
      ) : (
        <>
          {turnos.length === 0 && (
            <>
              <p className="mt-2.5 text-sm leading-relaxed text-tenue">
                Te explica el informe, te ordena las opciones y te dice cómo abrir la
                conversación con {chico ?? "el chico"}.{" "}
                <span className="text-apagado">
                  No te va a decir que no es nada, ni que sí: eso no lo puede saber, y decírtelo
                  sería mentirte con cara de sistema.
                </span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {ARRANQUES.map((a) => (
                  <button
                    key={a}
                    onClick={() => preguntar(a)}
                    className="rounded-full border border-borde px-3 py-1.5 text-xs text-tenue transition hover:border-acento hover:text-acento"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 🔴 Que la charla se guarda, y que es suya, se dice acá y no en una
              política que nadie lee. Es texto de una conversación difícil: el
              que la escribe tiene derecho a saber dónde queda. */}
          {turnos.length > 0 && !confirmandoBorrado && (
            <p className="mt-2.5 text-[11px] leading-relaxed text-apagado">
              {deOtroDia ? "Retomás la charla donde la dejaste. " : ""}
              Queda guardada para vos: el otro adulto responsable no la ve, y la borrás cuando
              quieras.
            </p>
          )}

          {confirmandoBorrado && (
            <div className="mt-3 rounded-md border border-borde bg-fondo px-3.5 py-3">
              {/* ⚠ Dice «de la casa» a propósito. La charla es de la familia
                  desde el 17/8, así que el que borra le borra la conversación
                  al otro también. Enterarse después sería la peor forma. */}
              <p className="text-xs leading-relaxed text-tenue">
                Se borra la charla entera de la casa —también lo que preguntó el otro— y no se
                puede recuperar. El informe de {chico ?? "el chico"} no se toca: eso sale del
                registro de señales, no de acá.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={borrar}
                  className="rounded-md bg-riesgo px-3 py-1.5 text-xs font-semibold text-fondo"
                >
                  Borrarla
                </button>
                <button
                  onClick={() => setConfirmandoBorrado(false)}
                  className="rounded-md border border-borde px-3 py-1.5 text-xs text-tenue"
                >
                  Dejarla
                </button>
              </div>
            </div>
          )}

          {(turnos.length > 0 || pensando) && (
            <ul className="mt-4 flex flex-col gap-4">
              {turnos.map((t, i) => (
                <li key={i} className={t.quien === "adulto" ? "flex justify-end" : ""}>
                  <div
                    className={
                      t.quien === "adulto"
                        ? "max-w-[85%] rounded-lg bg-acentoSuave px-3.5 py-2.5 text-sm text-tinta"
                        : "max-w-[95%]"
                    }
                  >
                    {t.quien === "adulto" ? (
                      <p className="text-sm leading-relaxed text-tinta">{t.texto}</p>
                    ) : (
                      <TextoDelAsistente texto={t.texto} />
                    )}
                    {/* 🔑 Cuando contesta el respaldo se dice. Que se vea el
                        momento en que el control frenó al modelo es lo que hace
                        verificable la promesa, en vez de una frase en un README.

                        🔴 Y se dice CUÁL de las dos cosas pasó. Que el control
                        frene es la promesa cumpliéndose; que se caiga la llamada
                        es el sistema caído. Poner el cartel del control cuando
                        en realidad falló el pedido es inventar la causa —y
                        colgarse un mérito que no hubo. */}
                    {t.origen === "respaldo" && (
                      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-atencion">
                        {t.causa === "control"
                          ? "texto de respaldo · el control no dejó pasar lo que escribió el modelo"
                          : t.causa === "falla"
                            ? "texto de respaldo · no se pudo pedir la respuesta"
                            : "texto de respaldo"}
                      </p>
                    )}
                  </div>
                </li>
              ))}
              {pensando && <Esperando />}
            </ul>
          )}
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          preguntar(pregunta);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribí tu pregunta"
          className="flex-1 rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-tinta outline-none focus:border-acento"
        />
        <button
          type="submit"
          disabled={pensando || !pregunta.trim()}
          className="flex items-center gap-1.5 rounded-md bg-acento px-3.5 py-2 text-sm font-semibold text-fondo transition disabled:cursor-not-allowed disabled:bg-borde disabled:text-apagado"
        >
          {pensando ? <LoaderCircle size={13} className="animate-spin" /> : <Send size={13} />}
          Preguntar
        </button>
      </form>
    </section>
  );
}

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
        {/* 🔑 Se dice quién entra acá y quién no, porque es lo que un padre
            necesita saber para decidir a quién suma. El referente recibe los
            mismos avisos; lo que no ve es este panel. */}
        <span className="rounded border border-borde px-1.5 py-0.5 text-[10px] text-apagado">
          {adulto.rol === "progenitor" ? "entra al panel" : "sólo recibe avisos"}
        </span>
      </div>

      <Conexion persona={adulto} />

      {/* 🔴 El cambio no lleva traba: se muda, fallece, pierde el teléfono, o
          el chico lo quiere cambiar. Lo que lleva es motivo — y aviso al chico
          si era su elección. */}
      {!abriendoBaja && (
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

/* ═══════════════════════════════════════════════════════════════════════════
   LA INSTALACIÓN
   ═══════════════════════════════════════════════════════════════════════════

   🔴 **Esta sección existe porque hasta el 17/8 AntiGro no le decía a la
   familia que había algo que instalar.** El sistema entero se apoya en ver la
   actividad de red del chico, y nadie le explicaba cómo hacer que la vea.

   🔑 **El orden de lo que se dice importa tanto como lo que se dice.** Primero
   qué NO es —no se instala una aplicación, no se leen mensajes—, y recién
   después el paso técnico. Contado al revés, un padre que abre esto siente que
   le están pidiendo poner un espía en el teléfono de su hijo, y con razón.
   Contado así, la instalación misma es la regla 3 vuelta un acto concreto: se
   cambia el DNS, y el chico lo puede ver.

   ⚠ **Y el router no aparece primero, aparece último y con su advertencia.**
   Es el lugar donde la gente lo pondría por instinto, y es el peor: no ve datos
   móviles, que es por donde pasa la madrugada. */

interface GuiaDeInstalacion {
  aparato: string;
  nombre: string;
  pasos: string[];
  advertencia?: string;
  archivo?: "apple" | "windows";
  aCopiar?: string;
}

interface DatosDeInstalacion {
  listo: boolean;
  motivo: string | null;
  comprobacion: string;
  guias: GuiaDeInstalacion[];
}

function Instalacion({ chico }: { chico?: string }) {
  const [datos, setDatos] = useState<DatosDeInstalacion | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mi-familia/instalacion", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setDatos)
      .catch(() => undefined);
  }, []);

  if (!datos) return null;

  async function copiar(texto: string, aparato: string) {
    await navigator.clipboard.writeText(texto).catch(() => undefined);
    setCopiado(aparato);
    setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <section className="mt-8 rounded-lg border border-borde bg-superficie px-5 py-5">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-acento">
        <Smartphone size={13} /> Cómo queda andando
      </h2>

      {/* 🔴 Lo primero que se lee es qué NO es. Ver el comentario de arriba.
          ⚠ Reescrito el 17/8: decía «decirle al aparato a qué servidor
          preguntarle las direcciones», y Edgardo lo frenó — no decía en qué
          aparato, ni qué es ese servidor, ni cuál. Sale de `COMO_FUNCIONA`
          en `config.ts`, que es ahora el único lugar donde está escrito. */}
      <p className="mt-3 text-sm leading-relaxed text-tenue">
        <strong className="text-tinta">{COMO_FUNCIONA.noEs}</strong>
      </p>
      <p className="mt-2 text-sm leading-relaxed text-tenue">{COMO_FUNCIONA.laComparacion}</p>
      <p className="mt-2 text-sm leading-relaxed text-tinta">{COMO_FUNCIONA.queCambia}</p>
      <p className="mt-2 text-sm leading-relaxed text-tenue">{COMO_FUNCIONA.elLimite}</p>
      <p className="mt-2 text-sm leading-relaxed text-tenue">
        Por eso {chico ?? "el chico"} lo puede ver y conviene que lo vea. Es lo que le prometimos
        al darlo de alta.
      </p>

      {/* 🔑 Va donde no se puede saltear, no al final. */}
      <p className="mt-4 rounded-md border border-acento/30 bg-acentoSuave px-3.5 py-2.5 text-sm leading-relaxed text-tinta">
        <strong>Va en el aparato de {chico ?? "el chico"}</strong>, no en el router. Así lo sigue
        viendo con datos móviles, en el colegio, y en cualquier casa donde esté.
      </p>

      {!datos.listo && (
        <p className="mt-4 flex gap-2 rounded-md border border-atencion/40 bg-atencionSuave px-3.5 py-2.5 text-xs leading-relaxed text-atencion">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          {/* 🔴 Se dice, no se disimula. Una instalación que no reporta se ve
              igual que una casa tranquila, y esa confusión es el peor final. */}
          <span>{datos.motivo}</span>
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {datos.guias.map((g) => {
          const abierto = abierta === g.aparato;
          return (
            <div key={g.aparato} className="rounded-md border border-borde">
              <button
                onClick={() => setAbierta(abierto ? null : g.aparato)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-tinta transition hover:bg-fondo"
              >
                {g.nombre}
                <span className="font-mono text-[10px] text-apagado">{abierto ? "−" : "+"}</span>
              </button>

              {abierto && (
                <div className="border-t border-borde px-4 py-3.5">
                  <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-sm leading-relaxed text-tenue">
                    {g.pasos.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>

                  {g.aCopiar && (
                    <button
                      onClick={() => copiar(g.aCopiar!, g.aparato)}
                      className="mt-3 flex w-full items-center justify-between gap-2 rounded border border-borde bg-fondo px-3 py-2 text-left font-mono text-xs text-acento transition hover:border-acento"
                    >
                      <span className="truncate">{g.aCopiar}</span>
                      {copiado === g.aparato ? (
                        <Check size={13} className="shrink-0" />
                      ) : (
                        <Copy size={13} className="shrink-0" />
                      )}
                    </button>
                  )}

                  {g.archivo && datos.listo && (
                    <a
                      href={`/api/mi-familia/instalacion?archivo=${g.archivo}&aparato=${g.aparato}`}
                      className="mt-3 flex w-fit items-center gap-1.5 rounded-md bg-acento px-3 py-1.5 text-xs font-semibold text-fondo"
                    >
                      <Download size={12} /> Bajar el archivo
                    </a>
                  )}

                  {g.advertencia && (
                    <p className="mt-3 flex gap-2 rounded border border-atencion/30 bg-atencionSuave px-3 py-2 text-xs leading-relaxed text-atencion">
                      <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                      <span>{g.advertencia}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔴 La comprobación no es un consejo del final: es el único modo de
          distinguir «quedó bien» de «no llegó nada», que se ven igual. */}
      <p className="mt-4 border-t border-borde pt-3 text-xs leading-relaxed text-apagado">
        Cuando termines, abrí{" "}
        <a
          href={datos.comprobacion}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-acento hover:underline"
        >
          {datos.comprobacion}
        </a>{" "}
        <strong className="text-tenue">en el aparato de {chico ?? "el chico"}</strong>. Si dice{" "}
        <code className="font-mono text-tenue">&quot;status&quot;: &quot;ok&quot;</code>, quedó. Si
        dice <code className="font-mono text-tenue">unconfigured</code>, no quedó — y no te lo va a
        avisar de otra forma.
      </p>
    </section>
  );
}
