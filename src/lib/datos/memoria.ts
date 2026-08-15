/**
 * Repositorio en memoria — el modo demo.
 *
 * 🔴 Esto no es un placeholder: es lo que permite que el jurado entre sin
 * cuenta y sin base de datos. Tiene que andar siempre.
 *
 * Se pierde al reiniciar el servidor, y está bien: la familia sembrada se
 * vuelve a armar sola.
 */

import { generarToken } from "@/lib/supabase";
import { exigeVinculacion, generarCodigo } from "./tipos";
import type {
  AdultoResponsable,
  Chico,
  Familia,
  FamiliaCompleta,
  ObservacionDelAdulto,
  Respuesta,
  SenalRegistrada,
} from "./tipos";
import { dentroDe, type AltaDeFamilia, type Repositorio } from "./repositorio";

let contador = 0;
const nuevoId = (prefijo: string) => `${prefijo}-${++contador}`;

/**
 * La familia de demostración.
 *
 * Los nombres son inventados y la pantalla lo dice en todo momento. No se
 * arma un caso realista de una víctima: se muestra el mecanismo.
 */
function sembrar(): {
  familias: Familia[];
  chicos: Chico[];
  adultos: AdultoResponsable[];
} {
  const ahora = new Date().toISOString();
  const familiaId = "familia-demo";

  return {
    familias: [
      {
        id: familiaId,
        nombre: "Familia de demostración",
        token: "demo",
        activo: true,
        creado: ahora,
      },
    ],
    chicos: [
      {
        id: "chico-demo",
        familiaId,
        nombre: "Ana",
        edad: 12,
        genero: "nena",
        // 🔴 Arranca sin vincular a propósito: así se ve el flujo real.
        canal: { tipo: "telegram", destino: "", codigo: "ANA123" },
        activo: true,
        creado: ahora,
      },
    ],
    adultos: [
      {
        id: "adulto-demo-1",
        familiaId,
        nombre: "Mariana",
        vinculo: "madre",
        elegidoPorElChico: false,
        canal: { tipo: "correo", destino: "demo-madre@ejemplo.ar" },
        creado: ahora,
      },
      {
        // 🔑 El segundo adulto lo eligió ella. No es redundancia técnica.
        id: "adulto-demo-2",
        familiaId,
        nombre: "Carla",
        vinculo: "tia_tio",
        elegidoPorElChico: true,
        canal: { tipo: "telegram", destino: "", codigo: "CARLA7" },
        creado: ahora,
      },
    ],
  };
}

export class RepositorioEnMemoria implements Repositorio {
  readonly clase = "memoria" as const;

  private familias: Familia[];
  private chicos: Chico[];
  private adultos: AdultoResponsable[];
  private senales: SenalRegistrada[] = [];
  private respuestas: Respuesta[] = [];
  private observaciones: ObservacionDelAdulto[] = [];

  constructor() {
    const semilla = sembrar();
    this.familias = semilla.familias;
    this.chicos = semilla.chicos;
    this.adultos = semilla.adultos;
  }

  async crearFamilia(alta: AltaDeFamilia): Promise<FamiliaCompleta> {
    const ahora = new Date().toISOString();
    const familia: Familia = {
      id: nuevoId("familia"),
      nombre: alta.nombre,
      token: generarToken(),
      activo: true,
      nextdnsProfileId: alta.nextdnsProfileId,
      notas: alta.notas,
      creado: ahora,
    };

    const chicos: Chico[] = alta.chicos.map((c) => ({
      ...c,
      canal: conCodigo(c.canal),
      id: nuevoId("chico"),
      familiaId: familia.id,
      activo: true,
      creado: ahora,
    }));

    const adultos: AdultoResponsable[] = alta.adultos.map((a) => ({
      ...a,
      canal: conCodigo(a.canal),
      id: nuevoId("adulto"),
      familiaId: familia.id,
      creado: ahora,
    }));

    this.familias.push(familia);
    this.chicos.push(...chicos);
    this.adultos.push(...adultos);

    return { familia, chicos, adultos };
  }

  async familiaPorToken(token: string): Promise<FamiliaCompleta | null> {
    const familia = this.familias.find((f) => f.token === token);
    if (!familia) return null;
    return {
      familia,
      chicos: this.chicos.filter((c) => c.familiaId === familia.id),
      adultos: this.adultos.filter((a) => a.familiaId === familia.id),
    };
  }

  async listarFamilias(): Promise<Familia[]> {
    return [...this.familias].sort((a, b) => b.creado.localeCompare(a.creado));
  }

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    const familia = this.familias.find((f) => f.id === id);
    if (familia) familia.activo = activo;
  }

  async vincularPorCodigo(codigo: string, destino: string) {
    const buscado = codigo.trim().toUpperCase();

    for (const chico of this.chicos) {
      if (chico.canal.codigo === buscado && !chico.canal.vinculado) {
        chico.canal = { ...chico.canal, destino, vinculado: new Date().toISOString() };
        return { quien: "chico" as const, nombre: chico.nombre, familiaId: chico.familiaId };
      }
    }
    for (const adulto of this.adultos) {
      if (adulto.canal.codigo === buscado && !adulto.canal.vinculado) {
        adulto.canal = { ...adulto.canal, destino, vinculado: new Date().toISOString() };
        return { quien: "adulto" as const, nombre: adulto.nombre, familiaId: adulto.familiaId };
      }
    }
    return null;
  }

  async registrarSenales(senales: SenalRegistrada[]): Promise<void> {
    const conocidas = new Set(this.senales.map((s) => s.id));
    this.senales.push(...senales.filter((s) => !conocidas.has(s.id)));
  }

  async senalesDe(chicoId: string, desde: string, hasta: string) {
    return this.senales
      .filter((s) => s.chicoId === chicoId && dentroDe(s.fecha, desde, hasta))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  async registrarRespuesta(r: Omit<Respuesta, "id">): Promise<Respuesta> {
    const respuesta: Respuesta = { ...r, id: nuevoId("respuesta") };
    this.respuestas.push(respuesta);
    return respuesta;
  }

  async respuestasDe(chicoId: string, desde: string, hasta: string) {
    return this.respuestas
      .filter((r) => r.chicoId === chicoId && dentroDe(r.fecha, desde, hasta))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  async registrarObservacion(o: Omit<ObservacionDelAdulto, "id">) {
    const observacion: ObservacionDelAdulto = { ...o, id: nuevoId("observacion") };
    this.observaciones.push(observacion);
    return observacion;
  }

  async observacionesDe(chicoId: string, desde: string, hasta: string) {
    return this.observaciones
      .filter((o) => o.chicoId === chicoId && dentroDe(o.fecha, desde, hasta))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}

/** Le pone código a los canales que exigen que la persona apriete "Iniciar". */
function conCodigo(canal: { tipo: "telegram" | "correo" | "whatsapp"; destino: string }) {
  if (!exigeVinculacion(canal.tipo)) return canal;
  return { ...canal, destino: "", codigo: generarCodigo() };
}
