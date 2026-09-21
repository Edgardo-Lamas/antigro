/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HACE CUÁNTO EXISTE ESE SITIO — RDAP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **El segundo dato externo, y el que le faltaba al observatorio.** Un sitio
 *  registrado **hace once días**, con público angosto y actividad de madrugada,
 *  no es el mismo sitio que uno con veinte años. La fecha de alta de un dominio
 *  es pública, gratis y sin cuenta: se pide por RDAP, el protocolo que reemplazó
 *  al WHOIS.
 *
 *  ✅ **Verificado el 21/9 contra la fuente:** `mspy.com` contesta
 *  `registration: 2002-04-20`. Y **`.ar` también contesta** —pasa por una
 *  redirección al registro que corresponda, que `fetch` sigue solo—, lo que
 *  estaba anotado como dudoso desde el 19/9.
 *
 *  ⚠ **Lo que este dato NO es: una acusación.** Todos los sitios fueron nuevos
 *  alguna vez, y el que se registró la semana pasada suele ser la panadería del
 *  barrio. Entra como **contexto de un hallazgo que ya se sostiene por otro
 *  lado** —público anormalmente angosto, aparición simultánea en varios chicos—,
 *  nunca como el hallazgo mismo.
 *
 *  📌 **Y no entra en la ruta de cada señal.** Es una consulta de red: se pide
 *  sólo para los pocos dominios que ya pasaron el filtro del observatorio, y la
 *  respuesta se guarda en memoria porque la fecha de alta no cambia nunca.
 */

/** Por debajo de esto el dominio se considera recién nacido. Seis meses. */
export const DIAS_PARA_SER_NUEVO = 180;

/** Lo que se espera a que conteste el registro antes de seguir sin el dato. */
const ESPERA_MS = 6000;

export interface EdadDelDominio {
  dominio: string;
  /** El que contestó: puede ser el padre del consultado. */
  consultado: string;
  /** Fecha de alta, ISO. */
  registrado: string;
  dias: number;
  nuevo: boolean;
}

/* La fecha de alta de un dominio no cambia: una vez preguntada, no se vuelve a
   preguntar mientras viva el proceso. `null` también se guarda — que un registro
   no conteste tampoco cambia en diez minutos. */
const sabido = new Map<string, EdadDelDominio | null>();

async function preguntar(dominio: string): Promise<EdadDelDominio | null> {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(dominio)}`, {
    redirect: "follow",
    signal: AbortSignal.timeout(ESPERA_MS),
    headers: { "user-agent": "AntiGro/1.0 (+https://antigro.vercel.app)" },
  });
  if (!res.ok) return null;

  const cuerpo = (await res.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
  const alta = cuerpo.events?.find((e) => e.eventAction === "registration")?.eventDate;
  if (!alta) return null;

  const cuando = new Date(alta);
  if (Number.isNaN(cuando.getTime())) return null;

  const dias = Math.floor((Date.now() - cuando.getTime()) / 86_400_000);
  return {
    dominio,
    consultado: dominio,
    registrado: cuando.toISOString(),
    dias,
    nuevo: dias <= DIAS_PARA_SER_NUEVO,
  };
}

/**
 * Hace cuánto está registrado este dominio. `null` si el registro no contesta,
 * si no tiene fecha de alta o si tardó demasiado.
 *
 * ⚠ **Nunca tira.** Un dato externo que se cae no puede voltear la pantalla que
 * lo muestra: el observatorio tiene que poder contestar igual sin él.
 */
export async function edadDelDominio(dominio: string): Promise<EdadDelDominio | null> {
  const limpio = dominio.trim().toLowerCase().replace(/\.$/, "");
  if (sabido.has(limpio)) return sabido.get(limpio) ?? null;

  /* RDAP contesta por el dominio REGISTRABLE: `www.tinder.com` no existe como
     registro, `tinder.com` sí. Se sube hasta encontrarlo, con tope, para no
     terminar preguntando por el dominio de nivel superior. */
  let resto = limpio;
  for (let intento = 0; intento < 3 && resto.includes("."); intento++) {
    try {
      const respuesta = await preguntar(resto);
      if (respuesta) {
        const conOrigen = { ...respuesta, dominio: limpio, consultado: resto };
        sabido.set(limpio, conOrigen);
        return conOrigen;
      }
    } catch {
      /* Tiempo agotado o red caída: se sigue sin el dato. */
    }
    const punto = resto.indexOf(".");
    if (punto < 0) break;
    resto = resto.slice(punto + 1);
  }

  sabido.set(limpio, null);
  return null;
}

/** Cómo se dice, sin adornos y sin acusar a nadie. */
export function comoSeDiceLaEdad(edad: EdadDelDominio): string {
  if (edad.dias < 60) return `el dominio está registrado hace ${edad.dias} días`;
  if (edad.dias < DIAS_PARA_SER_NUEVO) return `el dominio está registrado hace ${Math.floor(edad.dias / 30)} meses`;
  const anios = Math.floor(edad.dias / 365);
  return anios >= 1
    ? `el dominio está registrado hace ${anios} ${anios === 1 ? "año" : "años"}`
    : `el dominio está registrado hace ${Math.floor(edad.dias / 30)} meses`;
}
