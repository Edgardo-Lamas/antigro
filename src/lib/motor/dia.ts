/**
 * El día local, y vive solo en su archivo por una razón concreta.
 *
 * 🔑 **No tiene NINGÚN import**, y es a propósito: las tandas de pruebas corren
 * con node pelado, que no resuelve el alias `@/`. Cualquier módulo que quiera
 * ser probable así no puede colgar de `evaluar.ts`, que arrastra medio sistema.
 * Es la misma razón por la que `terminos.ts` está separado de `legal.ts`.
 *
 * 🔴 **Y por qué es local y no UTC:** en UTC, una señal de las 22 de un martes
 * cae al miércoles. Con eso la línea de tiempo se corre un día entero y la
 * persistencia —que se mide en días— se mide mal.
 */
export function diaLocal(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const mes = `${d.getMonth() + 1}`.padStart(2, "0");
  const dia = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
