"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CAMPO DE CONTRASEÑA, CON EL OJO PARA VERLA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Lo pidió Edgardo el 20/8. **No es una comodidad: es lo que evita quedarse
 *  afuera de la propia casa.** Una clave se escribe a ciegas, y en este producto
 *  se escribe casi siempre desde un teléfono, muchas veces por gente preocupada
 *  y apurada. Un carácter de más en el alta y la persona queda con una cuenta
 *  cuya clave no es la que cree — y no hay forma de recuperarla, porque
 *  **AntiGro no manda correos** (el remitente de Resend no tiene dominio
 *  verificado; Telegram es el único canal real).
 *
 *  🔴 **Por eso está en TODOS los campos de clave y no sólo en el alta.** Los
 *  seis: la puerta de la familia, la de administración, la clave que se le pone
 *  a la otra casa, y las tres de cambiar la clave. Un ojo que aparece en una
 *  pantalla sí y en la otra no se lee como que algo se rompió.
 *
 *  🔑 **Arranca siempre oculta y no se acuerda de nada.** Ver la clave es una
 *  decisión de ese momento y de esa pantalla: si el estado sobreviviera, alguien
 *  volvería al panel en un colectivo con la clave de su casa a la vista.
 *
 *  ⚠ **El botón es `type="button"`.** Adentro de un `<form>`, un botón sin tipo
 *  envía el formulario: tocar el ojo mandaría el alta a medio escribir.
 */

/** El mismo borde y fondo que el resto de los campos del sistema. */
const CAMPO =
  "w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-tinta outline-none focus:border-acento";

interface Props {
  id?: string;
  value: string;
  onChange: (valor: string) => void;
  /**
   * 🔑 `new-password` al crear y `current-password` al entrar. No es un detalle:
   * es lo que hace que el llavero del teléfono ofrezca generar una clave nueva
   * en vez de autocompletar la vieja.
   */
  autoComplete?: "new-password" | "current-password";
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  /** Para etiquetar el campo cuando la pantalla no tiene un `<label>` visible. */
  "aria-label"?: string;
}

export default function CampoDeClave({
  id,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
  "aria-label": etiquetaAccesible,
}: Props) {
  const [visible, setVisible] = useState(false);
  /* Por si el que llama no pasa `id`: el botón necesita apuntar a algo. */
  const propio = useId();
  const idCampo = id ?? propio;

  return (
    <div className="relative">
      <input
        id={idCampo}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={etiquetaAccesible}
        /* `pr-10` deja el lugar del ojo: sin eso una clave larga se escribe
           por debajo del icono y no se ve el final, que es justo lo que este
           campo existe para poder mirar. */
        className={`${CAMPO} pr-10`}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        /* 🔑 La etiqueta dice qué VA A PASAR al tocarlo, no el estado actual.
           «Contraseña visible» obliga a deducir; «Mostrar la contraseña» se
           entiende de una. */
        aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
        aria-pressed={visible}
        aria-controls={idCampo}
        title={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-apagado transition hover:text-tinta focus:outline-none focus-visible:ring-1 focus-visible:ring-acento"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}
