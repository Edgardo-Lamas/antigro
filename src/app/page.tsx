import Link from "next/link";
import { BookOpen, LogIn, ScrollText } from "lucide-react";
import { auth } from "@/auth";
import { BAJADA, LO_QUE_CRUZA, PRODUCTO } from "@/lib/config";
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
    <div className="[background:radial-gradient(1200px_600px_at_78%_-10%,theme(colors.acentoSuave),theme(colors.fondo)_60%)]">
      <main className="mx-auto max-w-6xl px-6 pb-16">
        {/* ── NAV ─────────────────────────────────────────────────────────
            🔴 La puerta de la familia va ACÁ ARRIBA, a la vista desde el
            primer segundo. Una pantalla de logueo que no está enlazada en
            ningún lado obliga a saberse una dirección de memoria: es una
            puerta sin picaporte. Quien ya es cliente entra por acá. */}
        <header className="flex flex-wrap items-center justify-between gap-4 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-acento text-xs font-semibold text-acento">
              A
            </span>
            <span className="text-base font-medium tracking-tight text-tinta">{PRODUCTO}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <BotonDelTour />
            <Link
              href="/guia"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-tenue transition hover:bg-superficie hover:text-tinta"
            >
              <BookOpen size={14} />
              Guía
            </Link>
            <a
              href="#probar"
              className="rounded-md px-3 py-2 text-sm text-tenue transition hover:bg-superficie hover:text-tinta"
            >
              Probar
            </a>
            <Link
              href={puerta.destino}
              className="ml-1 flex items-center gap-2 rounded-md border border-acento px-4 py-2 text-sm font-medium text-acento transition hover:bg-acentoSuave"
            >
              <LogIn size={14} />
              {puerta.texto}
            </Link>
          </nav>
        </header>

        {/* ── HERO ────────────────────────────────────────────────────────
            🔑 Cabecera corta: el H1 es la BAJADA real —la misma frase que ya
            usa el `<title>` y la imagen de vista previa—, no una tagline
            nueva inventada para esta pantalla. */}
        <section className="grid items-center gap-12 py-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-borde px-3 py-1.5 text-xs text-tenue">
              <span className="h-1.5 w-1.5 rounded-full bg-acento" aria-hidden />
              Sin leer un solo mensaje
            </div>
            <h1 className="text-balance text-[2.5rem] font-bold leading-[1.05] tracking-tight text-tinta sm:text-5xl">
              {BAJADA}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-tenue">{LO_QUE_CRUZA}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#probar"
                className="rounded-md border border-acento px-5 py-2.5 text-sm font-medium text-acento transition hover:bg-acentoSuave"
              >
                Probarlo ahora
              </a>
              <Link
                href={puerta.destino}
                className="rounded-md border border-borde px-5 py-2.5 text-sm font-medium text-tenue transition hover:border-tenue/60 hover:text-tinta"
              >
                Ponerlo en mi casa
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-apagado">
              <span>Sin registro</span>
              <span aria-hidden>·</span>
              <span>Sin leer chats</span>
              <span aria-hidden>·</span>
              <span>Aviso por Telegram</span>
            </div>
          </div>

          {/* 🔑 Ilustrativa, no en vivo: las tres categorías son reales
              (madrugada, plataforma nueva, evasión del filtro — las mismas
              que ve una señal de red, documentadas en la guía), los números
              son de ejemplo. La consola de abajo es la que manda de verdad. */}
          <div className="rounded-2xl border border-borde bg-superficie p-6 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)]">
            <p className="mb-4 text-xs uppercase tracking-[0.08em] text-apagado">
              Lo que el sistema ve
            </p>
            <div className="space-y-3.5">
              {[
                { label: "02:40 h", ancho: "78%" },
                { label: "chat nuevo", ancho: "54%" },
                { label: "VPN", ancho: "31%" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-tenue">{f.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-fondo">
                    <span
                      className="block h-full rounded-full bg-acento/70"
                      style={{ width: f.ancho }}
                    />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-lg border border-dashed border-borde px-3.5 py-3 text-xs leading-relaxed text-apagado">
              Lo que <strong className="text-tenue">no</strong> ve: texto, fotos, audios, nombres
              de contactos. No hay campo donde guardarlos.
            </p>
          </div>
        </section>

        {/* ── PROBAR ──────────────────────────────────────────────────────
            La demo no está abajo de la landing: la demo ES la home, y esto
            es sólo su encabezado. Quien decide y quien dibuja es `Consola`. */}
        <section id="probar" className="pt-4">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-tinta">
              Probalo con datos de ejemplo
            </h2>
            <span className="text-sm text-apagado">Movés algo, el motor vuelve a leer.</span>
          </div>
          <Consola />
        </section>

        {/* Los carteles cortos, paso a paso. Arranca solo la primera vez y no
            vuelve; el botón de arriba lo trae de nuevo. */}
        <Tour />

        {/* ── LO QUE HAY CONECTADO DETRÁS ────────────────────────────────
            Dice cuándo algo NO está conectado, porque fingir una entrega
            sería lo peor que podría hacer un sistema que pide que se le
            crea. */}
        <section id="tour-fuentes" className="pt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-tinta">
            Qué hay conectado detrás
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fuentes.map((f) => (
              <div key={f.id} className="rounded-xl border border-borde bg-superficie px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-tinta">{f.nombre}</span>
                  <Chip activo={f.estado.disponible} texto={f.estado.disponible ? "activa" : "en espera"} />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-apagado">
                  {f.estado.disponible ? (f.estado.detalle ?? "Disponible") : f.estado.motivo}
                </p>
              </div>
            ))}

            {canales.map((c) => (
              <div key={c.canal} className="rounded-xl border border-borde bg-superficie px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-tinta">{c.nombre}</span>
                  <Chip
                    activo={c.estado.disponible}
                    texto={c.estado.disponible ? "conectado" : "en ensayo"}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-apagado">
                  {c.estado.disponible ? (c.estado.detalle ?? "Conectado") : c.estado.motivo}
                </p>
              </div>
            ))}

            <div className="rounded-xl border border-borde bg-superficie px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-tinta">Base de datos</span>
                <Chip activo={hayBase()} texto={hayBase() ? "conectada" : "demo"} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-apagado">
                {hayBase()
                  ? "Supabase conectada"
                  : "Sin Supabase — el sistema anda igual, en modo demo"}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-apagado">
            Las señales entran por una interfaz única: el motor las pide y no sabe de dónde salen.
            Conectar un filtro de red real es completar dos variables de entorno, sin tocar una
            línea del motor. Ninguna señal tiene campo de contenido — son horarios, volúmenes y
            categorías de dominio. El sistema no lee las conversaciones y no las va a leer.
          </p>
        </section>

        {/* ── PONELO EN TU CASA ───────────────────────────────────────────
            🔴 El texto es real y no el del diseño: acá SÍ se instala algo
            —el perfil de NextDNS en el aparato del chico—, porque es la
            única forma de verlo también fuera del wifi de casa. Decir «sin
            instalar nada» sería falso y contradice la arquitectura entera. */}
        <section className="pt-14">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-degradado-fuerte px-8 py-10 sm:px-11">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Ponelo en tu casa
              </h2>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/85">
                Un código, un bot de Telegram, y un perfil que se instala en el teléfono de tu
                hijo. No leemos ni un mensaje de lo que escribe.
              </p>
            </div>
            <Link
              href={puerta.destino}
              className="shrink-0 whitespace-nowrap rounded-md border border-white/60 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {puerta.texto}
            </Link>
          </div>
        </section>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-borde pt-6">
          {/* 🔑 Al pie y no arriba, a diferencia de la guía: nadie llega a
              AntiGro buscando los términos. Pero tienen que estar enlazados
              desde algún lugar estable, y el pie es donde se los busca. */}
          <Link
            href="/terminos"
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-apagado transition hover:text-acento"
          >
            <ScrollText size={13} aria-hidden />
            Términos de uso
          </Link>

          {/* 🔑 El sello de versión, y no es un adorno de programador.
              El 16/8 se perdió media hora discutiendo si una pantalla estaba
              publicada o no: Vercel deja viva la dirección de CADA deploy, así
              que es facilísimo estar mirando una foto de hace horas y jurar que
              "sigue igual". Con esto se sabe de un vistazo qué se está mirando,
              sin abrir una terminal ni preguntarle a nadie. */}
          <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-apagado">
            <span>versión {version()}</span>
            <span aria-hidden className="text-borde">
              ·
            </span>
            <span>Edgardo Lamas y Sandra Ortellado, para CoderCup AI</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

function Chip({ activo, texto }: { activo: boolean; texto: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        activo ? "bg-acentoSuave text-acento" : "bg-borde text-apagado"
      }`}
    >
      {texto}
    </span>
  );
}
