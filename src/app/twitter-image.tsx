/**
 * La misma imagen para X/Twitter.
 *
 * 🔑 **Se reexporta, no se copia.** Dos archivos que dibujan lo mismo se
 * desincronizan el día que se corrija uno — que es exactamente el error que
 * esta imagen evita al sacar el texto de `config.ts` en vez de escribirlo a
 * mano.
 *
 * 📌 Existe igual, en vez de dejar que X caiga en `og:image`, porque el
 * `summary_large_image` de `layout.tsx` necesita una imagen declarada para
 * mostrarse grande. Sin esto sale la tarjeta chica.
 */
export { default, alt, size, contentType } from "./opengraph-image";
