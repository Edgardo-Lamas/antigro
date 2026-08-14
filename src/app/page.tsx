import { BAJADA, PRODUCTO } from "@/lib/config";
import { hayBase } from "@/lib/supabase";
import {
  estadoDeLasFuentes,
  NOMBRE_DE_SENAL,
  obtenerFuente,
  TIPOS_DE_SENAL,
  type TipoDeSenal,
} from "@/lib/senales";

export const dynamic = "force-dynamic";

const DIAS = 21;

const ESCENARIO = "persistente";

export default async function Home() {
  const fuentes = await estadoDeLasFuentes(ESCENARIO);

  // Prueba de que la interfaz única funciona: se le piden tres semanas de
  // señales a la fuente activa, sin saber cuál es.
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - DIAS * 24 * 60 * 60 * 1000);
  const { fuente, simulada, motivo } = await obtenerFuente(ESCENARIO);
  const senales = await fuente.leer({
    chicoId: "demo",
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  });

  const porTipo = TIPOS_DE_SENAL.map((tipo: TipoDeSenal) => ({
    tipo,
    cantidad: senales.filter((s) => s.tipo === tipo).length,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-borde pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
          CoderCup AI · entrega 23 de agosto de 2026
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-tinta">{PRODUCTO}</h1>
        <p className="mt-3 max-w-xl text-balance text-lg leading-relaxed text-tenue">
          {BAJADA}
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Estado del sistema
        </h2>

        <div className="mt-4 divide-y divide-borde rounded-lg border border-borde bg-superficie">
          {fuentes.map((f) => (
            <div key={f.id} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-tinta">{f.nombre}</p>
                <p className="mt-0.5 text-xs text-apagado">
                  {f.estado.disponible
                    ? (f.estado.detalle ?? "Disponible")
                    : f.estado.motivo}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  f.estado.disponible
                    ? "bg-acentoSuave text-acento"
                    : "bg-borde text-apagado"
                }`}
              >
                {f.estado.disponible ? "activa" : "en espera"}
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
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Entrada de señales · últimos {DIAS} días
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          El motor le pidió tres semanas de señales a la fuente activa sin saber cuál era.
          {simulada ? " Respondió el simulador" : " Respondió el filtro de red"}
          {motivo ? `, porque el filtro real todavía no está conectado (${motivo}).` : "."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {porTipo.map(({ tipo, cantidad }) => (
            <div key={tipo} className="rounded-lg border border-borde bg-superficie px-4 py-4">
              <p className="text-2xl font-semibold tabular-nums text-tinta">{cantidad}</p>
              <p className="mt-1 text-[11px] leading-snug text-apagado">
                {NOMBRE_DE_SENAL[tipo]}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-apagado">
          Ninguna de estas señales dice qué se escribió: son horarios, volúmenes y categorías
          de dominio. El sistema no lee las conversaciones y no las va a leer.
        </p>
      </section>

      <footer className="mt-16 border-t border-borde pt-6">
        <p className="text-xs text-apagado">
          Fase 0 — fundaciones. La lectura, el simulador manejable y las alertas llegan en las
          fases siguientes.
        </p>
      </footer>
    </main>
  );
}
