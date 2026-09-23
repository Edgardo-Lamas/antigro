/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL DISTINTIVO DEL CENTRO — 23/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **Un sello que se puede comprobar, no una imagen que cualquiera copia.**
 *  El centro lo pone en su web y el sello lleva a una página de AntiGro que dice,
 *  en ese momento, si el centro participa o no. Un distintivo que no se puede
 *  verificar es un adorno; uno que se verifica es un compromiso público.
 *
 *  🔴 Si el centro deja de estar activo, la imagen lo dice ("no vigente") y la
 *  página también. No se puede seguir mostrando un compromiso que ya no existe.
 *
 *  Puro: arma el SVG a partir de dos datos, sin base ni red.
 */

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Corta el nombre para que entre en el sello sin salirse del borde. */
function acortar(texto: string, largo: number): string {
  return texto.length > largo ? `${texto.slice(0, largo - 1).trimEnd()}…` : texto;
}

export const ANCHO_DEL_SELLO = 360;
export const ALTO_DEL_SELLO = 104;

export function selloSvg(opciones: { centro: string; vigente: boolean; direccion: string }): string {
  const { centro, vigente, direccion } = opciones;
  const acento = vigente ? "#5B3DF5" : "#7B7D8E";
  const estado = vigente ? "Centro comprometido con la protección digital" : "Distintivo no vigente";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO_DEL_SELLO}" height="${ALTO_DEL_SELLO}" viewBox="0 0 ${ANCHO_DEL_SELLO} ${ALTO_DEL_SELLO}" role="img" aria-label="${escapar(`${estado} · ${centro} · AntiGro`)}">
  <defs>
    <linearGradient id="borde" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${acento}"/>
      <stop offset="1" stop-color="${vigente ? "#0F9BA8" : "#A3A5B4"}"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="${ANCHO_DEL_SELLO - 2}" height="${ALTO_DEL_SELLO - 2}" rx="12" fill="#12132A" stroke="url(#borde)" stroke-width="2"/>
  <g transform="translate(22 22)">
    <path d="M30 2 L54 11 V30 C54 45 44 55 30 60 C16 55 6 45 6 30 V11 Z" fill="none" stroke="url(#borde)" stroke-width="3" stroke-linejoin="round"/>
    ${
      vigente
        ? '<path d="M19 31 L27 39 L42 23" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M21 31 H39" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>'
    }
  </g>
  <text x="96" y="34" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="700" fill="#FFFFFF">AntiGro</text>
  <text x="96" y="54" font-family="Helvetica, Arial, sans-serif" font-size="11.5" fill="#D4D2EA">${escapar(estado)}</text>
  <text x="96" y="74" font-family="Helvetica, Arial, sans-serif" font-size="12.5" font-weight="700" fill="#FFFFFF">${escapar(acortar(centro, 34))}</text>
  <text x="96" y="91" font-family="Menlo, Consolas, monospace" font-size="8.5" fill="#A7A6C6">${escapar(direccion)}</text>
</svg>`;
}

/** Lo que el centro copia y pega en su web. El sello siempre enlaza a su verificación. */
export function codigoParaInsertar(opciones: {
  centro: string;
  paginaDeVerificacion: string;
  imagen: string;
}): string {
  const { centro, paginaDeVerificacion, imagen } = opciones;
  return `<a href="${escapar(paginaDeVerificacion)}" target="_blank" rel="noopener"><img src="${escapar(imagen)}" width="${ANCHO_DEL_SELLO}" height="${ALTO_DEL_SELLO}" alt="${escapar(`${centro} participa en AntiGro`)}"></a>`;
}
