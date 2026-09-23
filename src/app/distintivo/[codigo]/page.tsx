import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldOff } from "lucide-react";
import { centroPorDistintivo } from "@/lib/centros/datos";
import { PRODUCTO } from "@/lib/config";
import { NOMBRE_DEL_PAIS } from "@/lib/paises";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA VERIFICACIÓN DEL DISTINTIVO — pública, sin cuenta
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Es adonde lleva el sello que el centro pone en su web. Contesta una sola
 *  pregunta —¿este centro participa de verdad?— y dice qué significa eso y qué
 *  NO significa.
 *
 *  🔴 **No muestra ningún número del centro**: ni familias, ni avisos, ni
 *  alumnos. Cuántas familias sumó una escuela no es asunto de quien pasa por su
 *  web, y con pocas familias sería casi señalarlas.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { codigo: string } }) {
  const centro = await centroPorDistintivo(params.codigo);
  return {
    title: centro ? `${centro.nombre} · distintivo ${PRODUCTO}` : `Distintivo ${PRODUCTO}`,
    robots: { index: false },
  };
}

export default async function Distintivo({ params }: { params: { codigo: string } }) {
  const centro = await centroPorDistintivo(params.codigo);
  if (!centro) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
        {PRODUCTO} · verificación de distintivo
      </p>

      <section
        className={`mt-6 rounded-xl border px-6 py-6 ${
          centro.activo ? "border-acento/50 bg-acentoSuave" : "border-borde bg-superficie"
        }`}
      >
        <div className="flex items-center gap-3">
          {centro.activo ? (
            <BadgeCheck size={26} className="shrink-0 text-acento" />
          ) : (
            <ShieldOff size={26} className="shrink-0 text-apagado" />
          )}
          <div>
            <h1 className="text-xl font-bold text-tinta">{centro.nombre}</h1>
            <p className="mt-0.5 text-sm text-tenue">{NOMBRE_DEL_PAIS[centro.pais]}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-tinta">
          {centro.activo
            ? `Este centro participa en ${PRODUCTO} y el distintivo está vigente hoy.`
            : `Este distintivo no está vigente: el centro no participa en ${PRODUCTO} en este momento.`}
        </p>
      </section>

      {centro.activo && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">
            Qué significa
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-tenue">
            <li>
              El centro ofrece a sus familias {PRODUCTO}, un sistema de alerta temprana contra la
              captación de menores en internet que no lee mensajes, fotos ni conversaciones.
            </li>
            <li>
              El centro recibe avisos cuando un mismo sitio que merece atención aparece entre
              varios de sus alumnos, siempre como un número, y actúa hacia toda su comunidad.
            </li>
            <li>
              El centro nunca accede a los datos de ningún alumno ni de ninguna familia.
            </li>
          </ul>
        </section>
      )}

      <p className="mt-10 border-t border-borde pt-4 text-xs leading-relaxed text-apagado">
        Esta página la genera {PRODUCTO} en el momento en que se abre: si el centro deja de
        participar, lo dice aquí y en el sello.{" "}
        <Link href="/" className="underline decoration-borde underline-offset-4 hover:text-acento">
          Qué es {PRODUCTO}
        </Link>
      </p>
    </main>
  );
}
