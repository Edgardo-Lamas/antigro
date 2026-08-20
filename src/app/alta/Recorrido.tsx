"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS PANTALLAS DEL RECORRIDO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Nada se exige, todo se sugiere.** Es la corrección de Edgardo del 17/8 y
 *  gobierna cada pantalla de acá: *"tampoco podemos exigir padres y referentes,
 *  siempre sugerimos para que el sistema de protección del chico sea más
 *  completo"*. Lo único duro es que haya un chico — sin eso no hay nada que
 *  mirar. Todo lo demás se puede saltear, y el sistema explica qué se pierde.
 *
 *  🔑 **El orden importa y no es casual:**
 *
 *  1. **El simulador primero.** Nadie carga la edad de su hijo en un sistema que
 *     todavía no vio funcionar.
 *  2. **El chico.** Edad, género y turno son datos del motor, no adornos.
 *  3. **La casa y los adultos.** Una casa o dos, y qué puede ver cada uno.
 *  4. **La conversación con el chico.** Es la regla 4 y no es un trámite: el 63%
 *     de los chicos no sabe qué es el grooming, así que esa charla ya resuelve
 *     parte del problema antes de que el sistema haga nada.
 *  5. **La instalación.** Recién acá, cuando ya se entendió qué hace el sistema.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  LoaderCircle,
  MessageCircleHeart,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Consola from "@/app/_demo/Consola";
import {
  EDAD_MAXIMA,
  EDAD_MINIMA,
  TURNOS_ESCOLARES,
  VINCULOS,
  type Genero,
  type RolDeAdulto,
  type TurnoEscolar,
  type Vinculo,
} from "@/lib/datos/tipos";
import { APARATOS, COMPROBACION, guiaPara, type Aparato } from "@/lib/instalacion";
import { COMO_FUNCIONA, EDAD_PARA_ELEGIR_REFERENTE, quienEligeAlReferente } from "@/lib/config";

interface AdultoEnPantalla {
  nombre: string;
  vinculo: Vinculo;
  rol: RolDeAdulto;
  elegidoPorElChico: boolean;
  canal: "telegram" | "correo" | "whatsapp";
  destino: string;
}

interface Props {
  nombreDeLaFamilia: string;
  familiaId: string;
  yaCargado: {
    nombre: string;
    edad: number;
    genero: Genero;
    turnoEscolar?: TurnoEscolar;
    perfil: string;
    adultos: AdultoEnPantalla[];
  } | null;
}

const PASOS = ["Cómo funciona", "El chico", "La casa", "La conversación", "La instalación"];

const ADULTO_NUEVO: AdultoEnPantalla = {
  nombre: "",
  vinculo: "madre",
  rol: "progenitor",
  elegidoPorElChico: false,
  canal: "telegram",
  destino: "",
};

export default function Recorrido({ nombreDeLaFamilia, familiaId, yaCargado }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);

  const [familia, setFamilia] = useState(nombreDeLaFamilia);
  const [nombre, setNombre] = useState(yaCargado?.nombre ?? "");
  const [edad, setEdad] = useState(yaCargado?.edad ?? 12);
  const [genero, setGenero] = useState<Genero>(yaCargado?.genero ?? "nena");
  const [turno, setTurno] = useState<TurnoEscolar | "">(yaCargado?.turnoEscolar ?? "");
  const [perfil, setPerfil] = useState(yaCargado?.perfil ?? "");

  /** 🔴 Una casa o dos. Ordena el resto: con dos, hay dos puertas al mismo panel. */
  const [dosCasas, setDosCasas] = useState(false);
  const [adultos, setAdultos] = useState<AdultoEnPantalla[]>(
    yaCargado?.adultos.length ? yaCargado.adultos : [{ ...ADULTO_NUEVO }],
  );

  const [aparato, setAparato] = useState<Aparato>("iphone");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const campo =
    "w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-tinta outline-none focus:border-acento";
  const etiqueta = "mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-apagado";

  /* ── Lo único que impide seguir ─────────────────────────────────────────── */
  const faltaElChico = nombre.trim().length === 0;

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch("/api/alta/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: familia.trim() || undefined,
          chicos: [
            {
              nombre: nombre.trim(),
              edad,
              genero,
              turnoEscolar: turno || undefined,
              canal: { tipo: "telegram", destino: "" },
              nextdnsProfileId: perfil.trim() || undefined,
            },
          ],
          adultos: adultos
            .filter((a) => a.nombre.trim().length > 0)
            .map((a) => ({
              nombre: a.nombre.trim(),
              vinculo: a.vinculo,
              rol: a.rol,
              elegidoPorElChico: a.elegidoPorElChico,
              canal: { tipo: a.canal, destino: a.canal === "correo" ? a.destino.trim() : "" },
            })),
        }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.error ?? "No se pudo guardar.");
        return;
      }
      setGuardado(true);
      setPaso(4);
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  /* ── El encabezado con los pasos ────────────────────────────────────────── */
  const cabecera = (
    <div className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {PASOS.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
              i < paso
                ? "bg-acento text-fondo"
                : i === paso
                  ? "bg-acentoSuave text-acento ring-1 ring-acento"
                  : "bg-borde text-apagado"
            }`}
          >
            {i < paso ? <Check size={11} /> : i + 1}
          </span>
          <span
            className={`text-[11px] ${i === paso ? "font-semibold text-tinta" : "text-apagado"}`}
          >
            {p}
          </span>
          {i < PASOS.length - 1 && <span className="text-apagado">·</span>}
        </div>
      ))}
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={17} className="text-acento" />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
            AntiGro · alta
          </p>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-tinta">Poner en marcha el sistema</h1>
        {/* 🔴 El pago se nombra y no se simula. Está decidido que no se cobra
            antes del 20, y una pantalla de checkout falsa sería exactamente el
            tipo de cosa que este producto no puede permitirse. */}
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          En el producto terminado, acá ya estaría paga la suscripción.{" "}
          <strong className="text-tinta">En esta demostración no se cobra nada</strong> — el
          recorrido es el mismo.
        </p>
      </header>

      {cabecera}

      {/* ── 1. El simulador ─────────────────────────────────────────────── */}
      {paso === 0 && (
        <section>
          <h2 className="text-lg font-semibold text-tinta">Antes de pedirte un solo dato</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tenue">
            Mové los controles y mirá cómo reacciona el sistema. El simulador emite las señales;
            quien decide es el mismo motor que va a mirar a tu hijo, con la misma regla de
            persistencia.
          </p>

          <div className="mt-6">
            <Consola />
          </div>
        </section>
      )}

      {/* ── 2. El chico ─────────────────────────────────────────────────── */}
      {paso === 1 && (
        <section className="max-w-xl">
          <h2 className="text-lg font-semibold text-tinta">¿A quién cuidamos?</h2>
          <p className="mt-2 text-sm leading-relaxed text-tenue">
            La edad y el turno no son datos de formulario:{" "}
            <strong className="text-tinta">cambian cuándo el sistema habla</strong>. A las 2 de la
            mañana, un chico de 9 y uno de 16 no son lo mismo.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <label className={etiqueta} htmlFor="familia">
                Cómo se llama tu familia
              </label>
              <input
                id="familia"
                value={familia}
                onChange={(e) => setFamilia(e.target.value)}
                placeholder="Familia Pérez"
                className={campo}
              />
            </div>

            <div>
              <label className={etiqueta} htmlFor="nombre">
                Nombre del chico o la chica
              </label>
              <input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={campo}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={etiqueta} htmlFor="edad">
                  Edad
                </label>
                <input
                  id="edad"
                  type="number"
                  min={EDAD_MINIMA}
                  max={EDAD_MAXIMA}
                  value={edad}
                  onChange={(e) => setEdad(Number(e.target.value))}
                  className={campo}
                />
              </div>
              <div>
                <label className={etiqueta} htmlFor="genero">
                  Género
                </label>
                <select
                  id="genero"
                  value={genero}
                  onChange={(e) => setGenero(e.target.value as Genero)}
                  className={campo}
                >
                  <option value="nena">Nena</option>
                  <option value="varon">Varón</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* 🔑 El turno corre la hora de la madrugada. Cada opción dice qué
                implica: nadie elige a ciegas. */}
            <div>
              <label className={etiqueta} htmlFor="turno">
                Turno del colegio
              </label>
              <select
                id="turno"
                value={turno}
                onChange={(e) => setTurno(e.target.value as TurnoEscolar | "")}
                className={campo}
              >
                <option value="">Prefiero no decirlo</option>
                {TURNOS_ESCOLARES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} — {t.detalle}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-apagado">
                Sirve para una sola cosa, y es importante: el sistema no sabe a qué hora se
                levanta. Si entra al colegio a las 7:30, estar conectado a las 23 significa otra
                cosa que si entra a la tarde.{" "}
                <strong className="text-tenue">Sin este dato el sistema no supone un horario.</strong>
              </p>
            </div>

            {/* 📌 El perfil de NextDNS es del CHICO: el filtro va en su aparato. */}
            <div>
              <label className={etiqueta} htmlFor="perfil">
                Identificador de NextDNS <span className="normal-case">(si ya tenés uno)</span>
              </label>
              <input
                id="perfil"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                placeholder="a1b2c3"
                className={campo}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-apagado">
                Sin esto el sistema funciona con el simulador y{" "}
                <strong className="text-tenue">lo dice en pantalla</strong>, en vez de mostrar
                datos que no existen.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. La casa y los adultos ────────────────────────────────────── */}
      {paso === 2 && (
        <section className="max-w-xl">
          <h2 className="text-lg font-semibold text-tinta">Quiénes están</h2>

          {/* 🔴 La pregunta que ordena todo el formulario. Con dos casas hay dos
              puertas al MISMO panel: ninguno puede dejar al otro afuera. */}
          <div className="mt-5 rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-medium text-tinta">
              ¿{nombre.trim() || "El chico"} vive en una casa o en dos?
            </p>
            <div className="mt-3 flex gap-2">
              {[
                { v: false, t: "En una" },
                { v: true, t: "En dos" },
              ].map((o) => (
                <button
                  key={o.t}
                  type="button"
                  onClick={() => setDosCasas(o.v)}
                  className={`rounded-md border px-3.5 py-1.5 text-sm transition ${
                    dosCasas === o.v
                      ? "border-acento bg-acentoSuave text-acento"
                      : "border-borde text-tenue"
                  }`}
                >
                  {o.t}
                </button>
              ))}
            </div>
            {dosCasas && (
              <p className="mt-3 border-t border-borde pt-3 text-xs leading-relaxed text-tenue">
                Entonces hay <strong className="text-tinta">un solo panel con dos entradas</strong>
                , una por casa. Los dos ven exactamente lo mismo, y ninguno puede dejar al otro
                afuera cambiando la clave. La segunda entrada se crea desde el panel, cuando
                termines acá.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {adultos.map((a, i) => (
              <div key={i} className="rounded-lg border border-borde bg-superficie px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
                    Adulto {i + 1}
                  </p>
                  {adultos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAdultos(adultos.filter((_, j) => j !== i))}
                      className="text-apagado transition hover:text-riesgo"
                      aria-label="Sacar este adulto"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    value={a.nombre}
                    onChange={(e) =>
                      setAdultos(
                        adultos.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)),
                      )
                    }
                    placeholder="Nombre"
                    className={campo}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={a.vinculo}
                      onChange={(e) =>
                        setAdultos(
                          adultos.map((x, j) =>
                            j === i ? { ...x, vinculo: e.target.value as Vinculo } : x,
                          ),
                        )
                      }
                      className={campo}
                    >
                      {VINCULOS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre}
                        </option>
                      ))}
                    </select>

                    {/* 🔴 El rol NO se deduce del vínculo: una abuela puede ser
                        la tutora y un padre puede ser el referente. */}
                    <select
                      value={a.rol}
                      onChange={(e) =>
                        setAdultos(
                          adultos.map((x, j) =>
                            j === i ? { ...x, rol: e.target.value as RolDeAdulto } : x,
                          ),
                        )
                      }
                      className={campo}
                    >
                      <option value="progenitor">Entra al panel</option>
                      <option value="referente">Sólo recibe avisos</option>
                    </select>
                  </div>

                  {a.rol === "referente" && (
                    <>
                      <p className="text-xs leading-relaxed text-apagado">
                        Recibe los mismos avisos y sabe que está en el sistema, pero no ve el
                        informe: eso es de los padres.
                      </p>

                      {/* 🔑 La marca «lo eligió el chico» sólo aparece cuando el
                          chico tiene edad de elegir. A los 8 el referente lo
                          eligen los padres, y hasta el 17/8 el sistema pedía
                          esta marca igual: un cartel que no se podía apagar
                          nunca. Acá directamente no se muestra. */}
                      {edad >= EDAD_PARA_ELEGIR_REFERENTE && (
                        <label className="flex items-center gap-2 text-xs text-tenue">
                          <input
                            type="checkbox"
                            checked={a.elegidoPorElChico}
                            onChange={(e) =>
                              setAdultos(
                                adultos.map((x, j) =>
                                  j === i ? { ...x, elegidoPorElChico: e.target.checked } : x,
                                ),
                              )
                            }
                          />
                          Lo eligió {nombre.trim() || "el chico"}
                        </label>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setAdultos([...adultos, { ...ADULTO_NUEVO, rol: "referente" }])}
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-borde px-4 py-2.5 text-sm text-tenue transition hover:border-acento hover:text-acento"
            >
              <Plus size={14} /> Sumar otro adulto
            </button>

            {/* 🔴 Sugerencia, no exigencia. Un hogar con un solo progenitor NO
                está incompleto: es otra forma de familia. */}
            {adultos.filter((a) => a.nombre.trim()).length < 2 && (
              <p className="rounded-md border border-borde bg-fondo px-4 py-3 text-xs leading-relaxed text-tenue">
                <strong className="text-tinta">Sugerencia, no requisito.</strong> Con un segundo
                adulto no queda una sola persona pendiente de los avisos. El 43% de los chicos no
                habla de estos temas con sus padres, así que un adulto de afuera —una tía, una
                abuela, alguien de confianza— suele ser a quien de verdad le escriben.{" "}
                {quienEligeAlReferente(edad) === "el_chico"
                  ? `A los ${edad}, ese adulto conviene que lo elija ${nombre.trim() || "el chico"}.`
                  : `A los ${edad} lo eligen ustedes, y está bien que sea así.`}
              </p>
            )}

            {/* ── 🔴 CÓMO SE CONECTAN, que el recorrido no contaba ──────────
                Hasta el 20/8 esta pantalla cargaba a los adultos **sin destino**:
                quedaban anotados y nadie decía cómo les llegaba un aviso. El que
                terminaba el recorrido se iba creyendo que el sistema les había
                escrito, y no les escribió nadie — así que el día que hubiera algo
                que avisar, el aviso no salía y la familia se enteraba ahí.

                🔑 Es texto, no código: la vinculación por QR ya funcionaba y ya
                estaba en el panel. Lo que faltaba era decirlo. */}
            <div className="rounded-md border border-borde bg-fondo px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-acento">
                Cómo se conecta cada uno
              </p>
              <p className="mt-2 text-xs leading-relaxed text-tenue">
                Acá los anotás; <strong className="text-tinta">todavía no les llega nada</strong>.
                Cuando termines, en tu panel vas a ver un código QR por persona:{" "}
                {nombre.trim() || "el chico"} y cada adulto lo escanean con su propio teléfono, y
                recién ahí queda abierto el canal por el que AntiGro les va a escribir.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-apagado">
                ⚠ Es cada uno con su teléfono, y a propósito: es lo que hace que el aviso llegue a
                esa persona y no a un contacto que alguien anotó por ella. Mientras un código no se
                escanee, el panel lo muestra pendiente en vez de dar por hecho que llegó.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. La conversación con el chico — la regla 4 ─────────────────── */}
      {paso === 3 && (
        <section className="max-w-2xl">
          <div className="flex items-center gap-2.5">
            <MessageCircleHeart size={18} className="text-acento" />
            <h2 className="text-lg font-semibold text-tinta">
              Lo más importante no lo hace el sistema
            </h2>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-tenue">
            Antes de instalar nada, hablá con {nombre.trim() || "tu hijo"}. No es un trámite legal
            ni un aviso de cortesía:{" "}
            <strong className="text-tinta">
              el 63% de los chicos no sabe qué es el grooming
            </strong>
            , así que esa conversación ya resuelve parte del problema antes de que el sistema haga
            absolutamente nada.
          </p>

          <div className="mt-5 rounded-lg border border-borde bg-superficie px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
              Qué conviene que sepa
            </p>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-tenue">
              <li>
                <strong className="text-tinta">Que AntiGro existe.</strong> Desde hoy, no el día
                que suene una alerta. Un chico que sabe que hay una red que lo cuida es un aliado;
                uno que se siente espiado es un adversario.
              </li>
              <li>
                <strong className="text-tinta">Que nadie va a leer sus mensajes.</strong> Y es
                verdad, no es una forma de decirlo: el sistema ve a qué hora hubo actividad de red
                y hacia qué tipo de sitio. No ve una palabra de lo que escribe.
              </li>
              <li>
                <strong className="text-tinta">Que a él también le va a llegar ayuda.</strong> Si
                el sistema nota algo, no avisa sólo a los adultos: le escribe a él, con el texto
                que corresponde a su edad.
              </li>
              <li>
                <strong className="text-tinta">Quién es su adulto de confianza.</strong> Si tiene{" "}
                {EDAD_PARA_ELEGIR_REFERENTE} o más, dejalo elegir a él. Es la diferencia entre un
                contacto de la lista y alguien a quien de verdad le va a escribir.
              </li>
            </ul>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-apagado">
            📌 Esto no es una pantalla que haya que completar. No hay nada que tildar y el sistema
            no comprueba que la charla haya pasado —no podría—. Está acá porque es la primera
            herramienta del producto, y va antes de la instalación a propósito.
          </p>
        </section>
      )}

      {/* ── 5. La instalación ───────────────────────────────────────────── */}
      {paso === 4 && (
        <section className="max-w-2xl">
          <h2 className="text-lg font-semibold text-tinta">Qué hay que instalar</h2>

          <div className="mt-4 rounded-lg border border-borde bg-superficie px-5 py-4">
            {/* 🔴 Reescrito el 17/8 — ver `COMO_FUNCIONA` en `config.ts`. El
                texto viejo no decía en qué aparato, ni qué era «un servidor de
                nombres», ni cuál era «ese servidor». */}
            <p className="text-sm leading-relaxed text-tinta">
              <strong>{COMO_FUNCIONA.noEs}</strong>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-tenue">
              {COMO_FUNCIONA.laComparacion}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-tinta">{COMO_FUNCIONA.queCambia}</p>
            <p className="mt-2 text-sm leading-relaxed text-tenue">{COMO_FUNCIONA.elLimite}</p>
          </div>

          {/* 🔴 Va en el aparato del chico, no en el router. El router no ve
              datos móviles, y ahí se cae la señal de madrugada. */}
          <div className="mt-5">
            <p className={etiqueta}>¿En qué aparato?</p>
            <div className="flex flex-wrap gap-2">
              {APARATOS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAparato(a.id)}
                  className={`rounded-md border px-3.5 py-1.5 text-sm transition ${
                    aparato === a.id
                      ? "border-acento bg-acentoSuave text-acento"
                      : "border-borde text-tenue"
                  }`}
                >
                  {a.nombre}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const guia = guiaPara(aparato, perfil.trim() || "TU-PERFIL");
            return (
              <div className="mt-5 rounded-lg border border-borde bg-superficie px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
                  {guia.nombre}
                </p>
                <ol className="mt-3 flex list-decimal flex-col gap-2 pl-4 text-sm leading-relaxed text-tenue">
                  {guia.pasos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>

                {guia.advertencia && (
                  <p className="mt-4 flex gap-2 rounded-md border border-atencion/40 bg-atencionSuave px-3.5 py-3 text-xs leading-relaxed text-tinta">
                    <CircleAlert size={14} className="mt-0.5 shrink-0 text-atencion" />
                    <span>{guia.advertencia}</span>
                  </p>
                )}

                {!perfil.trim() && (
                  <p className="mt-4 border-t border-borde pt-3 text-xs leading-relaxed text-apagado">
                    🔴 Todavía no cargaste un identificador de NextDNS, así que{" "}
                    <strong className="text-tenue">esto no se puede instalar de verdad</strong>: el
                    archivo saldría con un identificador vacío y el aparato quedaría preguntando a
                    otro lado. El sistema te lo dice ahora en vez de darte una instalación que
                    parece hecha y no reporta nada.
                  </p>
                )}

                <p className="mt-4 border-t border-borde pt-3 text-xs leading-relaxed text-tenue">
                  Cuando termines, comprobalo en{" "}
                  <span className="font-mono text-acento">{COMPROBACION}</span> desde ese mismo
                  aparato. <strong className="text-tinta">Acá el error no se ve:</strong> un DNS mal
                  puesto no da ningún cartel, simplemente no llega nada — y no llegar nada se lee
                  igual que estar todo tranquilo.
                </p>
              </div>
            );
          })()}

          {guardado && (
            <p className="mt-5 flex items-center gap-2 rounded-md border border-calma/30 bg-calma/10 px-4 py-3 text-sm text-tinta">
              <Check size={15} className="text-calma" />
              Tu familia quedó cargada. La instalación también está en tu panel, cuando la
              necesites.
            </p>
          )}
        </section>
      )}

      {/* ── La navegación ───────────────────────────────────────────────── */}
      {error && (
        <p className="mt-6 flex items-center gap-2 text-sm text-riesgo">
          <CircleAlert size={14} /> {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-borde pt-6">
        <button
          type="button"
          onClick={() => setPaso((p) => Math.max(0, p - 1))}
          disabled={paso === 0}
          className="flex items-center gap-2 text-sm text-tenue transition disabled:cursor-not-allowed disabled:text-apagado"
        >
          <ArrowLeft size={14} /> Atrás
        </button>

        {paso < 3 && (
          <button
            type="button"
            onClick={() => setPaso((p) => p + 1)}
            disabled={paso === 1 && faltaElChico}
            className="flex items-center gap-2 rounded-md bg-acento px-5 py-2.5 text-sm font-semibold text-fondo transition disabled:cursor-not-allowed disabled:bg-borde disabled:text-apagado"
          >
            {paso === 1 && faltaElChico ? "Falta el nombre" : "Seguir"}
            <ArrowRight size={14} />
          </button>
        )}

        {paso === 3 && (
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-2 rounded-md bg-acento px-5 py-2.5 text-sm font-semibold text-fondo transition disabled:cursor-not-allowed disabled:bg-borde disabled:text-apagado"
          >
            {guardando ? (
              <>
                <LoaderCircle size={14} className="animate-spin" /> Guardando…
              </>
            ) : (
              <>
                Guardar y ver la instalación <ArrowRight size={14} />
              </>
            )}
          </button>
        )}

        {paso === 4 && (
          <button
            type="button"
            onClick={() => router.push("/mi-familia")}
            className="flex items-center gap-2 rounded-md bg-acento px-5 py-2.5 text-sm font-semibold text-fondo transition"
          >
            Ir a mi panel <ArrowRight size={14} />
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-apagado">
        Familia {familiaId.slice(0, 8)}··· · lo que cargues se puede corregir después desde tu
        panel.
      </p>
    </main>
  );
}
