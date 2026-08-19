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
  TurnoDeCharla,
} from "./tipos";
import {
  dentroDe,
  type AltaDeFamilia,
  type DatosDeLaFamilia,
  type Repositorio,
  type ResultadoDeAlta,
} from "./repositorio";

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
        // 🔑 La que entra al panel. La familia sembrada tiene un solo
        // progenitor a propósito: es el caso que el sistema trataba como
        // incompleto hasta el 17/8, y ahora tiene que verse bien.
        rol: "progenitor",
        elegidoPorElChico: false,
        canal: { tipo: "correo", destino: "demo-madre@ejemplo.ar" },
        activo: true,
        creado: ahora,
      },
      {
        // 🔑 El segundo adulto lo eligió ella. No es redundancia técnica.
        id: "adulto-demo-2",
        familiaId,
        nombre: "Carla",
        vinculo: "tia_tio",
        // 🔴 Referente: recibe los avisos y sabe que está en el sistema, pero
        // NO entra al panel. El informe del chico es de los padres.
        rol: "referente",
        elegidoPorElChico: true,
        canal: { tipo: "telegram", destino: "", codigo: "CARLA7" },
        activo: true,
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
  /* ⚠ Se pierde al reiniciar, como todo lo demás de este repositorio. En el
     modo demo eso está bien; en producción hay base y la charla persiste. */
  private charla: TurnoDeCharla[] = [];

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
      activo: true,
      creado: ahora,
    }));

    this.familias.push(familia);
    this.chicos.push(...chicos);
    this.adultos.push(...adultos);

    return { familia, chicos, adultos };
  }

  /**
   * ───────────────────────────────────────────────────────────────────────────
   *  🔴 ACÁ EL MODO DEMO SE PLANTA, Y ES LO ÚNICO QUE HACE
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Todo lo demás de este repositorio anda sin base: el motor lee, el panel
   * muestra, el asistente contesta. **Una credencial, no.** Guardarla acá sería
   * prometer una cuenta que no sobrevive al próximo reinicio del servidor —y,
   * peor, `auth.ts` no la miraría: sin base sólo abre la cuenta de
   * administración del entorno.
   *
   * 🔑 **Por eso devuelve `sin_base` en vez de fingir que anduvo.** Es la misma
   * regla que el límite de frecuencia: dejar pasar está bien, hacerlo en
   * silencio no. La pantalla lo dice con todas las letras.
   */
  async crearHogar(): Promise<ResultadoDeAlta> {
    return { ok: false, motivo: "sin_base" };
  }

  async cargarDatosDeLaFamilia(
    familiaId: string,
    datos: DatosDeLaFamilia,
  ): Promise<FamiliaCompleta> {
    const familia = this.familias.find((f) => f.id === familiaId);
    if (!familia) throw new Error("La familia no existe");
    if (datos.nombre?.trim()) familia.nombre = datos.nombre.trim();

    const ahora = new Date().toISOString();

    // Los chicos se reemplazan; los adultos se dan de baja blanda. El porqué
    // de la diferencia está en `cargarDatosDeLaFamilia` del contrato.
    this.chicos = this.chicos.filter((c) => c.familiaId !== familiaId);
    for (const a of this.adultos) {
      if (a.familiaId === familiaId && a.activo) {
        a.activo = false;
        a.bajaEn = ahora;
        a.bajaMotivo = "otro";
      }
    }

    this.chicos.push(
      ...datos.chicos.map((c) => ({
        ...c,
        canal: conCodigo(c.canal),
        id: nuevoId("chico"),
        familiaId,
        activo: true,
        creado: ahora,
      })),
    );

    this.adultos.push(
      ...datos.adultos.map((a) => ({
        ...a,
        canal: conCodigo(a.canal),
        id: nuevoId("adulto"),
        familiaId,
        activo: true,
        creado: ahora,
      })),
    );

    return this.completar(familia)!;
  }

  async familiaPorToken(token: string): Promise<FamiliaCompleta | null> {
    return this.completar(this.familias.find((f) => f.token === token));
  }

  async familiaPorId(id: string): Promise<FamiliaCompleta | null> {
    return this.completar(this.familias.find((f) => f.id === id));
  }

  /** Le cuelga los chicos y los adultos. Lo único que cambia es cómo se buscó. */
  private completar(familia: Familia | undefined): FamiliaCompleta | null {
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

  async darDeBajaAdulto(
    familiaId: string,
    adultoId: string,
    motivo: AdultoResponsable["bajaMotivo"] & string,
  ): Promise<AdultoResponsable | null> {
    const adulto = this.adultos.find((a) => a.id === adultoId && a.familiaId === familiaId);
    if (!adulto) return null;

    adulto.activo = false;
    adulto.bajaEn = new Date().toISOString();
    adulto.bajaMotivo = motivo;
    return adulto;
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

  /** Un solo uso: si ya tiene fecha, el segundo toque no escribe nada. */
  async marcarAcuse(token: string, cuando: string): Promise<Respuesta | null> {
    const aviso = this.respuestas.find((r) => r.acuseToken === token && !r.acusadoEn);
    if (!aviso) return null;
    aviso.acusadoEn = cuando;
    return aviso;
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

  async guardarCharla(turnos: Omit<TurnoDeCharla, "id">[]): Promise<void> {
    this.charla.push(...turnos.map((t) => ({ ...t, id: nuevoId("turno") })));
  }

  async charlaDe(familiaId: string, limite: number) {
    // El orden es el de inserción, que acá es exactamente el cronológico.
    // 🔴 Es de la familia, no de cada adulto: entre padres no hay privacidad.
    return this.charla.filter((t) => t.familiaId === familiaId).slice(-limite);
  }

  async borrarCharla(familiaId: string): Promise<void> {
    this.charla = this.charla.filter((t) => t.familiaId !== familiaId);
  }
}

/** Le pone código a los canales que exigen que la persona apriete "Iniciar". */
function conCodigo(canal: { tipo: "telegram" | "correo" | "whatsapp"; destino: string }) {
  if (!exigeVinculacion(canal.tipo)) return canal;
  return { ...canal, destino: "", codigo: generarCodigo() };
}
