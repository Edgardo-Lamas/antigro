/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 🔑 El índice de categorías de UT1 (`datos/ut1.bin`, ~47 MB) no lo importa
     ningún módulo: se abre por ruta con `fs`, así que Next no lo ve al rastrear
     las dependencias y no lo subiría al despliegue. Esto se lo dice. Ver
     `src/lib/senales/categorias.ts` y `scripts/construir-ut1.mjs`.

     📌 **Va sólo en las rutas que leen señales, no en todas.** Con `/api/**` el
     archivo se copiaba a las 21 funciones —incluida la de entrar y la del QR—,
     que no tienen nada que ver con esto. */
  experimental: {
    outputFileTracingIncludes: {
      "/api/alertas": ["./datos/ut1.bin"],
      "/api/cron/revisar": ["./datos/ut1.bin"],
      "/api/motor/lectura": ["./datos/ut1.bin"],
      "/api/observatorio": ["./datos/ut1.bin"],
      "/api/mi-familia": ["./datos/ut1.bin"],
      "/api/mi-familia/parte": ["./datos/ut1.bin"],
      "/mi-familia": ["./datos/ut1.bin"],
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
