import { BAJADA, PRODUCTO } from "@/lib/config";
import { hayBase } from "@/lib/supabase";
import { estadoDeLasFuentes } from "@/lib/senales";
import { estadoDeLosCanales } from "@/lib/mensajeria";
import Consola from "./_demo/Consola";

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

export default async function Home() {
  const fuentes = await estadoDeLasFuentes(ESCENARIO);
  const canales = await estadoDeLosCanales();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
          CoderCup AI · entrega 23 de agosto de 2026
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-tinta">{PRODUCTO}</h1>
        <p className="mt-3 max-w-2xl text-balance text-lg leading-relaxed text-tenue">
          {BAJADA}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-apagado">
          Movés los controles y el motor vuelve a leer. No hace falta registrarse.
        </p>
      </header>

      <Consola />

      {/* ── LO QUE HAY CONECTADO DETRÁS ──────────────────────────────────────
          🔑 Va al pie y no arriba: es la prueba de que la puerta a un filtro
          real está hecha, no la puerta de entrada al producto. Y dice cuándo
          algo NO está conectado, porque fingir una entrega sería lo peor que
          podría hacer un sistema que pide que se le crea. */}
      <section className="mt-14">
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

      <footer className="mt-12 border-t border-borde pt-6">
        <p className="max-w-3xl text-xs leading-relaxed text-apagado">
          El motor decide con el registro fechado, la IA lo pone en palabras y un control revisa lo
          que escribió antes de que salga. Si el control no lo aprueba, sale un texto fijo escrito
          de antemano.
        </p>
      </footer>
    </main>
  );
}
