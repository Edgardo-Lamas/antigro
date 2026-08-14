# AntiGro

Percibe señales de que un chico puede estar siendo acosado en internet, **sin leer un solo
mensaje suyo**. Cruza lo que ve la red, lo que observan los adultos y lo que dicen las
estadísticas oficiales sobre qué pesa cuánto.

Proyecto para el **CoderCup AI de Coderhouse** — entrega 23 de agosto de 2026.

La especificación completa —reglas innegociables, modelo de datos, mensajes por banda de edad,
estadísticas con fuente— está en [`CLAUDE.md`](./CLAUDE.md).

---

## Arrancar

```bash
npm install
cp .env.example .env.local     # completar lo que haga falta
npm run dev                    # http://localhost:3000
```

**Anda sin configurar nada.** Sin Supabase y sin NextDNS el sistema entra en modo demo: la
fuente de señales es el simulador y el panel se abre con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Eso es a propósito — el jurado tiene que poder entrar sin cuenta.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | `tsc --noEmit` — correr antes de cada commit |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |

## Rutas

| Ruta | Quién entra | Estado |
|---|---|---|
| `/` | Cualquiera | Estado del sistema y prueba de la entrada de señales |
| `/familia/[token]` | Los adultos responsables, **sin cuenta**, con su enlace privado | Señales crudas de 21 días |
| `/panel` | Cuenta, protegido por NextAuth | Alta de familias — fase 1 |

## Cómo entran los datos

`src/lib/senales/` es la interfaz única. El motor pide señales y **no sabe de dónde salen**:

- `tipos.ts` — qué es una señal. No tiene campo de contenido y no lo va a tener.
  `sanearContexto()` tira una excepción si alguien intenta colar texto de conversaciones.
- `simulador.ts` — la fuente de hoy. Determinista: el mismo escenario da siempre la misma
  curva, que es lo que permite filmar dos veces la misma toma.
- `nextdns.ts` — la puerta para un filtro real. Hoy se reporta como no disponible.
- `index.ts` — elige la fuente. Prioriza el filtro real y cae al simulador diciéndolo.

Conectar un NextDNS real el día de mañana es completar dos variables de entorno. El motor no
se toca.
