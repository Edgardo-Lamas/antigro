import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MINIMO_ADULTOS, repositorio } from "@/lib/datos";

export const dynamic = "force-dynamic";

export default async function Panel() {
  const sesion = await auth();

  // El middleware ya redirige, pero el panel no depende de eso para cerrarse:
  // una sola línea de defensa es una línea de más para equivocarse.
  if (!sesion?.user) redirect("/panel/login");

  const repo = repositorio();
  const familias = await repo.listarFamilias();
  const enMemoria = repo.clase === "memoria";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-borde pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">Panel</p>
        <h1 className="mt-3 text-2xl font-bold text-tinta">
          Hola, {sesion.user.name ?? "invitado"}
        </h1>
        <p className="mt-2 text-sm text-tenue">
          {enMemoria
            ? "Modo demo: sin Supabase, lo que se cargue vive hasta que se reinicie el servidor."
            : "Supabase conectada."}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Familias
        </h2>

        <ul className="mt-4 divide-y divide-borde rounded-lg border border-borde bg-superficie">
          {familias.map((f) => (
            <li key={f.id} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-tinta">{f.nombre}</p>
                <Link
                  href={`/familia/${f.token}`}
                  className="mt-0.5 block truncate font-mono text-xs text-acento hover:underline"
                >
                  /familia/{f.token}
                </Link>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  f.activo ? "bg-acentoSuave text-acento" : "bg-borde text-apagado"
                }`}
              >
                {f.activo ? "activa" : "pausada"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-borde bg-superficie px-5 py-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
          Qué exige un alta
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-tenue">
          <li>Al menos un chico, con su edad y su género — son datos del motor.</li>
          <li>
            Al menos {MINIMO_ADULTOS} adultos responsables, cada uno con su canal.
          </li>
          <li>
            Que <strong className="text-tinta">uno de los adultos lo elija el chico</strong>. El
            43% no habla de estos temas con sus padres: el segundo adulto no es redundancia
            técnica, es alguien a quien de verdad le va a escribir.
          </li>
          <li>El canal del chico, separado del de los adultos.</li>
        </ul>
        <p className="mt-4 border-t border-borde pt-3 text-xs text-apagado">
          El formulario de alta se arma en la fase 4. Hoy el alta entra por{" "}
          <code className="text-tenue">POST /api/panel/familias</code>, que ya valida todo esto.
        </p>
      </section>
    </main>
  );
}
