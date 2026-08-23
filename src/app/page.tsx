import Link from "next/link";
import { BookOpen, LogIn } from "lucide-react";
import { auth } from "@/auth";
import { BAJADA, PRODUCTO } from "@/lib/config";
import { hayBase } from "@/lib/supabase";
import { estadoDeLasFuentes } from "@/lib/senales";
import { estadoDeLosCanales } from "@/lib/mensajeria";
import Consola from "./_demo/Consola";
import Tour, { BotonDelTour } from "./_demo/Tour";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA HOME
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La demo no está abajo de la landing: la demo ES la home.** Un padre y
 *  un jurado quieren lo mismo al entrar — ver el sistema andando, sin cuenta.
 *  Todo lo que esté antes de la consola le roba lugar a eso.
 *
 *  Esta página es sólo la cáscara: el encabezado, la consola y el estado real
 *  de lo que hay conectado detrás. Quien decide y quien dibuja es `Consola`.
 */

export const dynamic = "force-dynamic";

/** El escenario con el que se consulta el estado de las fuentes. No pinta nada. */
const ESCENARIO = "persistente";

/**
 * Qué versión es esta pantalla: el commit y el día en que se publicó.
 *
 * `VERCEL_GIT_COMMIT_SHA` la pone Vercel en cada build. En local no existe, y
 * ahí dice «local» — que también es la respuesta correcta.
 */
/**
 * La puerta, según quién esté mirando.
 *
 * 🔑 Al que ya tiene la sesión abierta no se le vuelve a pedir la contraseña:
 * se lo lleva derecho adentro. Mandar al logueo a alguien que ya está logueado
 * es hacerle dar una vuelta para llegar al mismo lugar, y encima le hace dudar
 * de si su cuenta sigue andando.
 */
async function laPuerta(invitacion: string): Promise<{ texto: string; destino: string }> {
  const sesion = await auth();
  const rol = (sesion?.user as { rol?: string } | undefined)?.rol;

  if (rol === "adulto") return { texto: "Ir a mi familia", destino: "/mi-familia" };
  if (rol === "admin") return { texto: "Ir al panel", destino: "/panel" };

  /* ─────────────────────────────────────────────────────────────────────────
     🔴 EL CÓDIGO DE INVITACIÓN VIAJA DESDE ACÁ — 21/8
     ─────────────────────────────────────────────────────────────────────────

     **El botón mentía, y lo encontró Edgardo por la pregunta correcta:** quería
     mandarle a las psicólogas el enlace del sitio, no la puerta. Decía «Entrar
     o empezar» **siempre**, y abría `/entrar` pelado, que desde el 17/8 sólo
     ofrece el logueo. O sea que prometía «empezar» y llevaba a una pantalla
     donde empezar no se podía, sin una línea que explicara por qué.

     🔑 **Ahora el `?i=…` se propaga.** El que llega con el enlace de invitación
     ve el sistema andando primero —que es el orden que el producto defiende en
     todos lados— y recién después la puerta, con la pestaña de crear cuenta
     donde corresponde.

     🔴 **Y el que llega sin código lee «Entrar a mi familia», que es la verdad
     de lo que le espera.** No es sólo prolijidad: la decisión del 17/8 fue que
     un botón de registro que después rebota *"encima le cuenta al que pasa que
     el registro existe"*. Con esto no se le cuenta nada y tampoco se lo manda
     contra una puerta cerrada. */
  if (invitacion) {
    return { texto: "Entrar o empezar", destino: `/entrar?i=${encodeURIComponent(invitacion)}` };
  }
  return { texto: "Entrar a mi familia", destino: "/entrar" };
}

function version(): string {
  /* ⚠ Va el commit y NADA de fechas. La página es dinámica, así que un
     `new Date()` acá daría la hora de la visita y no la del deploy: diría "hoy"
     aunque estuvieras mirando algo de la semana pasada. Sería exactamente la
     mentira que este sello viene a evitar. */
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { i?: string };
}) {
  const fuentes = await estadoDeLasFuentes(ESCENARIO);
  const canales = await estadoDeLosCanales();
  /* ⚠ El código NO se comprueba acá: sólo se arrastra. Quien decide es
     `/api/alta/hogar`, y tiene que seguir siendo así — una comprobación en la
     pantalla es una comodidad, nunca la cerradura. */
  const puerta = await laPuerta(searchParams?.i?.trim() ?? "");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* 🔴 La puerta de la familia va ACÁ ARRIBA, a la vista desde el primer
          segundo. Una pantalla de logueo que no está enlazada en ningún lado
          obliga a saberse una dirección de memoria, y eso no es una molestia
          de navegación: es una puerta sin picaporte. Quien ya es cliente entra
          por acá y no tiene que aprender nada. */}
      {/* ⚠ Va con el color de identidad y no en gris, y eso NO es decoración.
          El primer intento fue un recuadro `border-borde` con texto `text-tenue`
          —gris sobre gris, arriba de una página larga— y era invisible en la
          práctica aunque estuviera en el HTML. Esta es la puerta por la que
          entra todo el que ya es cliente: si hay que buscarla, está mal hecha. */}
      <div className="flex flex-wrap justify-end gap-2 pb-3">
        {/* 🔑 La guía al lado de la puerta, no escondida en el pie. El que
            llega a evaluar el sistema en diez minutos necesita encontrarla
            sin buscar — igual que el cliente necesita encontrar la puerta. */}
        <BotonDelTour />
        <Link
          href="/guia"
          className="flex items-center gap-2 rounded-md border border-borde px-4 py-2.5 text-sm font-medium text-tenue transition hover:border-acento hover:text-acento"
        >
          <BookOpen size={15} />
          Guía
        </Link>
        <Link
          href={puerta.destino}
          className="flex items-center gap-2 rounded-md bg-degradado px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_-8px_rgba(124,108,240,0.55)] transition hover:opacity-90"
        >
          <LogIn size={15} />
          {puerta.texto}
        </Link>
      </div>

      <header className="pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
          CoderCup AI · entrega 23 de agosto de 2026
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight texto-degradado">{PRODUCTO}</h1>
        <p className="mt-3 max-w-2xl text-balance text-lg leading-relaxed text-tenue">
          {BAJADA}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-apagado">
          Movés los controles y el motor vuelve a leer. No hace falta registrarse.{" "}
          <Link href={puerta.destino} className="text-acento underline">
            Para ponerlo en marcha en tu casa, empezá acá.
          </Link>
        </p>
      </header>

      <Consola />
      {/* Los carteles cortos, paso a paso. Arranca solo la primera vez y no
          vuelve; el botón de arriba lo trae de nuevo. */}
      <Tour />

      {/* ── LO QUE HAY CONECTADO DETRÁS ──────────────────────────────────────
          🔑 Va al pie y no arriba: es la prueba de que la puerta a un filtro
          real está hecha, no la puerta de entrada al producto. Y dice cuándo
          algo NO está conectado, porque fingir una entrega sería lo peor que
          podría hacer un sistema que pide que se le crea. */}
      <section id="tour-fuentes" className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Lo que hay conectado detrás
        </h2>

        <div className="mt-4 divide-y divide-borde rounded-xl border border-borde bg-superficie">
          {fuentes.map((f) => (
            <div key={f.id} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-tinta">{f.nombre}</p>
                <p className="mt-0.5 text-xs text-apagado">
                  {f.estado.disponible ? (f.estado.detalle ?? "Disponible") : f.estado.motivo}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  f.estado.disponible ? "bg-acentoSuave text-acento" : "bg-borde text-apagado"
                }`}
              >
                {f.estado.disponible ? "activa" : "en espera"}
              </span>
            </div>
          ))}

          {canales.map((c) => (
            <div key={c.canal} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-tinta">Canal · {c.nombre}</p>
                <p className="mt-0.5 text-xs text-apagado">
                  {c.estado.disponible ? (c.estado.detalle ?? "Conectado") : c.estado.motivo}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  c.estado.disponible ? "bg-acentoSuave text-acento" : "bg-borde text-apagado"
                }`}
              >
                {c.estado.disponible ? "conectado" : "en ensayo"}
              </span>
            </div>
          ))}

          <div className="flex items-baseline justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-tinta">Base de datos</p>
              <p className="mt-0.5 text-xs text-apagado">
                {hayBase()
                  ? "Supabase conectada"
                  : "Sin Supabase — el sistema anda igual, en modo demo"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                hayBase() ? "bg-acentoSuave text-acento" : "bg-atencionSuave text-atencion"
              }`}
            >
              {hayBase() ? "conectada" : "demo"}
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-apagado">
          Las señales entran por una interfaz única: el motor las pide y no sabe de dónde salen.
          Conectar un filtro de red real es completar dos variables de entorno, sin tocar una línea
          del motor. Ninguna señal tiene campo de contenido — son horarios, volúmenes y categorías
          de dominio. El sistema no lee las conversaciones y no las va a leer.
        </p>
      </section>

      <footer className="mt-12 flex flex-wrap items-baseline justify-between gap-3 border-t border-borde pt-6">
        {/* 🔴 Reescrito el 17/8, misma corrección que en la consola y en la
            guía: «el motor», «un control» y «la IA» son palabras nuestras, no
            del padre que las lee. */}
        <p className="max-w-3xl text-xs leading-relaxed text-apagado">
          Quién decide es el sistema, mirando qué pasó y en qué días. La inteligencia artificial
          sólo lo pone en palabras, y antes de que ese texto salga se revisa que no diga nada que
          el sistema no pueda sostener. Si no pasa esa revisión, sale un texto escrito de antemano.
        </p>

        {/* 🔑 El sello de versión, y no es un adorno de programador.
            El 16/8 se perdió media hora discutiendo si una pantalla estaba
            publicada o no: Vercel deja viva la dirección de CADA deploy, así
            que es facilísimo estar mirando una foto de hace horas y jurar que
            "sigue igual". Con esto se sabe de un vistazo qué se está mirando,
            sin abrir una terminal ni preguntarle a nadie. */}
        <div className="flex shrink-0 items-baseline gap-4">
          {/* 🔑 Al pie y no arriba, a diferencia de la guía: nadie llega a
              AntiGro buscando los términos. Pero tienen que estar enlazados
              desde algún lugar estable, y el pie es donde se los busca. */}
          <Link
            href="/terminos"
            className="font-mono text-[10px] uppercase tracking-wider text-apagado transition hover:text-acento"
          >
            Términos de uso
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-wider text-apagado">
            versión {version()}
          </p>
        </div>
      </footer>

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-apagado">
        Desarrollado por Edgardo Lamas y Sandra Ortellado · para CoderCup AI
      </p>
    </main>
  );
}
