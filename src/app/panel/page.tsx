import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hayBase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Panel() {
  const sesion = await auth();

  // El middleware ya redirige, pero el panel no depende de eso para cerrarse:
  // una sola línea de defensa es una línea de más para equivocarse.
  if (!sesion?.user) redirect("/panel/login");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-borde pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
          Panel
        </p>
        <h1 className="mt-3 text-2xl font-bold text-tinta">
          Hola, {sesion?.user?.name ?? "invitado"}
        </h1>
        <p className="mt-2 text-sm text-tenue">
          {hayBase()
            ? "Supabase conectada."
            : "Modo demo: no hay Supabase configurada, así que nada de lo que se cargue acá se guarda."}
        </p>
      </header>

      <section className="mt-8 rounded-lg border border-borde bg-superficie px-5 py-5">
        <p className="text-sm text-tenue">
          El alta de familias —chicos con edad y género, dos adultos responsables como mínimo
          y el canal de cada uno— entra en la fase 1.
        </p>
      </section>
    </main>
  );
}
