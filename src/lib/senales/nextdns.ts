/**
 * Fuente de señales: NextDNS (filtro de red real).
 *
 * 📌 Estado: **la puerta está hecha, no está conectada.** No hay cuenta de
 * NextDNS todavía, así que `estado()` devuelve `disponible: false` y el
 * registro cae solo al simulador. Cuando aparezca la cuenta, se completan las
 * dos variables de entorno y esta fuente entra sin tocar nada del motor.
 *
 * La traducción de la analítica de NextDNS a señales queda para cuando haya
 * una cuenta real contra la cual verificar la forma de la respuesta. Escribir
 * ese mapeo a ciegas sería inventar.
 */

import type {
  ConsultaDeSenales,
  EstadoDeFuente,
  FuenteDeSenales,
  SenalDeRed,
} from "./tipos";

const API = "https://api.nextdns.io";

export class FuenteNextDNS implements FuenteDeSenales {
  readonly id = "nextdns" as const;
  readonly nombre = "Filtro de red (NextDNS)";

  private get apiKey() {
    return process.env.NEXTDNS_API_KEY ?? "";
  }

  private get perfil() {
    return process.env.NEXTDNS_PROFILE_ID ?? "";
  }

  async estado(): Promise<EstadoDeFuente> {
    if (!this.apiKey) {
      return { disponible: false, motivo: "Falta NEXTDNS_API_KEY" };
    }
    if (!this.perfil) {
      return { disponible: false, motivo: "Falta NEXTDNS_PROFILE_ID" };
    }

    try {
      const res = await fetch(`${API}/profiles/${this.perfil}`, {
        headers: { "X-Api-Key": this.apiKey },
        cache: "no-store",
      });
      if (!res.ok) {
        return { disponible: false, motivo: `NextDNS respondió ${res.status}` };
      }
      return { disponible: true, detalle: `Perfil ${this.perfil}` };
    } catch {
      return { disponible: false, motivo: "No se pudo contactar a NextDNS" };
    }
  }

  async leer(consulta: ConsultaDeSenales): Promise<SenalDeRed[]> {
    void consulta;
    // Fase 2 con cuenta real: traducir la analítica de NextDNS a los cuatro
    // tipos de señal. Hasta entonces esta fuente no entrega nada, y el registro
    // no la elige porque `estado()` la reporta como no disponible.
    return [];
  }
}
