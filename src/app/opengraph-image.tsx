import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LO_QUE_CRUZA, PRODUCTO } from "@/lib/config";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA IMAGEN QUE SE VE AL COMPARTIR EL ENLACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Hasta el 20/8 no había ninguna, y eso importa más de lo que parece
 *  ahora:** el enlace de AntiGro se comparte en WhatsApp para que lo prueben,
 *  y va a ir a LinkedIn con el video del CoderCup. Sin imagen, un enlace se
 *  muestra pelado — un renglón gris— y compite contra publicaciones con foto.
 *  `layout.tsx` declaraba `openGraph` completo **sin `images`**.
 *
 *  🔑 **Se genera con `next/og` en vez de ser un archivo suelto en `public/`, y
 *  eso esquiva de raíz las dos trampas que ya nos costaron tiempo en Sabiduría
 *  para el Corazón:**
 *
 *  1. **El JPEG progressive.** Una imagen correcta —200, `image/jpeg`, 1200×630,
 *     32 KB— se compartía sin foto igual, y la única diferencia con las que
 *     andaban era la codificación. Acá sale **PNG**, donde ese problema no
 *     existe.
 *  2. **El caché envenenado al reemplazarla.** La regla era «al cambiarla se
 *     cambia el NOMBRE», porque WhatsApp y Facebook se quedan con la vieja.
 *     Next le pone a esta URL un hash del contenido: **cambia el archivo y
 *     cambia la URL sola.** Ya no hay que acordarse de nada.
 *
 *  📌 Y hay una tercera razón, propia de este proyecto: el texto sale de
 *  `config.ts`, el mismo lugar del que salen el `<title>` y la descripción. Una
 *  imagen con la bajada escrita a mano se desincroniza el día que se corrija la
 *  bajada, y nadie mira una imagen para ver si envejeció.
 */

export const alt = `${PRODUCTO} — señales de grooming, sin leer un solo mensaje`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** La paleta, copiada de `tailwind.config.ts`. Satori no lee clases de Tailwind. */
const FONDO = "#0D1117";
const BORDE = "#232B36";
const TINTA = "#E6EAEF";
const TENUE = "#8B95A1";
const APAGADO = "#5A6572";
const ACENTO = "#4E9BB9";

/**
 * Las tipografías del sitio, leídas del paquete que ya es dependencia.
 *
 * ⚠ **Si no se pudieran leer, la imagen sale igual** con la tipografía por
 * defecto del generador. Es fea y no es la nuestra, pero una vista previa con
 * la letra equivocada es infinitamente mejor que un build caído el día antes de
 * la entrega — y que un enlace sin foto, que es lo que había.
 */
async function tipografias() {
  const base = join(process.cwd(), "node_modules/geist/dist/fonts");
  try {
    const [bold, regular, mono] = await Promise.all([
      readFile(join(base, "geist-sans/Geist-Bold.ttf")),
      readFile(join(base, "geist-sans/Geist-Regular.ttf")),
      readFile(join(base, "geist-mono/GeistMono-Regular.ttf")),
    ]);
    return [
      { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
      { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "GeistMono", data: mono, weight: 400 as const, style: "normal" as const },
    ];
  } catch (e) {
    console.error("[og] no se pudieron leer las tipografías, sale con la de por defecto:", e);
    return undefined;
  }
}

export default async function Imagen() {
  const fonts = await tipografias();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: FONDO,
          padding: "72px 80px",
          fontFamily: "Geist",
        }}
      >
        {/* ── La marca ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 14, height: 14, background: ACENTO }} />
          <div
            style={{
              display: "flex",
              fontFamily: "GeistMono",
              fontSize: 26,
              letterSpacing: 8,
              color: ACENTO,
            }}
          >
            {PRODUCTO.toUpperCase()}
          </div>
        </div>

        {/* ── Lo que el producto es, en una frase ──────────────────────────
            🔑 Es la MISMA que el `<title>` y la que va en la portada. Que la
            imagen diga otra cosa sería tener dos productos. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              color: TINTA,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              maxWidth: 960,
            }}
          >
            Señales de grooming, sin leer un solo mensaje.
          </div>

          <div style={{ display: "flex", width: 120, height: 3, background: ACENTO, marginTop: 36 }} />

          <div
            style={{
              display: "flex",
              fontSize: 29,
              color: TENUE,
              lineHeight: 1.45,
              marginTop: 32,
              maxWidth: 880,
            }}
          >
            {LO_QUE_CRUZA}
          </div>
        </div>

        {/* ── El pie ────────────────────────────────────────────────────────
            📌 Sólo la dirección. Acá había además «la red · los adultos · las
            estadísticas oficiales», y era la TERCERA vez que la imagen decía lo
            mismo: el titular, la bajada y el pie repetían todos «sin leer un
            solo mensaje» o la lista de entradas. Una vista previa se mira un
            segundo; en un segundo no entran tres frases, y menos la misma. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: `1px solid ${BORDE}`,
            paddingTop: 26,
          }}
        >
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 23, color: APAGADO }}>
            antigro.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
