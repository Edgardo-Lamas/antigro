# Sofi — la figura del asistente

Todo lo decidido el **21/9/2026** sobre quién es la presencia del panel y cómo se genera.
El componente que la muestra es `src/components/Presencia.tsx`; el procesado de los clips,
`scripts/avatar.mjs` (`npm run avatar`).

## Las decisiones, y de quién son

Todas de Edgardo, en esta sesión:

| | Qué |
|---|---|
| **Quién es** | **Mujer latina adulta**, 35-40, tratada como proyección y no como foto. Ropa profesional —pollera y camisa—, no jeans: *"me parece que es una imagen más profesional"*. Anteojos de aro fino |
| **Tamaño** | 🔴 **Chica al costado: 200 px de alto (224 en pantalla grande).** *"nunca dijimos que debería ser una imagen grande"*. Venía de 352/416, que era casi media pantalla |
| **Postura** | Elevada, flotando apenas, **como el holograma de Cortana en Halo** |
| **La base** | **Bandeja de luz bajo los pies**, como se hizo con Martín en Criterio Térmico. Fina y baja, para no comerle altura a la figura |
| **Sin chispas** | 🔴 Las partículas que salieron en el primer intento **se sacan**: *"queda feo"* |

## Lo que NO hay que volver a discutir

🔴 **Son DOS clips, no cuatro.** `reposo` y `pensando` son los únicos que alguna pantalla pide.
`escuchando` espera al micrófono y `hablando` no tiene dónde aparecer porque no hay audio de
salida en la web (decisión del 20/9). Los dos que faltan miran a `reposo` en `CLIP_DE`.

🔴 **Fondo negro puro, nunca canal alfa.** Flow no entrega alfa y un holograma recortado con
chroma queda sucio justo donde tiene que ser translúcido. El panel funde el clip con
`mix-blend-mode: screen`: el negro desaparece y sólo se suma la luz.

🔴 **El cerco del JPEG.** La compresión deja el fondo en un gris de 3-6 %, y `screen` lo suma:
se ve un rectángulo clarito alrededor de la figura. Lo resuelve `colorlevels` en el procesado —
**no hay que pedirle nada a Flow por esto**.

📌 **En ningún lugar del sistema la cara se ve a más de ~25-30 px** (franja de 200 px, círculo de
64 en el teléfono, 44 en el encabezado de la charla). Lo que se lee es la silueta, la postura y
el color; los rasgos finos no. Por eso los anteojos son casi decorativos, y por eso el riesgo de
que los dos clips parezcan dos mujeres distintas es bajo.

🔴🔴 **La figura NO reacciona al riesgo.** Serena y estable siempre. `reglas.ts` controla lo que
el asistente *afirma*, y un gesto preocupado es una afirmación que ningún control mira.

## Qué falló en el primer intento, y por qué

La primera imagen salió con el cuerpo de luz pero **la cara, las manos y el pelo de piel y pelo
reales**: una mujer iluminada de violeta, no una figura hecha de luz. Sumado a que el cuerpo era
opaco, las rayas de barrido casi no estaban y el color era pastel. De ahí sale el párrafo
`CRITICAL` del prompt de abajo.

## El prompt de la imagen

Va entero, los párrafos seguidos, en un solo campo. Si Flow permite usar la imagen anterior como
referencia, **mejor eso que generar de cero**: conserva a la misma mujer.

```
Full-body holographic projection of a calm Latin American woman, around 35-40 years old, standing upright in a relaxed, attentive posture, arms resting naturally at her sides, shoulders open. Serene and warm expression, gaze directed slightly to her left (viewer's right). Her feet are whole and clearly defined, hovering just above a light emitter.

Beneath her there is a thin circular holographic base plate lying flat on the ground: a slim glowing disc of cyan light, wider than her stance, casting a soft upward glow that illuminates her feet and lower legs from below. The disc is thin and low in profile, taking up as little vertical space as possible. No sparks, no particles, no glitter, no floating dust, no embers anywhere in the image.

CRITICAL: the ENTIRE figure is made of the same emissive holographic light, including her face, her hands, her arms and her hair. No natural skin tone anywhere, no flesh color, no brown or black hair, no photographic realism: her face and hair are luminous and semi-transparent, built from the same violet and cyan light as her clothes. This is a projected light construct, not a photograph of a person lit in purple.

Clearly semi-transparent: the black background shows faintly through her torso, her arms and her legs. Strong, clearly visible horizontal scanlines run across the whole figure, including across her face, evenly spaced, like a projected display. Bright bloom glow radiating from her silhouette, subtle cyan and magenta chromatic fringing along her contours, and faint horizontal interference bands drifting slowly across her body.

Intensely saturated, high-chroma luminous color: vivid violet #7C6CF0 through the upper body fading into vivid cyan #35C6D6 toward the legs. Glowing and electric, never pastel, never washed out, never grey.

Simple professional clothing: a plain knee-length skirt and a soft button-up shirt, no jacket, no patterns, no logos. Thin minimal eyeglass frames drawn as fine lines of light, no visible lenses, no reflections, eyes clearly legible.

Pure solid black background (#000000), no environment, no walls, no floor beyond the light disc, no shadows, no reflections, no text, no watermark. Vertical 9:16 composition, the full figure centered horizontally, head near the top with a small margin, the light disc near the bottom.
```

## Los prompts de movimiento

🔑 **Los dos clips salen de la MISMA imagen.** Al pasar de un video al otro el panel remonta y
arranca de cero: con el mismo primer cuadro el corte es invisible, con dos imágenes distintas hay
un parpadeo en el que la figura cambia.

🔑 **La diferencia va en la luz y el ritmo, nunca en la pose.** `pensando` se ve sobre todo en el
círculo de 44 px del encabezado: ahí no se lee una expresión, se lee que algo pulsa más rápido.
Nada de mano en la barbilla — el brazo taparía lo único legible a ese tamaño.

### `reposo` — en pantalla el 95 % del tiempo

```
Static locked-off camera, no camera movement, no zoom, no pan. The holographic woman stays exactly where she is, standing still in the same pose. Only subtle life: slow calm breathing with the shoulders rising and falling gently, an occasional slow blink, and a very faint drift of translucent light across her body with soft slow-moving horizontal scanlines. One full breathing cycle takes about five seconds. Her expression stays constant, serene and neutral, and her gaze stays exactly where it is.

No walking, no turning, no hand gestures, no talking, no change of pose, no lighting changes, no background elements appearing. Pure black background throughout.
```

### `pensando` — los ~15 s que tarda en contestar

```
Static locked-off camera, no camera movement, no zoom, no pan. Same woman, same pose, same position as the source image, still standing calmly. The only change is the light: a soft pulse of brightness travels slowly upward through her translucent body, repeating about every two seconds, and the horizontal scanlines move faster and are slightly more visible, as if the projection were working. Her eyes lower just barely, as if considering something. Expression stays serene, never worried, never frowning.

No walking, no turning, no hand gestures, no hand near the face, no talking, no change of pose. Pure black background throughout.
```

⚠ **Qué mirar en el clip:** que **no se mueva la cámara** (Flow mete un zoom lento aunque no se lo
pidan) y que no empiece a caminar ni a gesticular. Un clip con deriva, repitiéndose todo el día al
costado del panel, se vuelve un tic que molesta más que la silueta.

## Cómo entran los clips al panel

1. Los videos de Flow van a **`~/Desktop/avatar-antigro/`** con los nombres `reposo` y `pensando`
   (cualquier extensión de video).
2. `npm run avatar` — les saca el audio que Flow inventa, recorta los negros, los cierra en bucle
   de ida y vuelta para que no den el salto al repetir, los achica a 480 px de alto y los deja en
   `public/avatar/`.
3. `HAY_CLIPS` a `true` en `src/components/Presencia.tsx`.
4. 📌 Con la imagen final a la vista, **medir cuánto alto se lleva la bandeja** y ajustar
   `h-[12.5rem] xl:h-[14rem]` en `src/app/mi-familia/page.tsx` para que la mujer siga midiendo los
   200 px decididos y no pierda tamaño por la base.
