import type { Config } from "tailwindcss";

/**
 * Paleta AntiGro.
 *
 * El producto habla de algo grave sin gritar. Un sistema que alarma todo el
 * tiempo se apaga a la semana. Por eso el color de alerta es ámbar y no rojo
 * de pánico, y el fondo es sobrio: cuando el sistema se calla, la pantalla
 * también tiene que estar callada.
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
        fondo: "#0D1117",
        superficie: "#151B23",
        borde: "#232B36",
        tinta: "#E6EAEF",
        tenue: "#8B95A1",
        apagado: "#5A6572",
        /** Identidad. Sereno a propósito. */
        acento: "#4E9BB9",
        acentoSuave: "#16303B",
        /** El sistema está hablando. */
        atencion: "#D08A3E",
        atencionSuave: "#33270F",
        /** Riesgo sostenido. Terracota, no rojo de emergencia. */
        riesgo: "#C4553D",
        riesgoSuave: "#331813",
        /** Todo en orden. */
        calma: "#5E9C76",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
