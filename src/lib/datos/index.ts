/**
 * Elige el repositorio. Único lugar del sistema que sabe si hay base o no.
 *
 * En memoria el repositorio tiene que ser uno solo por proceso, si no cada
 * pedido arrancaría con la familia sembrada de cero y se perdería lo que se
 * cargó recién.
 */

import { baseDeDatos } from "@/lib/supabase";
import { RepositorioEnMemoria } from "./memoria";
import { RepositorioSupabase } from "./supabase";
import type { Repositorio } from "./repositorio";

export * from "./tipos";
export * from "./repositorio";

/**
 * 🔴 El repositorio en memoria va colgado de `globalThis`, no de una variable
 * de módulo.
 *
 * Motivo, y costó encontrarlo: Next le puede dar a cada ruta su propia copia
 * del módulo (y en desarrollo lo recarga en cada cambio). Con una variable de
 * módulo, el webhook vinculaba a una persona en SU memoria y la página de la
 * familia seguía viéndola sin vincular — dos endpoints, dos verdades distintas.
 */
const CLAVE = Symbol.for("antigro.repositorio.memoria");
type Global = typeof globalThis & { [CLAVE]?: RepositorioEnMemoria };

export function repositorio(): Repositorio {
  const db = baseDeDatos();
  if (db) return new RepositorioSupabase(db);

  const g = globalThis as Global;
  if (!g[CLAVE]) g[CLAVE] = new RepositorioEnMemoria();
  return g[CLAVE];
}
