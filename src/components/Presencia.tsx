"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA PRESENCIA — dónde vive el asistente. 20/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **La idea es de Edgardo, del 31/8, y son dos decisiones distintas:**
 *  - **Dónde vive** (su punto 2): *"que esté presente siempre que abra el
 *    sistema, atento al requerimiento del padre"*. No es una sección ni un
 *    botón: mientras el padre lee el informe, está ahí, quieto, mirando.
 *  - **Qué forma tiene** (su punto 8): **cuerpo entero, holograma translúcido**,
 *    tipo Cortana. 🔑 Y el motivo no es que sea vistoso: Cortana funciona porque
 *    **está al lado del que decide, nunca delante** — informa y acompaña, no
 *    actúa. Es el rol de AntiGro palabra por palabra: no bloquea, no restringe,
 *    no puede leer.
 *
 *  ➡ **Y cierra el cabo suelto de «¿quién es esa persona?»:** un holograma es
 *  evidentemente una IA y aun así tiene mirada y presencia. Más honesto que un
 *  retrato realista, mucho más cálido que un ícono.
 *
 *  🔴🔴 **LA CARA NO REACCIONA AL RIESGO. Serena y estable SIEMPRE.**
 *  `reglas.ts` controla lo que el asistente *afirma*, y **un gesto preocupado es
 *  una afirmación que ningún control mira.** Por eso `estado` describe qué está
 *  haciendo el asistente —esperando, pensando, hablando— y nunca cómo viene el
 *  chico. Si alguna vez alguien quiere pasarle la lectura acá, ese es el motivo
 *  por el que no se hace.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  ⬜ **LOS CLIPS TODAVÍA NO EXISTEN — son el punto 4 del plan.**
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  Van **cuatro clips pregrabados en bucle** a `public/avatar/`, generados una
 *  sola vez: `reposo` · `escuchando` · `pensando` · `hablando`.
 *  🔴 **Nunca un video por respuesta:** generar al vuelo suma 30-60 s encima de
 *  los ~15 s que el asistente ya tarda. Sin lip-sync real — a este tamaño nadie
 *  lee los labios. 📌 El que más trabaja es `pensando`: convierte la espera en
 *  *"me está pensando la respuesta"*.
 *
 *  **Mientras tanto se dibuja la silueta de abajo**, que es un marcador honesto:
 *  ocupa exactamente el lugar y la medida que va a ocupar el clip, así que el
 *  día que los cuatro archivos estén, se cambia `HAY_CLIPS` a `true` y **no hay
 *  que tocar una sola línea del layout.**
 */

import { useEffect, useState } from "react";

/** 🔜 Pasa a `true` el día que los cuatro clips estén en `public/avatar/`. */
const HAY_CLIPS = false;

export type EstadoDeLaPresencia = "reposo" | "escuchando" | "pensando" | "hablando";

/**
 * `cuerpo` es la franja del monitor: de pie, entero, al costado del informe.
 * `busto` es el teléfono: de cintura para arriba, que es lo que entra.
 */
type Forma = "cuerpo" | "busto";

export default function Presencia({
  estado = "reposo",
  forma = "cuerpo",
  className = "",
}: {
  estado?: EstadoDeLaPresencia;
  forma?: Forma;
  className?: string;
}) {
  /* ⚠ `prefers-reduced-motion` se respeta de verdad: una figura que respira al
     costado de la pantalla es justo lo que molesta a quien pidió que no se
     mueva nada. Se lee en un efecto porque `matchMedia` no existe en el
     servidor y romper el render sería peor. */
  const [quieto, setQuieto] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(mq.matches);
    const alCambiar = (e: MediaQueryListEvent) => setQuieto(e.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  if (HAY_CLIPS) {
    return (
      <video
        key={estado}
        src={`/avatar/${estado}.webm`}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }

  const pensando = estado === "pensando";

  return (
    <div className={`relative h-full w-full ${className}`} aria-hidden>
      {/* ⚠ El `viewBox` termina donde termina la figura y no un píxel después.
          Con aire de sobra abajo, el rótulo «Preguntale» quedaba flotando lejos
          de los pies y no se leía como su etiqueta. */}
      <svg
        viewBox={forma === "cuerpo" ? "0 0 120 212" : "0 0 120 104"}
        fill="none"
        className="h-full w-full"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* La paleta de la casa ya es una paleta de holograma: el degradado
              violeta → cian es la firma de esta versión (ver tailwind.config). */}
          <linearGradient id="presencia-luz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C6CF0" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#35C6D6" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#35C6D6" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="presencia-borde" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9B8FF5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#35C6D6" stopOpacity="0.15" />
          </linearGradient>
          {/* Las rayas horizontales son lo que lo vuelve legible como proyección
              y no como una persona mal dibujada. */}
          <pattern id="presencia-rayas" width="120" height="4" patternUnits="userSpaceOnUse">
            <rect width="120" height="1" fill="#E9ECF3" opacity="0.06" />
          </pattern>
          {/* ⚠ Las rayas van RECORTADAS a la figura. Sin esto el rectángulo del
              patrón se dibuja entero y se ve una caja rayada alrededor del
              cuerpo — que es lo que pasaba en el primer intento. */}
          <clipPath id="presencia-silueta">
            <circle cx="60" cy="26" r="15" />
            <path d="M60 44c-14 0-25 9-27 22l-4 28c-.6 4 2 7 6 7h50c4 0 6.6-3 6-7l-4-28C85 53 74 44 60 44Z" />
            {forma === "cuerpo" && (
              <path d="M35 101h50l-6 92c-.3 5-4 8-9 8H50c-5 0-8.7-3-9-8l-6-92Z" />
            )}
          </clipPath>
        </defs>

        <g className={quieto ? "" : pensando ? "presencia-pensando" : "presencia-respira"}>
          {/* La figura: cabeza, hombros, torso y —en cuerpo entero— las piernas.
              Deliberadamente sin cara: a este tamaño una cara mal resuelta es
              peor que una silueta, y la cara es trabajo del clip. */}
          <circle cx="60" cy="26" r="15" fill="url(#presencia-luz)" stroke="url(#presencia-borde)" strokeWidth="0.8" />
          <path
            d="M60 44c-14 0-25 9-27 22l-4 28c-.6 4 2 7 6 7h50c4 0 6.6-3 6-7l-4-28C85 53 74 44 60 44Z"
            fill="url(#presencia-luz)"
            stroke="url(#presencia-borde)"
            strokeWidth="0.8"
          />
          {forma === "cuerpo" && (
            <path
              d="M35 101h50l-6 92c-.3 5-4 8-9 8H50c-5 0-8.7-3-9-8l-6-92Z"
              fill="url(#presencia-luz)"
              stroke="url(#presencia-borde)"
              strokeWidth="0.6"
              opacity="0.75"
            />
          )}
          <rect
            x="0"
            y="0"
            width="120"
            height={forma === "cuerpo" ? 300 : 150}
            fill="url(#presencia-rayas)"
            clipPath="url(#presencia-silueta)"
          />
        </g>

        {/* El piso de luz: lo que apoya la figura en algún lado en vez de
            dejarla flotando recortada. 📌 Sólo en cuerpo entero — en el busto no
            hay pies que apoyar y una elipse ahí es una mancha. */}
        {forma === "cuerpo" && <ellipse cx="60" cy="204" rx="30" ry="4" fill="#35C6D6" opacity="0.18" />}
      </svg>

      <style jsx>{`
        :global(.presencia-respira) {
          animation: presencia-respira 5.5s ease-in-out infinite;
          transform-origin: 60px 150px;
        }
        :global(.presencia-pensando) {
          animation: presencia-pensando 1.8s ease-in-out infinite;
          transform-origin: 60px 150px;
        }
        @keyframes presencia-respira {
          0%,
          100% {
            opacity: 0.88;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes presencia-pensando {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
