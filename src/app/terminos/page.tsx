import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import { PRODUCTO } from "@/lib/config";
import { norma } from "@/lib/legal";
import { SECCIONES, VERSION } from "./terminos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS TÉRMINOS DE USO — pedidos por Edgardo el 18/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Están escritos para leerse, y esa es la decisión de diseño.** Unos
 *  términos que nadie lee no protegen a nadie: si el que acepta no entendió qué
 *  aceptó, lo único que queda es un tilde. Por eso acá no hay bloque de texto
 *  corrido en cuerpo 9, ni «EL USUARIO RECONOCE Y ACEPTA».
 *
 *  🔑 **Y hay un motivo de producto además del legal.** Todo AntiGro está
 *  construido sobre decir dónde termina. Un control parental común se reserva
 *  en sus términos el derecho a leer todo; acá dice que no se lee nada, con la
 *  ley al lado. Esta página es el lugar donde eso se puede verificar.
 *
 *  📌 El texto vive en `terminos.ts` y las normas en `src/lib/legal.ts`. Acá
 *  sólo está cómo se ve.
 */

export const metadata = {
  title: `Términos de uso de ${PRODUCTO}`,
  description:
    "Qué hace el sistema, qué no hace nunca, quién puede dar de alta a un chico y qué queda registrado.",
};

/** Una norma citada, con su texto y el enlace a la fuente. */
function Norma({ id }: { id: string }) {
  const n = norma(id);
  return (
    <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-acento">
        {n.norma} · {n.articulo}
      </p>
      <p className="mt-1 text-sm font-medium text-tinta">{n.titulo}</p>
      {/* 🔑 Textual y entre comillas: que se vea que es la ley hablando y no
          nosotros parafraseando. */}
      <p className="mt-2 border-l-2 border-borde pl-3 text-sm italic leading-relaxed text-tenue">
        «{n.texto}»
      </p>
      <a
        href={n.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs text-tenue underline decoration-borde underline-offset-4 transition hover:text-acento"
      >
        Leer la norma completa
      </a>
    </div>
  );
}

export default function Terminos() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-tenue transition hover:text-acento"
      >
        <ArrowLeft size={14} /> Volver
      </Link>

      <header className="mt-6 border-b border-borde pb-8">
        <div className="flex items-center gap-2.5">
          <ScrollText size={17} className="text-acento" />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
            {PRODUCTO} · términos de uso
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-tinta">
          Qué se puede esperar de {PRODUCTO}, y qué no
        </h1>
        <p className="mt-3 max-w-2xl text-balance text-lg leading-relaxed text-tenue">
          Están escritos para que se entiendan de una sola lectura. Cada vez que hay una ley
          involucrada, está citada con su texto y el enlace a la fuente.
        </p>

        {/* 🔴 Lo primero que se ve, porque es lo que hace distinto a este
            documento y porque es lo honesto: acá no hay una cláusula que nos
            saque de encima el daño. Ver la sección «límites». */}
        <div className="mt-6 rounded-lg border border-acento/40 bg-superficie px-5 py-4">
          <p className="text-sm leading-relaxed text-tinta">
            Acá no vas a encontrar letra chica que nos exima de responsabilidad. No la escribimos
            porque no serviría: la ley de defensa del consumidor tiene por no convenidas esas
            cláusulas. Lo que hay en su lugar es la descripción precisa de qué hace el sistema y
            qué no puede hacer.
          </p>
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-apagado">
          Versión {VERSION}
        </p>
      </header>

      {SECCIONES.map((seccion, i) => (
        <section key={seccion.id} id={seccion.id} className="mt-12">
          <p className="font-mono text-[11px] text-apagado">
            {String(i + 1).padStart(2, "0")}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-tinta">{seccion.titulo}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-acento">{seccion.bajada}</p>

          <div className="mt-4 flex flex-col gap-3">
            {seccion.parrafos.map((p) => (
              <p key={p.slice(0, 40)} className="text-sm leading-relaxed text-tenue">
                {p}
              </p>
            ))}
          </div>

          {/* 🔑 Lo que declara quien acepta va aparte y se ve distinto. Es la
              única parte del documento que compromete al que lo lee, y
              mezclarla con el resto sería convertirla en letra chica —
              exactamente lo que este documento no quiere ser. */}
          {seccion.declaraciones && (
            <div className="mt-5 rounded-lg border border-atencion/40 bg-atencionSuave px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-tinta">
                Al aceptar, declarás
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {seccion.declaraciones.map((d) => (
                  <li key={d.slice(0, 40)} className="flex gap-2.5 text-sm leading-relaxed text-tinta">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-atencion" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {seccion.normas && (
            <div className="mt-5 flex flex-col gap-3">
              {seccion.normas.map((id) => (
                <Norma key={id} id={id} />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="mt-12 flex flex-wrap gap-3 border-t border-borde pt-8">
        <Link
          href="/guia"
          className="rounded-md border border-borde px-5 py-2.5 text-sm font-semibold text-tinta transition hover:border-acento"
        >
          Ver la guía del sistema
        </Link>
        <Link
          href="/"
          className="rounded-md bg-acento px-5 py-2.5 text-sm font-semibold text-fondo transition"
        >
          Ver el sistema funcionando
        </Link>
      </div>
    </main>
  );
}
