# -*- coding: utf-8 -*-
"""Arma el HTML de presentación de AntiGro y lo imprime a PDF con Chrome headless.

🎨 Rediseñado el 2026-08-18 siguiendo `filosofia-de-diseno.md` («Registro Paciente»).
   Edgardo frenó la versión anterior: *"el PDF está bastante feíto, letra muy chica"*.
   Tenía razón, y la causa está documentada: yo venía achicando la tipografía para que
   el contenido entrara en tres carillas. **Eso se acabó como método.**

   🔴 LA REGLA QUE NO SE NEGOCIA: si el contenido no entra, el contenido pasa a otra
   página. NUNCA se comprime la tipografía para forzar una carilla menos. El documento
   tiene las páginas que necesita.

Las barras del gráfico NO están dibujadas a mano: salen de correr el motor real del
proyecto contra los cuatro escenarios del simulador (`/api/motor/lectura?barrido=1`),
guardado en `serie.json`.
"""
import json, subprocess, pathlib

BASE = pathlib.Path(__file__).parent
serie = json.load(open(BASE / "serie.json"))

COLOR = {"en_calma": "var(--gris)", "atencion": "var(--ambar)", "patron_sostenido": "var(--petroleo)"}


def pista(clave, alto_mm=13.0):
    """Una fila de 21 barras: alto proporcional al puntaje real que devolvió el motor."""
    return "".join(
        f'<i style="height:{max(1.0, x["p"] * alto_mm):.2f}mm;background:{COLOR[x["e"]]}"></i>'
        for x in serie[clave]
    )


def dia_habla(clave):
    for x in serie[clave]:
        if x["e"] == "patron_sostenido":
            return x["d"]
    return None


ESCENARIOS = [
    ("normal", "Semana normal", "Lo que se ve en la enorme mayoría de las casas."),
    ("cambio_leve", "Cambio leve", "Unos días distintos que después vuelven a lo de siempre."),
    ("persistente", "Patrón que persiste", "El cambio se sostiene y se profundiza semana a semana."),
    ("evasion", "Intento de saltar el filtro", "Aparece VPN, proxy o DNS alternativo."),
    ("persistente_alto", "El mismo patrón, con los adultos ya marcando cambios",
     "Las dos miradas coinciden."),
]

filas = []
for clave, nombre, desc in ESCENARIOS:
    d = dia_habla(clave)
    badge = (f'<span class="badge badge-hab">habla el día {d}</span>' if d
             else '<span class="badge badge-cal">nunca habla</span>')
    destacada = " destacada" if clave == "persistente_alto" else ""
    filas.append(f"""
      <div class="fila{destacada}">
        <div class="fila-txt">
          <div class="fila-nom">{nombre}</div>
          <div class="fila-desc">{desc}</div>
        </div>
        <div class="barras">{pista(clave)}</div>
        <div class="fila-badge">{badge}</div>
      </div>""")
