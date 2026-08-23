"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUESTIONARIO DE LOS ADULTOS — la pantalla
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Las preguntas viven en `src/lib/motor/cuestionario.ts` desde el 14/8 y el
 *  motor las venía consumiendo. Lo que faltaba era esto: **el lugar donde
 *  contestarlas.** Hasta el 19/8 el panel decía «nadie contestó el cuestionario
 *  todavía» y no había ningún lado adonde ir.
 *
 *  🔑 **Para qué está, y es la definición de Edgardo (18/8):** *"conocer los
 *  patrones de conducta del chico, que es de donde nos apoyamos
 *  principalmente"*. Eso ordena la pantalla entera y explica lo que NO hay:
 *
 *  🔴 **Al terminar no se muestra ningún puntaje.** Un número sobre un chico es
 *  lo que la regla 1 prohíbe decir y lo que la Ley 25.326 art. 7 inc. 3 prohíbe
 *  registrar. Se dice que la respuesta entró y que el informe pasa a estar
 *  mirado con los dos ojos. Nada más, y no es poco.
 *
 *  🔴 **La firma va PRIMERO, no al final**, y con la distinción a la vista:
 *  desde qué casa se entró CONSTA (la sesión se abrió con la credencial de esa
 *  casa); quién contesta es lo que esa persona DECLARA. Desde el 18/8 la firma
 *  se muestra en el panel, así que si la pantalla no explica la diferencia, el
 *  panel después enseña una declaración con cara de hecho.
 *
 *  🔑 **Una pregunta por pantalla**, y sale de la filosofía del PDF: una
 *  pregunta por carilla. Nueve preguntas juntas se contestan en diagonal, y una
 *  contestada en diagonal entra igual al motor.
 *
 *  🔴 **«Prefiero no contestar» está a la vista en todas.** Sin esa salida, el
 *  que no sabe marca «no / nunca», y eso es una mentira entrando al motor. El
 *  motor ya está del lado correcto: lo que no vino lo trata como *no sabemos*,
 *  nunca como *está todo bien*.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  Info,
  LoaderCircle,
  MinusCircle,
  PenLine,
} from "lucide-react";
import { ESCALA, INDICADORES, type Indicador } from "@/lib/motor/cuestionario";

interface Firmante {
  id: string;
  nombre: string;
  vinculo: string;
}

interface Datos {
  chico: { nombre: string; edad: number };
  hogar: string | null;
  firmantes: Firmante[];
  ultimas: Record<string, { fecha: string; respuestas: Record<string, number> }>;
}

/** `null` es «prefiero no contestar»; `undefined` es que todavía no pasó por ahí. */
type Respuestas = Record<string, number | null | undefined>;

function diaLocal(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

/**
 * De dónde sale la pregunta. Está en el archivo desde el 14/8 y hasta hoy no se
 * veía en ningún lado.
 *
 * 🔑 **Es lo que separa esto de un test de revista**, y por eso se muestra: un
 * cuestionario que no dice de dónde saca sus preguntas le pide al que contesta
 * que confíe. Las tres clases dicen cosas distintas y no se pueden mezclar —
 * `observable` es una pregunta por un hecho, no la afirmación de que ese hecho
 * signifique algo.
 */
function DeDondeSale({ indicador }: { indicador: Indicador }) {
  const [abierto, setAbierto] = useState(false);
  const p = indicador.procedencia;

  const etiqueta =
    p.clase === "estudio"
      ? "Se apoya en un estudio"
      : p.clase === "organismo"
        ? "Lo recomienda un organismo oficial"
        : "Es un hecho que se puede ver";

  return (
    <div className="mt-5 border-t border-borde pt-4">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-apagado transition hover:text-tenue"
      >
        <Info size={12} /> {abierto ? "Ocultar" : etiqueta}
      </button>

      {abierto && (
        <p className="mt-2 text-xs leading-relaxed text-tenue">
          {p.clase === "observable" ? p.nota : p.cita}
        </p>
      )}
    </div>
  );
}

export default function Cuestionario() {
  const router = useRouter();

  const [datos, setDatos] = useState<Datos | null>(null);
  const [estadoCarga, setEstadoCarga] = useState<"cargando" | "listo" | "sin_chico" | "error">(
    "cargando",
  );

  const [paso, setPaso] = useState(0);
  const [firmante, setFirmante] = useState<string>("");
  const [respuestas, setRespuestas] = useState<Respuestas>({});

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState<{ fecha: string; respondidas: number } | null>(null);

  useEffect(() => {
    fetch("/api/mi-familia/cuestionario")
      .then(async (res) => {
        if (res.status === 409) return setEstadoCarga("sin_chico");
        if (!res.ok) return setEstadoCarga("error");
        const d: Datos = await res.json();
        setDatos(d);
        // Con un solo adulto no hay nada que elegir: se firma solo.
        if (d.firmantes.length === 1) setFirmante(d.firmantes[0].id);
        setEstadoCarga("listo");
      })
      .catch(() => setEstadoCarga("error"));
  }, []);

  /* 🔑 Volver a contestar es lo NORMAL, no una corrección: la conducta de un
     chico cambia y el cuestionario está para seguirla. Por eso, elegida la
     firma, se trae puesto lo último que esa misma persona había dicho. Arrancar
     de cero cada vez haría que la segunda vuelta costara igual que la primera,
     y una tarea que cuesta se deja de hacer. */
  useEffect(() => {
    if (!firmante || !datos) return;
    const ultima = datos.ultimas[firmante];
    setRespuestas(ultima ? { ...ultima.respuestas } : {});
  }, [firmante, datos]);

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      // Sólo viaja lo contestado. Lo salteado no se manda como 0: no es lo mismo.
      const soloContestadas: Record<string, number> = {};
      for (const [id, valor] of Object.entries(respuestas)) {
        if (typeof valor === "number") soloContestadas[id] = valor;
      }

      const res = await fetch("/api/mi-familia/cuestionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultoId: firmante, respuestas: soloContestadas }),
      });
      const d = await res.json();

      if (!res.ok) {
        setError(
          d.error === "sin_respuestas"
            ? "No quedó ninguna pregunta contestada. Si preferís, podés dejarlo para otro momento."
            : d.error === "demasiados_pedidos"
              ? "Se contestó muchas veces en poco rato. Probá dentro de un rato."
              : "No se pudo guardar. Probá de nuevo.",
        );
        return;
      }

      setGuardado({ fecha: d.fecha, respondidas: d.respondidas });
      setPaso(INDICADORES.length + 1);
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  /* ── Mientras carga ──────────────────────────────────────────────────── */

  if (estadoCarga !== "listo" || !datos) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-tenue">
          {estadoCarga === "cargando"
            ? "Cargando…"
            : estadoCarga === "sin_chico"
              ? "Todavía no hay ningún chico cargado en tu familia."
              : "No se pudo abrir el cuestionario."}
        </p>
        <Link href="/mi-familia" className="mt-4 inline-block text-sm text-acento">
          Volver al panel
        </Link>
      </main>
    );
  }

  const total = INDICADORES.length;
  const contestadas = Object.values(respuestas).filter((v) => typeof v === "number").length;
  const enLaFirma = paso === 0;
  const enElCierre = paso === total + 1;
  const indicador = !enLaFirma && !enElCierre ? INDICADORES[paso - 1] : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2.5">
          <Eye size={17} className="text-acento" />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
            AntiGro · lo que ven los adultos
          </p>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-tinta">
          {enElCierre ? "Quedó anotado" : `Cómo viene ${datos.chico.nombre}`}
        </h1>

        {/* 🔑 Para qué está, dicho arriba de todo y con las palabras de Edgardo.
            Un cuestionario que no explica para qué es se contesta a la defensiva. */}
        {!enElCierre && (
          <p className="mt-2 text-sm leading-relaxed text-tenue">
            Estas preguntas sirven para conocer <strong className="text-tinta">los patrones de
            conducta</strong> de {datos.chico.nombre}, que es donde el sistema se apoya
            principalmente. No es un examen sobre vos ni una calificación sobre {datos.chico.nombre}.
          </p>
        )}
      </header>

      {/* ── El avance ────────────────────────────────────────────────────── */}
      {!enLaFirma && !enElCierre && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-[11px] text-apagado">
            <span>
              Pregunta {paso} de {total}
            </span>
            <span>{contestadas} contestadas</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-borde">
            <div
              className="h-full rounded-full bg-acento transition-all"
              style={{ width: `${(paso / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── 1 · La firma ─────────────────────────────────────────────────── */}
      {enLaFirma && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-tinta">
            <PenLine size={15} className="text-acento" /> ¿Quién está contestando?
          </h2>

          <div className="mt-4 flex flex-col gap-2">
            {datos.firmantes.map((f) => {
              const ultima = datos.ultimas[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFirmante(f.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    firmante === f.id
                      ? "border-acento bg-acentoSuave"
                      : "border-borde bg-superficie hover:border-tenue"
                  }`}
                >
                  <p className="text-sm font-semibold text-tinta">{f.nombre}</p>
                  <p className="mt-0.5 text-xs text-apagado">
                    {f.vinculo}
                    {ultima && ` · contestó por última vez el ${diaLocal(ultima.fecha)}`}
                  </p>
                </button>
              );
            })}
          </div>

          {/* 🔴 La distinción de Edgardo (18/8), y va acá porque es acá donde se
              produce: el sistema comprobó la casa y no puede comprobar la persona.
              Decirlo después, en el panel, sería tarde. */}
          <div className="mt-6 rounded-lg border border-borde bg-superficie px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-apagado">
              Por qué te lo preguntamos
            </p>
            <p className="mt-2 text-xs leading-relaxed text-tenue">
              La clave con la que entraste es de tu casa, no de una persona: el sistema sabe
              <strong className="text-tinta"> desde qué casa</strong> se contestó, y eso consta.
              Quién de ustedes está contestando <strong className="text-tinta">lo decís vos</strong>,
              y el sistema no tiene forma de comprobarlo. Se guardan las dos cosas por separado, y
              en el panel se muestran como lo que son.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-tenue">
              Sirve para algo concreto: si dos personas contestan distinto sobre lo mismo, saber
              quién dijo qué es parte de la respuesta.
            </p>
          </div>
        </section>
      )}

      {/* ── 2 · Las preguntas, de a una ──────────────────────────────────── */}
      {indicador && (
        <section>
          <h2 className="text-lg font-semibold leading-snug text-tinta">{indicador.pregunta}</h2>
          <p className="mt-2 text-sm leading-relaxed text-tenue">{indicador.ayuda}</p>

          <div className="mt-6 flex flex-col gap-2">
            {ESCALA.map((op) => (
              <button
                key={op.valor}
                type="button"
                onClick={() => setRespuestas((r) => ({ ...r, [indicador.id]: op.valor }))}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                  respuestas[indicador.id] === op.valor
                    ? "border-acento bg-acentoSuave font-semibold text-tinta"
                    : "border-borde bg-superficie text-tinta hover:border-tenue"
                }`}
              >
                {op.etiqueta}
              </button>
            ))}

            {/* 🔴 La salida, y va con el mismo peso visual que las demás. No es
                una opción de descarte: para varias de estas preguntas «no sé» es
                la respuesta verdadera, y el motor la sabe usar. */}
            <button
              type="button"
              onClick={() => setRespuestas((r) => ({ ...r, [indicador.id]: null }))}
              className={`mt-1 flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-left text-sm transition ${
                respuestas[indicador.id] === null
                  ? "border-tenue bg-superficie font-semibold text-tinta"
                  : "border-borde text-tenue hover:border-tenue"
              }`}
            >
              <MinusCircle size={14} /> No sé / prefiero no contestar
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-apagado">
            Si no sabés, esa es la respuesta correcta. El sistema la anota como «no sabemos», que
            no es lo mismo que «no pasa».
          </p>

          <DeDondeSale indicador={indicador} />
        </section>
      )}

      {/* ── 3 · El cierre. Sin puntaje ───────────────────────────────────── */}
      {enElCierre && guardado && (
        <section>
          <div className="rounded-lg border border-calma/30 bg-calma/10 px-5 py-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
              <Check size={15} className="text-calma" />
              Gracias. Lo que contaste ya está en el sistema.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-tenue">
              Contestaste {guardado.respondidas} de {total} preguntas.
              {guardado.respondidas < total &&
                " Las que dejaste sin contestar quedaron como «no sabemos», no como «no pasa»."}
            </p>
          </div>

          {/* 🔴 Acá NO va un puntaje, y es la decisión más importante de la
              pantalla. El sistema no devuelve un número sobre un chico: dice qué
              cambió en cómo mira, que es lo único que puede sostener. */}
          <div className="mt-5 rounded-lg border border-borde bg-superficie px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.1em] text-apagado">Qué cambia ahora</p>
            <p className="mt-2 text-sm leading-relaxed text-tinta">
              Hasta recién el informe de {datos.chico.nombre} se armaba sólo con lo que ve la red.
              Ahora se arma con las dos cosas: lo que ve la red y lo que ven ustedes.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-tenue">
              AntiGro no te va a devolver un puntaje sobre {datos.chico.nombre}, ni acá ni en el
              panel. No dice si un chico «está en riesgo»: dice qué se vio, cuánto se sostuvo en el
              tiempo y qué no se puede ver desde acá. Todo lo demás lo deciden ustedes.
            </p>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-apagado">
            Podés volver a contestarlo cuando quieras. Vale la última vez de cada uno, así que
            cambiar una respuesta es simplemente volver a entrar.
          </p>
        </section>
      )}

      {/* ── La navegación ────────────────────────────────────────────────── */}
      {error && (
        <p className="mt-6 flex items-center gap-2 text-sm text-riesgo">
          <CircleAlert size={14} /> {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-borde pt-6">
        {enElCierre ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => (paso === 0 ? router.push("/mi-familia") : setPaso((p) => p - 1))}
            className="flex items-center gap-2 text-sm text-tenue transition hover:text-tinta"
          >
            <ArrowLeft size={14} /> {paso === 0 ? "Volver al panel" : "Atrás"}
          </button>
        )}

        {enLaFirma && (
          <button
            type="button"
            onClick={() => setPaso(1)}
            disabled={!firmante}
            className="flex items-center gap-2 rounded-md bg-degradado px-5 py-2.5 text-sm font-semibold text-fondo transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-borde disabled:text-apagado disabled:opacity-100"
          >
            {firmante ? "Empezar" : "Elegí quién contesta"} <ArrowRight size={14} />
          </button>
        )}

        {indicador && paso < total && (
          <button
            type="button"
            onClick={() => setPaso((p) => p + 1)}
            className="flex items-center gap-2 rounded-md bg-degradado px-5 py-2.5 text-sm font-semibold text-fondo transition hover:opacity-90"
          >
            {/* 📌 Nunca dice «Falta contestar»: saltear es una opción legítima y
                el botón no puede sugerir lo contrario. */}
            Seguir <ArrowRight size={14} />
          </button>
        )}

        {indicador && paso === total && (
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || contestadas === 0}
            className="flex items-center gap-2 rounded-md bg-degradado px-5 py-2.5 text-sm font-semibold text-fondo transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-borde disabled:text-apagado disabled:opacity-100"
          >
            {guardando ? (
              <>
                <LoaderCircle size={14} className="animate-spin" /> Guardando…
              </>
            ) : (
              <>
                Guardar <ArrowRight size={14} />
              </>
            )}
          </button>
        )}

        {enElCierre && (
          <button
            type="button"
            onClick={() => router.push("/mi-familia")}
            className="flex items-center gap-2 rounded-md bg-degradado px-5 py-2.5 text-sm font-semibold text-fondo transition hover:opacity-90"
          >
            Volver al panel <ArrowRight size={14} />
          </button>
        )}
      </div>
    </main>
  );
}
