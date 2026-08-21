"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { VERSION_DE_LOS_TERMINOS } from "@/lib/legal";
import { DECLARACIONES } from "@/app/terminos/terminos";
import CampoDeClave from "@/components/CampoDeClave";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA PUERTA DE LA FAMILIA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 No es la misma que `/panel/login`. Esa es la de administración; ésta es
 *  la que abre un padre o una madre, muchas veces por primera vez y muchas
 *  veces preocupado. Por eso dice qué es esto antes de pedir nada.
 *
 *  ───────────────────────────────────────────────────────────────────────────
 *  🔴 **ACÁ DECÍA QUE NO HABÍA «CREAR CUENTA», Y ESO CAMBIÓ EL 17/8.**
 *  ───────────────────────────────────────────────────────────────────────────
 *
 *  El comentario viejo argumentaba que un alta trae decisiones que no se toman
 *  en un formulario —quiénes son los adultos, quién el referente de afuera, la
 *  conversación con el chico— y que poner un botón de registro sería prometer un
 *  autoservicio que el producto no tenía.
 *
 *  🔑 **El argumento era correcto y por eso la solución no fue agregar un botón:
 *  fue construir el recorrido.** Edgardo describió la secuencia entera: *"accede
 *  al enlace, elige la suscripción, paga la suscripción y luego el sistema lo
 *  lleva en un recorrido de pantallas para cargar los datos"*. Esas decisiones
 *  no desaparecieron — viven en `/alta`, una por pantalla, con la conversación
 *  con el chico incluida. Lo que se crea acá es sólo la puerta.
 *
 *  📌 Y contesta lo que quedó abierto en la auditoría del 17/8: hasta hoy el
 *  alta no creaba ninguna cuenta y la familia quedaba afuera de su propio panel.
 */

type Modo = "entrar" | "crear";

/** Ver `CLAVE_MINIMA` en la ruta: el largo es lo que sostiene la puerta. */
const CLAVE_MINIMA = 8;

export default function Entrar() {
  /* `useSearchParams` obliga a un límite de Suspense en el build de producción.
     Sin esto, `next build` falla al prerenderizar esta página. */
  return (
    <Suspense fallback={null}>
      <Puerta />
    </Suspense>
  );
}

function Puerta() {
  const router = useRouter();
  const params = useSearchParams();

  /**
   * 🔑 **El código de invitación viaja en el enlace, no lo escribe nadie.**
   * `?i=…` es lo que hace que el enlace que se le pasa al jurado sirva y una
   * dirección pelada no. Ver la ruta `/api/alta/hogar`: sin esto las altas
   * están cerradas.
   *
   * 📌 Y si el enlace lo trae, se abre directamente en «es mi primera vez»: el
   * que llega por ahí viene a empezar, no a entrar.
   */
  const invitacion = params.get("i") ?? "";

  const [modo, setModo] = useState<Modo>(invitacion ? "crear" : "entrar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  /**
   * 🔴 **Sin esto no hay cuenta, y la ruta lo comprueba igual.** La pantalla es
   * una comodidad; el que decide es el servidor. Ver `/api/alta/hogar`.
   */
  const [acepta, setAcepta] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (modo === "crear") {
        const res = await fetch("/api/alta/hogar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          /* 🔑 Viaja la VERSIÓN de los términos, no un `true`. «Aceptó» no
             dice qué aceptó, y el texto va a cambiar. */
          body: JSON.stringify({ email, clave, invitacion, terminos: VERSION_DE_LOS_TERMINOS }),
        });
        const datos = await res.json();
        if (!res.ok) {
          setError(datos.error ?? "No se pudo crear la cuenta.");
          return;
        }
      }

      const res = await signIn("credentials", { email, password: clave, redirect: false });

      /* ─────────────────────────────────────────────────────────────────────
         🔴 EL FRACASO VIAJA EN `error`, NO EN `ok` — arreglado el 20/8
         ─────────────────────────────────────────────────────────────────────

         **Lo encontró Edgardo probando el alta:** *"nunca dijo «email y/o
         contraseña no coinciden» pero debería decirlo"*. Tenía razón, y lo que
         había detrás era peor que un mensaje que falta.

         🔴 **NextAuth v5 devuelve `ok: true` con las credenciales RECHAZADAS.**
         Textual, medido contra esta misma pantalla:

             {"error":"CredentialsSignin","code":"credentials",
              "status":200,"ok":true,"url":null}

         Es un cambio respecto de v4, donde `ok` sí era `false`. Con la
         condición vieja (`if (res?.ok)`) una clave equivocada se daba por
         buena: se hacía `router.push("/mi-familia")`, el middleware rebotaba a
         `/entrar` por no haber sesión, y la persona volvía a ver la pantalla de
         logueo **muda**. Ni un cartel, ni un error en consola. Se leía como que
         el botón no hacía nada.

         🔑 **Por eso ahora manda `error`.** `ok` no se mira más: mintió una vez
         y no hay forma de saber en qué otros casos miente. */
      if (!res?.error) {
        /* 🔑 Recién creada, la familia todavía no tiene chico: va al recorrido,
           no al panel. Un panel vacío no le explica a nadie qué hacer. */
        router.push(modo === "crear" ? "/alta" : "/mi-familia");
        return;
      }

      /* ⚠ Un solo mensaje para las dos fallas —email que no existe y
         contraseña equivocada— a propósito: si dijera cuál de las dos es,
         cualquiera podría averiguar qué direcciones tienen cuenta en un
         sistema que cuida chicos. */
      setError("El email o la contraseña no coinciden.");
    } catch {
      /* 🔴 Acá no había NADA: un `try` con `finally` y sin `catch`. Si el
         pedido se cortaba —el teléfono perdiendo señal, que es exactamente
         donde se usa esto— la excepción se iba por arriba y la pantalla
         quedaba igual de muda que en el caso de arriba. Nunca dejar sin voz al
         que está del otro lado: si algo falla, algo se dice. */
      setError("No pudimos conectar. Fijate la señal y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const campo =
    "w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-tinta outline-none focus:border-acento";
  const etiqueta = "mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-apagado";
  const creando = modo === "crear";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      {/* 🔑 Más ancha al crear: las declaraciones tienen que poder leerse. Una
          columna angosta las parte en cinco renglones cada una y el bloque se
          vuelve un muro que nadie mira. */}
      <div className={`w-full ${creando ? "max-w-md" : "max-w-sm"}`}>
        <div className="rounded-xl border border-borde bg-superficie px-7 py-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-lg bg-acentoSuave">
              <ShieldCheck size={19} className="text-acento" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
              AntiGro
            </p>
            <p className="mt-2 text-base font-semibold text-tinta">
              {creando ? "Poné en marcha el sistema" : "Entrá a tu familia"}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-tenue">
              {creando
                ? "Primero la clave de tu casa. Después el sistema te muestra cómo funciona y te va pidiendo los datos."
                : "Acá están los avisos, los informes y el asistente."}
            </p>
          </div>

          {/* 🔑 **Las dos puertas aparecen SÓLO con el enlace de invitación.**
              El que llega con `?i=…` ve «es mi primera vez» sin buscarlo; una
              dirección pelada muestra únicamente el logueo.

              🔴 No es cosmética: es la misma decisión que la ruta. Ofrecer un
              botón de registro que después va a contestar «este enlace no
              habilita crear una cuenta» sería mandar a la gente contra una
              puerta cerrada, y encima le contaría al que pasa que el registro
              existe. Si la puerta no abre, no se dibuja. */}
          {invitacion && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-borde bg-fondo p-1">
              {(
                [
                  { id: "entrar", texto: "Ya tengo cuenta" },
                  { id: "crear", texto: "Es mi primera vez" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setModo(o.id);
                    setError("");
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    modo === o.id ? "bg-acentoSuave text-acento" : "text-apagado"
                  }`}
                >
                  {o.texto}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={enviar} className="flex flex-col gap-3.5">
            <div>
              <label className={etiqueta} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={campo}
              />
            </div>

            <div>
              <label className={etiqueta} htmlFor="clave">
                Contraseña
              </label>
              {/* 🔑 Con el ojo para verla. En el alta es lo que evita que
                  alguien se quede afuera de su propia casa por un carácter de
                  más: AntiGro no manda correos, así que una clave mal tipeada
                  no se recupera. Ver `CampoDeClave`. */}
              <CampoDeClave
                id="clave"
                value={clave}
                onChange={setClave}
                required
                minLength={creando ? CLAVE_MINIMA : undefined}
                autoComplete={creando ? "new-password" : "current-password"}
              />
              {creando && (
                <p className="mt-1.5 text-xs leading-relaxed text-apagado">
                  {/* 🔴 Corregido el 18/8. Decía «la usan los dos», y Edgardo
                      marcó que eso vale para un matrimonio conviviente y no
                      para padres separados: ahí quién la tiene lo decide el
                      responsable, y la otra casa tiene su PROPIA entrada. */}
                  Al menos {CLAVE_MINIMA} caracteres.{" "}
                  <strong className="text-tenue">Es la clave de esta casa</strong>, no de una
                  persona. Si el chico vive en dos casas, la otra va a tener su propia entrada.
                </p>
              )}
            </div>

            {/* ────────────────────────────────────────────────────────────
                🔴 LA ACEPTACIÓN DE LOS TÉRMINOS — 18/8
                ────────────────────────────────────────────────────────────
                🔑 **Las declaraciones van a la VISTA, no detrás del enlace.**
                Son la única parte del documento que compromete al que lo
                acepta, y esconderlas atrás de un «leí y acepto» las
                convertiría en la letra chica que estos términos no son.
                El documento entero sigue a un clic, en otra pestaña para no
                perder lo escrito.

                📌 Sólo al crear la cuenta. El que ya la tiene, ya aceptó. */}
            {creando && (
              <div className="rounded-lg border border-atencion/40 bg-atencionSuave px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tinta">
                  Antes de empezar, declarás
                </p>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {DECLARACIONES.map((d) => (
                    <li key={d.slice(0, 30)} className="flex gap-2 text-xs leading-relaxed text-tinta">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-atencion" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>

                <label className="mt-3.5 flex cursor-pointer items-start gap-2.5 border-t border-atencion/30 pt-3">
                  <input
                    type="checkbox"
                    checked={acepta}
                    onChange={(e) => setAcepta(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 accent-atencion"
                  />
                  <span className="text-xs leading-relaxed text-tinta">
                    Declaro lo de arriba y acepto los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      className="text-acento underline underline-offset-2"
                    >
                      términos de uso
                    </Link>
                    .
                  </span>
                </label>
              </div>
            )}

            {error && <p className="text-xs leading-relaxed text-riesgo">{error}</p>}

            <button
              type="submit"
              disabled={cargando || (creando && !acepta)}
              className="mt-1 flex items-center justify-center gap-2 rounded-md bg-acento px-4 py-2.5 text-sm font-semibold text-fondo transition disabled:cursor-not-allowed disabled:bg-borde disabled:text-apagado"
            >
              {cargando ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" />{" "}
                  {creando ? "Creando…" : "Entrando…"}
                </>
              ) : creando ? (
                "Crear la clave y empezar"
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-apagado">
          {creando ? (
            <>
              No se cobra nada:{" "}
              <strong className="text-tenue">esto es una demostración del sistema.</strong>
            </>
          ) : (
            <>
              También podés{" "}
              <Link href="/" className="text-acento underline">
                ver cómo funciona
              </Link>{" "}
              sin registrarte.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
