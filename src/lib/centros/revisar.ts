/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL RELOJ DE LOS CENTROS — 23/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Lo llama `/api/cron/revisar` después de revisar las familias. Por cada centro
 *  activo junta las señales de sus alumnos, las agrega (`patronesDelCentro`) y,
 *  si algo merece llegarle, se lo manda al coordinador por Telegram y lo deja
 *  registrado para su panel.
 *
 *  🔴 **El mismo freno que las familias: con señales SIMULADAS no se avisa
 *  nada.** Sin NextDNS la fuente cae al simulador, y mandarle a una escuela de
 *  verdad un aviso sobre un sitio que nadie visitó sería exactamente lo que el
 *  sistema promete no hacer.
 */

import { repositorio } from "@/lib/datos";
import { TransporteTelegram } from "@/lib/mensajeria";
import { VENTANA_DIAS } from "@/lib/motor";
import { ayudaDeSiempre, comoSeLoNombra, type Pais } from "@/lib/paises";
import { obtenerFuente } from "@/lib/senales";
import { queEsEsteLugar } from "@/lib/senales/categorias";
import type { SenalDeRed } from "@/lib/senales/tipos";
import { alumnosDelCentro, listarCentros, registrarAviso, yaSeAviso } from "./datos";
import {
  ALUMNOS_MINIMOS_EN_EL_CENTRO,
  DIAS_SIN_REPETIR,
  patronesDelCentro,
  textoDelAviso,
  type AlumnoObservado,
} from "./patrones";

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * 🔑 De quién es el material que se nombra, por país. **Organismos oficiales,
 * no contenido nuestro**: AntiGro lo selecciona y lo acerca, no lo produce.
 */
const MATERIAL_POR_PAIS: Record<Pais, string> = {
  ES: "INCIBE (is4k.es) y la Fundación ANAR",
  AR: "el programa «Con Vos en la Web» del Ministerio de Justicia",
};

export interface RevisionDeCentro {
  centro: string;
  motivo: "fuente_simulada" | "pocos_alumnos" | "sin_novedad" | "aviso";
  alumnos: number;
  avisos?: number;
}

export async function revisarCentros(ahora: Date): Promise<RevisionDeCentro[]> {
  const centros = (await listarCentros()).filter((c) => c.activo);
  if (centros.length === 0) return [];

  const { fuente, simulada } = await obtenerFuente("normal");
  const repo = repositorio();
  const desde = new Date(ahora.getTime() - VENTANA_DIAS * DIA_MS).toISOString();
  const hasta = ahora.toISOString();
  const noRepetirDesde = new Date(ahora.getTime() - DIAS_SIN_REPETIR * DIA_MS).toISOString();

  const queEsAfuera = (dominio: string) => {
    const lugar = queEsEsteLugar(dominio);
    return lugar ? { esto: lugar.esto, daLineaBase: lugar.hace === "linea_base" } : null;
  };

  const resultado: RevisionDeCentro[] = [];

  for (const centro of centros) {
    const chicos = await alumnosDelCentro(centro.id);

    if (simulada) {
      resultado.push({ centro: centro.nombre, motivo: "fuente_simulada", alumnos: chicos.length });
      continue;
    }

    const alumnos: AlumnoObservado[] = [];
    const senales: SenalDeRed[] = [];
    for (const chico of chicos) {
      senales.push(...(await fuente.leer({ chicoId: chico.id, desde, hasta })));
      const respuestas = await repo.respuestasDe(chico.id, desde, hasta);
      alumnos.push({
        chicoId: chico.id,
        edad: chico.edad,
        genero: chico.genero,
        conAlerta: respuestas.some((r) => r.clase === "alerta_adultos"),
      });
    }

    const { universo, avisables } = patronesDelCentro(alumnos, senales, queEsAfuera);
    if (avisables.length === 0) {
      resultado.push({
        centro: centro.nombre,
        motivo: universo.chicos < ALUMNOS_MINIMOS_EN_EL_CENTRO ? "pocos_alumnos" : "sin_novedad",
        alumnos: universo.chicos,
      });
      continue;
    }

    const bot = new TransporteTelegram();
    let avisados = 0;
    for (const aviso of avisables) {
      if (await yaSeAviso(centro.id, aviso.hallazgo.dominio, noRepetirDesde)) continue;

      const texto = textoDelAviso({
        centro: centro.nombre,
        aviso,
        ventanaDias: VENTANA_DIAS,
        ayuda: comoSeLoNombra(ayudaDeSiempre("adulto", centro.pais)),
        material: MATERIAL_POR_PAIS[centro.pais],
      });

      /* 🔑 Se registra aunque el coordinador todavía no haya conectado
         Telegram: el panel del centro lo muestra igual, y dice que no salió. */
      let entregado = false;
      if (centro.canalDestino) {
        const envio = await bot.enviar({
          canal: "telegram",
          destino: centro.canalDestino,
          texto,
        });
        entregado = envio.entregado;
      }

      await registrarAviso({
        centroId: centro.id,
        dominio: aviso.hallazgo.dominio,
        alumnos: aviso.hallazgo.chicosQueLoVieron,
        porQue: aviso.porQue,
        texto,
        entregado,
      });
      avisados++;
    }

    resultado.push({
      centro: centro.nombre,
      motivo: avisados > 0 ? "aviso" : "sin_novedad",
      alumnos: universo.chicos,
      avisos: avisados,
    });
  }

  return resultado;
}
