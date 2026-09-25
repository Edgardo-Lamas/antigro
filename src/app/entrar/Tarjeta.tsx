import { ShieldCheck } from "lucide-react";

/**
 * El marco de las pantallas de la puerta que no son `/entrar`: recuperar la
 * clave y ponerle una nueva (24/9). Es el mismo dibujo que `/entrar`, para que
 * se lea como parte de la misma puerta y no como una página suelta.
 */
export default function Tarjeta({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-borde bg-superficie px-7 py-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-lg bg-acentoSuave">
              <ShieldCheck size={19} className="text-acento" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">AntiGro</p>
            <p className="mt-2 text-base font-semibold text-tinta">{titulo}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-tenue">{bajada}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* 📌 Las mismas clases que `/entrar`. La letra del campo va en 16 px en el
   teléfono: con menos, Safari hace zoom solo al tocarlo y la pantalla queda
   descolocada. Ver el comentario en `/entrar`. */
export const CAMPO =
  "w-full rounded-md border border-borde bg-fondo px-3 py-2.5 text-base text-tinta outline-none focus:border-acento sm:py-2 sm:text-sm";
export const ETIQUETA = "mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-apagado";
export const BOTON =
  "mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-degradado-fuerte px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-borde disabled:text-apagado disabled:opacity-100";
