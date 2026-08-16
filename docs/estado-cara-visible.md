# La cara visible — estado real al 2026-08-15

Lo que hay hoy en pantalla, lo que falta, y la decisión pendiente.

---

## Lo que existe

| Página | Para quién | Qué hace |
|---|---|---|
| `/` | **Para vos** | Tablero de diagnóstico: fuentes activas, canales conectados, contadores de señales. No es una home. La propia página lo dice al pie: *"La cara visible es la fase 4"*. |
| `/familia/[token]` | **Producto** | Se entra sin cuenta. Quiénes están, estado de vinculación con el código a la vista, y la línea de tiempo de qué vio la red. **Es lo mejor que hay hoy.** |
| `/panel` · `/panel/login` | Para vos | Lista familias y explica qué exige un alta. |

---

## Lo que no existe

- **Ninguna página que explique qué es AntiGro.**
- **Formulario de alta.** La API valida todo (dos adultos, uno elegido por el chico), pero el
  alta entra por `POST /api/panel/familias`. Hoy se hace con curl.
- **La conversación de alta con el chico.** La regla 4 dice que es *la primera intervención, no
  un trámite*. Es la regla que más te diferencia y es la única sin implementar.
- **El cuestionario a los adultos.** Ya marcado pendiente en el `CLAUDE.md`.

---

## 🔴 El hueco: sí hay que instalar algo

Esto no está en el `CLAUDE.md` ni en el relato del producto, y es lo primero que pregunta
alguien que entiende.

Del lado del software, conectar NextDNS son "dos variables de entorno". **Del lado de la familia
no.** Para que el filtro vea el tráfico del chico, alguien tiene que apuntar el DNS. Es un paso
físico y hoy no está contado en ningún lado.

| Dónde se configura | Qué cubre | El agujero |
|---|---|---|
| **En el router** | Toda la casa, una sola vez | **No ve datos móviles.** Un chico con 4G es invisible |
| **Perfil en el teléfono del chico** | El teléfono en todos lados | Hay que tocar el teléfono una vez |

**Recomendación: el perfil en el dispositivo.** No por completitud — la madrugada es una de tus
dos únicas señales absolutas. Si el chico se pasa a datos móviles a las 3 de la mañana, esa
señal deja de existir. El router deja el agujero justo donde duele.

🔑 **Y esto juega a favor si lo contás vos primero.** No se instala una app de AntiGro en el
teléfono del chico. Se cambia el DNS, el chico lo ve, y sabe que está. Es la regla 3 convertida
en un paso concreto en vez de una promesa.

---

## El recorrido completo

```
0. Home            → qué hace, qué NO hace, y probalo sin cuenta   ✗ no existe
1. Alta            → chico + dos adultos + uno que elige el chico  ✗ API sí, pantalla no
2. Charla al chico → la primera intervención, en pantalla          ✗ no existe
3. Canales         → cada uno aprieta "Iniciar" una vez            ✓ anda
4. Red             → el DNS en el dispositivo                      ✗ ni pantalla ni relato
5. Uso diario      → no hacer nada. El sistema calla               ✓ anda
6. Cuestionario    → cuando aparece algo raro                      ✗ pendiente
7. Aviso           → a los dos adultos y al chico                  ✓ anda, probado real
```

---

## La decisión

**Que la home SEA la demo.** No dos páginas.

Un padre y un jurado quieren lo mismo: ver el sistema andando sin registrarse. La home explica
qué hace arriba, y abajo tiene el simulador con los cuatro escenarios y el reloj. El jurado lo
maneja, el padre lo entiende, y son los 25 puntos del criterio de modo demo sin construir nada
aparte.

Eso deja el **paso 2 (la charla con el chico)** como la pieza más valiosa sin hacer: es la que
ningún control parental del mercado tiene.

**Pendiente de tu decisión:** ¿home con el simulador adentro, o formulario de alta primero?
