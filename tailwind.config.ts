import type { Config } from "tailwindcss";

/**
 * Paleta AntiGro — v2 (22/8).
 *
 * El producto sigue hablando de algo grave sin gritar: eso NO cambió, y por
 * eso `atencion`, `riesgo` y `calma` —los tres colores que hacen un trabajo
 * semántico real, avisando algo— se mantienen intactos.
 *
 * Lo que sí cambió es la identidad: `fondo` pasa a un navy más profundo y
 * `acento` se separa en dos tonos (`acento` violeta + `acentoDos` cian) para
 * poder armar el degradado que es la firma visual de esta versión, sin
 * perder el tono sereno del original.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: "#0A0E14",
        superficie: "#10151F",
        borde: "#1E2530",
        tinta: "#E9ECF3",
        tenue: "#8B95A1",
        apagado: "#5A6572",
        /** Identidad. El violeta ancla el degradado. */
        acento: "#7C6CF0",
        acentoSuave: "#221C3D",
        /** El segundo extremo del degradado — cian. */
        acentoDos: "#35C6D6",
        acentoDosSuave: "#122A2E",
        /** El sistema está hablando. Intacto: sigue siendo ámbar, no pánico. */
        atencion: "#D08A3E",
        atencionSuave: "#33270F",
        /** Riesgo sostenido. Terracota, no rojo de emergencia. Intacto. */
        riesgo: "#C4553D",
        riesgoSuave: "#331813",
        /** Todo en orden. Intacto. */
        calma: "#5E9C76",
      },
      backgroundImage: {
        /** El degradado de marca — violeta a cian, 90°. Botones (texto oscuro) y títulos. */
        degradado: "linear-gradient(90deg, #7C6CF0 0%, #35C6D6 100%)",
        "degradado-sutil": "linear-gradient(135deg, rgba(124,108,240,0.10) 0%, rgba(53,198,214,0.04) 100%)",
        /** Mismo degradado, oscurecido en los dos extremos. Sólo para los
         *  botones con texto BLANCO encima (home, /entrar, /panel/login):
         *  el cian claro de `degradado` da ~2:1 de contraste con blanco,
         *  por debajo del mínimo de accesibilidad (WCAG AA). Con estos dos
         *  tonos el contraste sube a ~5:1 en los dos extremos. */
        "degradado-fuerte": "linear-gradient(90deg, #6952E0 0%, #0F7A88 100%)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
