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

let enMemoria: RepositorioEnMemoria | null = null;

export function repositorio(): Repositorio {
  const db = baseDeDatos();
  if (db) return new RepositorioSupabase(db);

  if (!enMemoria) enMemoria = new RepositorioEnMemoria();
  return enMemoria;
}
