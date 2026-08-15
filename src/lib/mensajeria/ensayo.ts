/**
 * Transporte de ensayo — lo que corre cuando no hay un canal real configurado.
 *
 * 🔴 No finge nada: registra el mensaje entero y devuelve `entregado: false`
 * con `ensayo: true`. Es lo que permite que el jurado vea el sistema completo
 * sin que le lleguen mensajes a nadie, y lo que hace que la demo no dependa
 * de que un proveedor esté de buen humor.
 */

import type { CanalTipo } from "@/lib/datos/tipos";
import type { Envio, EstadoDeTransporte, ResultadoDeEnvio, Transporte } from "./tipos";

export class TransporteDeEnsayo implements Transporte {
  readonly nombre = "Ensayo";

  constructor(
    readonly canal: CanalTipo,
    private motivo: string,
  ) {}

  async estado(): Promise<EstadoDeTransporte> {
    return { disponible: true, detalle: `Ensayo (${this.motivo})` };
  }

  async enviar(envio: Envio): Promise<ResultadoDeEnvio> {
    return {
      transporte: `Ensayo · ${envio.canal}`,
      entregado: false,
      ensayo: true,
      detalle: this.motivo,
    };
  }
}
