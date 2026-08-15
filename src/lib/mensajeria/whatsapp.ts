/**
 * Transporte: WhatsApp.
 *
 * 🔴 Límite técnico duro, no una tarea pendiente: mandarle un mensaje a alguien
 * que no escribió primero exige la API oficial de Meta, con verificación de
 * empresa y plantillas aprobadas. Eso no entra en la ventana del concurso.
 *
 * Queda como una opción más del panel de contratación, lista para conectar:
 * el día que haya una cuenta verificada, se completa este archivo y el resto
 * del sistema no se entera.
 */

import type { Envio, EstadoDeTransporte, ResultadoDeEnvio, Transporte } from "./tipos";

export class TransporteWhatsApp implements Transporte {
  readonly canal = "whatsapp" as const;
  readonly nombre = "WhatsApp";

  async estado(): Promise<EstadoDeTransporte> {
    return {
      disponible: false,
      motivo:
        "La API oficial de Meta exige verificación de empresa y plantillas aprobadas.",
    };
  }

  async enviar(_envio: Envio): Promise<ResultadoDeEnvio> {
    void _envio;
    return {
      transporte: this.nombre,
      entregado: false,
      ensayo: false,
      detalle: "WhatsApp saliente no está conectado.",
    };
  }
}
