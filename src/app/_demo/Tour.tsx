"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL TOUR — carteles cortos, paso a paso. Pedido por Edgardo el 17/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Textual: *"hacer una guía de varios pasos con unos carteles, cortitos, los
 *  veo en algunas herramientas"*.
 *
 *  🔑 **Resuelve un problema que la guía no resuelve.** La guía (`/guia`) es para
 *  leer; esto es para el que ya está mirando la pantalla y no sabe qué está
 *  mirando. Son dos momentos distintos y por eso son dos cosas distintas.
 *
 *  🔴 **Cortitos de verdad, y hay un tope que lo obliga.** Un cartel de tour que
 *  hay que leer con ganas es un cartel que se cierra sin leer. `LARGO_MAXIMO`
 *  no es una sugerencia de estilo: si un texto no entra, el problema es el
 *  texto. Hay una comprobación que lo verifica.
 *
 *  ⚠ **Se puede cerrar en cualquier momento, y no vuelve.** Queda anotado en el
 *  navegador. Un tour que reaparece cada vez que entrás es exactamente lo que
 *  hace que la gente odie los tours.
 *
 *  📌 Apunta a elementos reales por `id`. Si un `id` no está en la página, ese
 *  paso se saltea solo en vez de señalar el vacío — la consola cambia y este
 *  archivo no tiene por qué romperse con ella.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Compass, X } from "lucide-react";
/* El texto de los carteles vive aparte: es contenido, y así se puede probar
   con node pelado, que no lee `.tsx`. */
import { PASOS } from "./pasos-del-tour";

const YA_LO_VI = "antigro:tour-visto";

/**
 * 🔑 El botón de «volver a verla» y el tour se hablan por un evento del
 * navegador. Es más liviano que un contexto para lo único que tienen que
 * compartir —«arrancá de nuevo»— y deja que el botón viva donde convenga en la
 * página sin arrastrar al tour con él.
 */
const VOLVER_A_VER = "antigro:tour-de-nuevo";

export default function Tour() {
  const [paso, setPaso] = useState<number | null>(null);
  const [caja, setCaja] = useState<DOMRect | null>(null);

  /* Arranca solo la primera vez. ⚠ En un `useEffect` y no en el estado inicial:
     `localStorage` no existe en el servidor y romper el render sería peor que
     no tener tour. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(YA_LO_VI)) return;
    /* Un respiro antes de aparecer: encima de una pantalla que todavía se está
       dibujando, el primer cartel apunta a cualquier lado. */
    const id = window.setTimeout(() => setPaso(0), 900);
    return () => window.clearTimeout(id);
  }, []);

  /* Volver a verla desde el botón, aunque ya se haya cerrado. */
  useEffect(() => {
    const deNuevo = () => setPaso(0);
    window.addEventListener(VOLVER_A_VER, deNuevo);
    return () => window.removeEventListener(VOLVER_A_VER, deNuevo);
  }, []);

  const cerrar = useCallback(() => {
    setPaso(null);
    try {
      window.localStorage.setItem(YA_LO_VI, "1");
    } catch {
      /* Si el navegador no deja guardar, el tour vuelve a aparecer la próxima.
         Molesto, no roto: no vale tirar abajo la página por esto. */
    }
  }, []);

  /* Dónde está el elemento del paso actual. Se recalcula al cambiar de paso y
     cuando la ventana se mueve, porque la consola crece y se achica sola. */
  useEffect(() => {
    if (paso === null) return;

    const ubicar = () => {
      const ancla = PASOS[paso]?.ancla;
      const el = ancla ? document.getElementById(ancla) : null;
      setCaja(el ? el.getBoundingClientRect() : null);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    ubicar();
    window.addEventListener("resize", ubicar);
    window.addEventListener("scroll", ubicar, { passive: true });
    return () => {
      window.removeEventListener("resize", ubicar);
      window.removeEventListener("scroll", ubicar);
    };
  }, [paso]);

  /* Escape cierra. Es lo que la gente prueba primero cuando quiere salir. */
  useEffect(() => {
    if (paso === null) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        setPaso((p) => (p === null ? null : p + 1 < PASOS.length ? p + 1 : (cerrar(), null)));
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [paso, cerrar]);

  if (paso === null) return null;
  const actual = PASOS[paso];
  if (!actual) return null;

  const ultimo = paso === PASOS.length - 1;

  /* El cartel va debajo del elemento, salvo que no entre: ahí va arriba. */
  const margen = 12;
  const alto = 150;
  const abajo = caja ? caja.bottom + margen : 0;
  const cabeAbajo = caja ? abajo + alto < window.innerHeight : false;

  const posicion: React.CSSProperties = caja
    ? {
        top: cabeAbajo ? abajo : Math.max(margen, caja.top - alto - margen),
        left: Math.min(Math.max(margen, caja.left), window.innerWidth - 320 - margen),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <>
      {/* El recuadro que señala. Sin fondo oscuro sobre el resto: acá el que
          mira quiere seguir viendo la consola entera, no un agujero. */}
      {caja && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-40 rounded-lg ring-2 ring-acento transition-all duration-300"
          style={{
            top: caja.top - 4,
            left: caja.left - 4,
            width: caja.width + 8,
            height: caja.height + 8,
          }}
        />
      )}

      <div
        role="dialog"
        aria-label={`Paso ${paso + 1} de ${PASOS.length}: ${actual.titulo}`}
        className="fixed z-50 w-[320px] rounded-lg border border-acento/50 bg-superficie px-4 py-3.5 shadow-xl transition-all duration-300"
        style={posicion}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-tinta">{actual.titulo}</p>
          <button
            type="button"
            onClick={cerrar}
            className="-mr-1 -mt-0.5 shrink-0 text-apagado transition hover:text-tinta"
            aria-label="Cerrar la guía"
          >
            <X size={15} />
          </button>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-tenue">{actual.texto}</p>

        <div className="mt-3.5 flex items-center justify-between border-t border-borde pt-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {PASOS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === paso ? "w-4 bg-acento" : "w-1.5 bg-borde"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cerrar}
              className="text-[11px] text-apagado transition hover:text-tenue"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => (ultimo ? cerrar() : setPaso(paso + 1))}
              className="flex items-center gap-1.5 rounded-md bg-acento px-3 py-1.5 text-xs font-semibold text-fondo"
            >
              {ultimo ? "Listo" : "Siguiente"}
              {!ultimo && <ArrowRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * El botón para volver a verla.
 *
 * 📌 Es su propio componente de cliente para que la home pueda seguir siendo un
 * componente de servidor. Lo único que hace es avisar; el tour escucha.
 */
export function BotonDelTour() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(VOLVER_A_VER))}
      className="flex items-center gap-2 rounded-md border border-borde px-4 py-2.5 text-sm font-medium text-tenue transition hover:border-acento hover:text-acento"
    >
      <Compass size={15} />
      Guía rápida
    </button>
  );
}
