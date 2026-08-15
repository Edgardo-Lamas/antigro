/**
 * Registro de transportes. Único lugar que sabe por dónde puede salir un mensaje.
 *
 * 🔑 Si el canal que pidió la familia no está configurado, NO se cambia de
 * canal por las suyas: se usa el transporte de ensayo y queda dicho. Cambiarle
 * el canal a alguien sin avisar es peor que no mandar.
 */

import type { CanalTipo } from "@/lib/datos/tipos";
import { TransporteCorreo } from "./correo";
import { TransporteDeEnsayo } from "./ensayo";
import { TransporteTelegram } from "./telegram";
import { TransporteWhatsApp } from "./whatsapp";
import type { EstadoDeTransporte, Transporte } from "./tipos";

export * from "./tipos";
export * from "./avisar";
export { TransporteTelegram } from "./telegram";
export { TransporteCorreo } from "./correo";
export { TransporteWhatsApp } from "./whatsapp";
export { TransporteDeEnsayo } from "./ensayo";

function real(canal: CanalTipo): Transporte {
  switch (canal) {
    case "telegram":
      return new TransporteTelegram();
    case "correo":
      return new TransporteCorreo();
    case "whatsapp":
      return new TransporteWhatsApp();
  }
}

/** El transporte que corresponde, o el de ensayo con el motivo a la vista. */
export async function transporteDe(canal: CanalTipo): Promise<Transporte> {
  const candidato = real(canal);
  const estado = await candidato.estado();
  if (estado.disponible) return candidato;
  return new TransporteDeEnsayo(canal, estado.motivo);
}

/** Estado de todos los canales, para mostrarlo sin disimular nada. */
export async function estadoDeLosCanales(): Promise<
  { canal: CanalTipo; nombre: string; estado: EstadoDeTransporte }[]
> {
  const transportes: Transporte[] = [
    new TransporteTelegram(),
    new TransporteCorreo(),
    new TransporteWhatsApp(),
  ];
  return Promise.all(
    transportes.map(async (t) => ({
      canal: t.canal,
      nombre: t.nombre,
      estado: await t.estado(),
    })),
  );
}
