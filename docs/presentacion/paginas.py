
def pie(n, total):
    return f'<div class="pie"><span>AntiGro · Documento de presentación</span><span>{n} / {total}</span></div>'

def cinta(txt):
    return f'<div class="cinta"><span class="kicker">{txt}</span><span class="kicker">AntiGro</span></div>'

TOTAL = 10

# ═══════════════ 1 · PORTADA ═══════════════
# 🔑 Una sola idea y mucho aire. La portada no explica: ubica.
P1 = f"""
<div class="page">
  <div class="cinta"><span class="kicker">Documento de presentación</span><span class="kicker">Agosto de 2026</span></div>

  <div style="margin-top:26mm">
    <div class="display">AntiGro</div>
    <p style="margin-top:7mm;font-size:13pt;line-height:1.45;max-width:132mm;color:var(--tinta-media)">
      Percibe señales de que un chico puede estar siendo acosado en internet.
      <em style="color:var(--tinta)">Sin leer un solo mensaje suyo.</em>
    </p>
  </div>

  <div class="respiro"></div>

  <div style="border-top:2pt solid var(--tinta);padding-top:6mm">
    <p style="max-width:150mm">
      Observa la actividad de red de un chico —horarios, volumen, tipo de sitio— y avisa a los
      adultos responsables <strong>cuando aparece un cambio que se sostiene en el tiempo</strong>.
      No lee conversaciones, no guarda mensajes y no rastrea ubicación.
    </p>
    <p class="nota" style="margin-top:4mm">
      Y el chico sabe que el sistema existe desde el primer día.
    </p>
  </div>

  <div class="respiro"></div>

  <div class="destacado">
    <p style="font-size:11.4pt;line-height:1.45">
      <strong>Argentina es el segundo país de América Latina con más casos de ciberacoso
      infantil.</strong>
    </p>
    <p class="nota" style="margin-top:2.6mm">
      Sólo detrás de México, según UNESCO y el CIPDH. Y el 60% de los hechos no se denuncia,
      por vergüenza o falta de información.
    </p>
  </div>

  {pie(1, TOTAL)}
</div>"""

# ═══════════════ 2 · EL PROBLEMA, MEDIDO ═══════════════
P2 = f"""
<div class="page">
  {cinta("El problema, medido")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Estudio nacional</span>
    <h2>Lo que pasa, en números que no son nuestros</h2>
    <p class="nota" style="margin-top:3mm">
      Estudio nacional sobre acoso sexual a niños, niñas y adolescentes mediante TIC —
      Ministerio de Justicia y Derechos Humanos de la Nación, Dirección Nacional de Política
      Criminal, 2023.
    </p>

    <div class="cifras">
      <div class="cifra"><span class="n">56,4%</span><span class="d">de los chicos de 9 a 17 años habla por internet con gente que no conoce en persona</span></div>
      <div class="cifra"><span class="n">35,4%</span><span class="d">recibió un pedido de fotos desnudo o con poca ropa</span></div>
      <div class="cifra"><span class="n">63%</span><span class="d">no sabe qué es el grooming</span></div>
      <div class="cifra"><span class="n">43%</span><span class="d">no habla del tema con sus padres</span></div>
      <div class="cifra"><span class="n">90%</span><span class="d">de las víctimas sufre acoso cotidiano, sostenido durante meses</span></div>
      <div class="cifra"><span class="n">74,3%</span><span class="d">de los casos se perpetra por WhatsApp, cifrado y permitido</span></div>
    </div>
  </div>

  <div class="respiro"></div>

  <div class="marco">
    <span class="kicker">Y una segunda fuente, dos años después, dice lo mismo</span>
    <p class="nota" style="margin-top:3mm">
      El <strong>Informe Grooming LATAM</strong> (2025: 28.360 encuestas anónimas a chicos de 9 a
      17 años en 14 países) mide <strong>72,8%</strong> que no sabe qué es el grooming y
      <strong>60%</strong> que habla con desconocidos. Dos estudios independientes, con dos años y
      dos muestras distintas, apuntan a lo mismo. Y agrega una cifra que el argentino no tenía:
      <strong>33,3%</strong> recibió una propuesta de noviazgo dentro de un juego en línea.
    </p>
  </div>

  {pie(2, TOTAL)}
</div>"""

# ═══════════════ 3 · ARGENTINA + EL PUNTO INCÓMODO ═══════════════
P3 = f"""
<div class="page">
  {cinta("Argentina · el punto de partida")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Medido por el organismo al que este sistema deriva</span>
    <h2>La Línea 137, en diez meses de 2022</h2>

    <div class="cifras" style="grid-template-columns:repeat(4,1fr);gap:7mm">
      <div class="cifra"><span class="n">823</span><span class="d">consultas recibidas entre enero y octubre</span></div>
      <div class="cifra"><span class="n">38%</span><span class="d">eran por grooming — 309 casos</span></div>
      <div class="cifra"><span class="n">59%</span><span class="d">de esas víctimas tenía entre 12 y 17 años</span></div>
      <div class="cifra"><span class="n">76%</span><span class="d">de esas víctimas eran mujeres</span></div>
    </div>

    <p class="nota" style="margin-top:5mm">
      Equipo Niñ@s contra la Explotación Sexual y el Grooming, del Programa «Las Víctimas contra
      las Violencias». <strong>Es la franja etaria y la proporción de género con las que trabaja
      el motor de AntiGro</strong>, y es el organismo al que el sistema deriva cuando la respuesta
      correcta ya no es un sistema.
    </p>
  </div>

  <div class="respiro"></div>

  <div class="sec">
    <span class="kicker">El punto de partida, y es incómodo</span>
    <h2>Ningún control parental protege del grooming. Ni AntiGro ni ninguno.</h2>
    <p style="margin-top:4mm">
      El 74,3% de los casos se perpetra por WhatsApp, cifrado y permitido en cualquier casa: para
      un filtro de contenidos, un pedido de fotos a un chico de doce años y la tarea del colegio
      son el mismo evento. Y los indicadores de grooming que la investigación tiene documentados
      son <strong>conversacionales</strong>: se detectan leyendo mensajes.
    </p>
    <p>
      Nosotros decidimos no leerlos —no se puede y no se debe—. Así que AntiGro no busca la
      conversación: <strong>busca el rastro que el acoso deja alrededor de la conversación</strong>,
      y cruza tres fuentes independientes en lugar de confiar en una sola.
    </p>
  </div>

  {pie(3, TOTAL)}
</div>"""

# ═══════════════ 4 · QUÉ VE Y QUÉ NO ═══════════════
P4 = f"""
<div class="page">
  {cinta("Qué ve el sistema · qué no hace")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Ese rastro son cuatro cosas, y nada más que cuatro</span>
    <h2>Lo que una red alcanza a ver de un chico</h2>

    <div class="dos">
      <div class="item">
        <span class="n">Salto marcado de volumen</span>
        <span class="d">Contra la línea de base del propio chico, no contra un promedio ajeno.
        Un chico que siempre usó mucho el teléfono no arranca en rojo.</span>
      </div>
      <div class="item">
        <span class="n">Actividad de red a horas tardías</span>
        <span class="d">Por sí sola no dice nada —puede estar jugando o de vacaciones—: pesa
        cuando se repite. No se compara contra su historia, así que cuenta desde el primer día.</span>
      </div>
      <div class="item">
        <span class="n">Plataforma nueva</span>
        <span class="d">Aparece un servicio o un sitio de chat con desconocidos que antes no
        estaba en su actividad habitual.</span>
      </div>
      <div class="item fuerte">
        <span class="n">Intento de saltar el filtro</span>
        <span class="d">VPN, proxy o DNS alternativo. Es la señal más fuerte que puede ver una
        red, es un acto deliberado, y hoy no la mira nadie.</span>
      </div>
    </div>

    <p class="nota" style="margin-top:5mm">
      Nada de esto incluye contenido: una señal dice <em>cuándo</em> pasó algo y <em>de qué tipo</em>
      era, nunca qué se dijo ni con quién. La restricción no vive en un manual — está escrita en el
      código, que rechaza con un error cualquier intento de cargar texto de una conversación.
    </p>
  </div>

  <div class="respiro"></div>

  <div class="sec">
    <span class="kicker">Lo que AntiGro no hace — decidido, no pendiente</span>
    <div class="dos">
      <div class="item">
        <span class="n">Leer conversaciones</span>
        <span class="d">No es una limitación que vayamos a resolver más adelante: es el producto.</span>
      </div>
      <div class="item">
        <span class="n">Rastrear la ubicación</span>
        <span class="d">Family Link y Apple ya lo hacen, gratis. No es lo que falta.</span>
      </div>
      <div class="item">
        <span class="n">Entregar el historial de navegación</span>
        <span class="d">Lugares y tipo de sitio, sí. Una lista de por dónde anduvo, no.</span>
      </div>
      <div class="item">
        <span class="n">Reemplazar al adulto, a la escuela o a la Justicia</span>
        <span class="d">Cuando la respuesta correcta es un adulto o la Línea 137, el sistema lo dice.</span>
      </div>
    </div>
  </div>

  {pie(4, TOTAL)}
</div>"""

# ═══════════════ 5 · DE CADA DATO, UNA DECISIÓN ═══════════════
P5 = f"""
<div class="page">
  {cinta("De cada dato, una decisión")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Nada de lo que hace el sistema salió de una ocurrencia</span>
    <h2>Cada cifra del estudio movió una decisión de producto</h2>

    <div class="pares">
      <div class="par">
        <div class="dato"><b>74,3%</b> de los casos pasa por WhatsApp, cifrado.</div>
        <div class="dec">No intentamos leer la conversación. El sistema mira horarios, volumen y
        tipo de plataforma: el rastro que queda alrededor.</div>
      </div>
      <div class="par">
        <div class="dato"><b>90%</b> sufre acoso cotidiano sostenido durante meses.</div>
        <div class="dec">El sistema no alerta por un evento: mide días sostenidos. Un pico aislado
        es ruido, y alarmar por ruido gasta la confianza que después hace falta.</div>
      </div>
      <div class="par">
        <div class="dato"><b>63%</b> de los chicos no sabe qué es el grooming.</div>
        <div class="dec">La conversación de alta con el chico es la primera intervención, no un
        trámite. Esa charla ya resuelve parte del problema antes de que el sistema haga nada.</div>
      </div>
      <div class="par">
        <div class="dato"><b>43%</b> no habla del tema con sus padres.</div>
        <div class="dec">Se sugiere un adulto de confianza fuera de la casa, y a partir de los 11
        lo elige el chico. No es redundancia técnica: es a quien de verdad le va a escribir.</div>
      </div>
      <div class="par">
        <div class="dato"><b>60%</b> no se denuncia, por vergüenza o falta de información.</div>
        <div class="dec">El sistema deriva siempre y por nombre: adulto de confianza, Línea 137,
        app GAPP de Grooming Argentina. Nunca deja al adulto solo frente a la pantalla.</div>
      </div>
      <div class="par">
        <div class="dato"><b>80%</b> de las víctimas son nenas, y el grueso tiene entre 11 y 15 años.</div>
        <div class="dec">La edad y el género ajustan el peso de las señales y el texto del mensaje,
        con un margen deliberadamente angosto: el 20% restante no es ruido.</div>
      </div>
      <div class="par">
        <div class="dato"><b>33,3%</b> recibió una propuesta de noviazgo dentro de un juego.</div>
        <div class="dec">Es una de las nueve preguntas del cuestionario. Un adulto puede ver esa
        propuesta y leerla como un noviazgo de chicos.</div>
      </div>
      <div class="par">
        <div class="dato"><b>40%</b> de los adultos no conoce las herramientas que ya existen.</div>
        <div class="dec">El cuestionario enseña mientras pregunta: cada pregunta le está contando
        al adulto qué mirar.</div>
      </div>
    </div>
  </div>

  {pie(5, TOTAL)}
</div>"""

# ═══════════════ 6 · LAS REGLAS Y SU RESPALDO ═══════════════
# 🔑 La página que separa a AntiGro de un control parental. Verificado el 18/8
#    contra UCF y ScienceDaily antes de publicarlo.
P6 = f"""
<div class="page">
  {cinta("Por qué estas reglas, y no un control parental")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">La investigación</span>
    <h2>Vigilar no funciona. Y hay evidencia de que puede empeorar las cosas.</h2>
    <p style="margin-top:4mm">
      El grupo de <strong>Pamela Wisniewski</strong> (University of Central Florida) estudió
      <strong>74 aplicaciones Android</strong> de seguridad adolescente. El
      <strong>89% de sus funciones eran de control parental</strong> y sólo el
      <strong>11% apoyaba la autorregulación del adolescente</strong>.
    </p>
    <p>
      Después midieron el resultado: los adolescentes cuyos padres declaraban usar estas
      aplicaciones <strong>reportaron más exposición</strong> a contenido explícito no deseado,
      acoso en línea y problemas con otros chicos. El <strong>79% de las reseñas escritas por los
      propios chicos</strong> les puso dos estrellas o menos. La conclusión de los autores es que
      más control no asegura más seguridad, y que cierta autonomía es el mejor camino.
    </p>
  </div>

  <div class="destacado">
    <p><strong>AntiGro está construido del otro lado, y por eso sus reglas son innegociables.</strong></p>
  </div>

  <div class="sec" style="margin-top:7mm">
    <ul class="lista">
      <li>El sistema <strong>nunca afirma</strong> que un chico está siendo acosado, ni que está a
      salvo. Señala, nombra y deriva.</li>
      <li><strong>No se lee el contenido de las conversaciones.</strong> Nunca. Es la línea que
      separa esto de un espía, y es lo que lo hace defendible.</li>
      <li><strong>El chico sabe que AntiGro existe desde el minuto cero</strong>, y sabe que no se
      leen sus mensajes. Un chico que sabe que hay una red que lo cuida es un aliado; uno que se
      siente espiado es un adversario.</li>
      <li><strong>La explicación inicial al chico es la primera intervención</strong>, no un
      trámite legal. Y cuando el sistema detecta algo, <strong>le escribe también a él</strong>,
      con el texto que corresponde a su edad.</li>
      <li><strong>No se alerta por un evento. Se alerta por persistencia.</strong></li>
    </ul>
  </div>

  <div class="respiro"></div>

  <div class="marco">
    <p class="nota">
      <strong>No es una versión más amable de un control parental: es lo contrario de un control
      parental.</strong> La línea de investigación posterior de ese mismo grupo propone enfoques
      basados en <em>resiliencia y autonomía</em> del adolescente en lugar de vigilancia — que es,
      exactamente, el terreno donde este sistema fue diseñado.
    </p>
  </div>

  {pie(6, TOTAL)}
</div>"""

# ═══════════════ 7 · LA PRUEBA ═══════════════
P7 = f"""
<div class="page">
  {cinta("El corazón del sistema")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">La regla que define el producto</span>
    <h2>No se alerta por un evento. Se alerta por persistencia.</h2>
    <p style="margin-top:4mm">
      Cuatro historias de tres semanas, procesadas por el motor real de AntiGro. Cada barra es un
      día; la altura es cuánto se apartó de lo habitual <em>para ese chico</em>.
    </p>

    <div class="grafico">
      {"".join(filas)}
      <div class="eje">
        <span></span>
        <span class="eje-dias"><span>día 1</span><span>día 7</span><span>día 14</span><span>día 21</span></span>
        <span></span>
      </div>
    </div>

    <div class="leyenda">
      <span><b style="background:var(--gris)"></b> Sin novedad</span>
      <span><b style="background:var(--ambar)"></b> Hay un cambio, y el sistema no le escribe a nadie</span>
      <span><b style="background:var(--petroleo)"></b> El patrón se sostiene: recién acá habla</span>
    </div>
  </div>

  <div class="respiro"></div>

  <div class="destacado">
    <p><strong>La última fila es la tesis del producto.</strong> Es el mismo caso que el tercero,
    pero con los adultos ya marcando cambios en el cuestionario. Cuando dos miradas independientes
    apuntan a lo mismo, el sistema no espera a tener toda la evidencia de un solo lado:
    <strong>habla tres días antes</strong> — y nunca baja de cuatro días sostenidos, porque la
    persistencia sigue mandando.</p>
    <p class="nota" style="margin-top:3mm">
      Y lo más difícil de construir no fue la alerta: fue el silencio. Las dos primeras filas son
      chicos a los que el sistema nunca les escribe.
    </p>
  </div>

  {pie(7, TOTAL)}
</div>"""

# ═══════════════ 8 · EN QUÉ SE BASA ═══════════════
P8 = f"""
<div class="page">
  {cinta("En qué se basa")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Las fuentes</span>
    <h2>De dónde sale cada cosa que el sistema afirma</h2>

    <ul class="lista densa" style="margin-top:4mm">
      <li><strong>Estudio nacional sobre acoso sexual a NNyA mediante TIC</strong> — Ministerio de
      Justicia y Derechos Humanos de la Nación, Dirección Nacional de Política Criminal, 2023.
      Recopila UNESCO/CIPDH, Grooming Argentina (n=4.276), Argentina Cibersegura, ESET y Google.</li>

      <li><strong>Informe Grooming LATAM</strong> — Red Grooming LATAM, mayo de 2025. n≈28.360
      encuestas anónimas a chicos de 9 a 17 años en 14 países. Es la fuente más grande y más
      reciente de las dos, y la que fija la franja más vulnerable entre los 9 y los 13 años.</li>

      <li><strong>Línea 137 — Equipo Niñ@s contra la Explotación Sexual y el Grooming</strong>,
      Programa «Las Víctimas contra las Violencias». Datos de consultas de enero a octubre de 2022.</li>

      <li><strong>Cómo ataca un agresor — el modelo de las cinco etapas.</strong>
      <em>Sexual Grooming Model</em> (SGM), Winters &amp; Jeglic, 2017, ampliado en 2020: validez de
      contenido establecida por un panel de expertos, 77 conductas agrupadas en cinco etapas.
      <strong>AntiGro no lo usa para diagnosticar una etapa</strong> —eso exigiría leer las
      conversaciones—: lo usa al revés, para saber qué huella dejaría cada una en la red.</li>

      <li><strong>Por qué un mismo lugar aparece en varias casas a la vez.</strong> Revisión de
      estrategias de grooming pre y post internet, <em>Child Abuse &amp; Neglect</em>, noviembre de
      2021: la tecnología permite al acosador contactar simultáneamente a muchos chicos.</li>

      <li><strong>Sobre vigilancia y adolescentes:</strong> línea de investigación de Pamela
      Wisniewski (University of Central Florida) sobre apps de seguridad adolescente, y trabajos
      posteriores sobre enfoques de resiliencia y autonomía.</li>

      <li><strong>Marco legal:</strong> Ley 26.904 (grooming, delito desde 2013, art. 131 del
      Código Penal) y Ley 27.590 «Mica Ortega», que crea el Programa Nacional de Prevención.
      <strong>Ley 25.326 de Protección de Datos Personales</strong>, que clasifica la vida sexual
      como dato sensible — el marco que gobierna todo lo que este sistema puede y no puede tratar.
      <strong>Derivación:</strong> Línea 137 y app GAPP de Grooming Argentina. Y el Ministerio
      Público de la Provincia de Buenos Aires, que recomienda a los adultos observar los cambios de
      humor y los horarios de conexión — dos de las preguntas del cuestionario.</li>

      <li><strong>Una aclaración de procedencia, porque importa:</strong> los pesos con los que el
      motor pondera cada señal son <em>decisiones de producto informadas por esas cifras</em>, no
      coeficientes publicados por ningún estudio, y la distinción está anotada en el código dato
      por dato.</li>

      <li><strong>Y una que preferimos decir antes de que la pregunten:</strong> el sistema
      <strong>no espera una cantidad fija de días</strong> para saber qué es «lo habitual» en un
      chico. Fijar un número —14, 30— habría sido inventar una certeza que no existe: depende de
      cada chico. La confianza crece con lo que el sistema va observando, baja si la conducta es
      errática, y <strong>se muestra en pantalla en vez de esconderse</strong>.</li>
    </ul>
  </div>

  {pie(8, TOTAL)}
</div>"""

# ═══════════════ 9 · ESTADO, ESCALADO Y ALIANZAS ═══════════════
P9 = f"""
<div class="page">
  {cinta("Estado · por dónde escala · con quiénes")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Estado</span>
    <h2>Qué está funcionando hoy</h2>
    <p style="margin-top:4mm">
      El motor de análisis, la mensajería —Telegram, correo y WhatsApp detrás de una misma
      interfaz—, el alta de la familia y la vinculación de canales están funcionando y probados
      contra dispositivos reales. <strong>Quién decide es el sistema</strong>, mirando qué pasó y en
      qué días; la inteligencia artificial sólo lo pone en palabras, y antes de que ese texto salga
      se revisa que no diga nada que el sistema no pueda sostener.
    </p>
    <p>
      <strong>Y se fortalece a medida que junta datos, en dos ejes.</strong> Con el tiempo en una
      casa: el perfil se arma con toda la historia, no con una ventana fija. Y con cada casa nueva:
      si un mismo lugar aparece en varias casas la misma semana, eso ya pide explicación — y si
      además el público de ese lugar es <em>imposible</em>, angosto en edad y género donde un sitio
      legítimo es diverso, <strong>el sistema puede señalar un sitio del que no hay ninguna denuncia
      previa</strong>.
    </p>
  </div>

  <div class="sec">
    <span class="kicker">Por dónde escala</span>
    <div class="dos">
      <div class="item">
        <span class="n">Edad del dominio</span>
        <span class="d">WHOIS, VirusTotal. Un chat registrado hace tres semanas no es lo mismo que
        uno de hace diez años, y hoy el motor los trata igual.</span>
      </div>
      <div class="item">
        <span class="n">Reputación de dominio</span>
        <span class="d">abuse.ch, PhishTank. Con la salvedad de que detecta infraestructura
        maliciosa, no grooming: entra con peso bajo.</span>
      </div>
      <div class="item">
        <span class="n">Taxonomías de organismos</span>
        <span class="d">NCMEC define <em>online enticement</em> como categoría paraguas; Interpol,
        Europol y la UFECI publican modus operandi salidos de causas reales.</span>
      </div>
      <div class="item">
        <span class="n">Tiempo de uso por aplicación</span>
        <span class="d">Screen Time de Apple, Digital Wellbeing de Android. Cubriría el punto ciego
        del DNS cuando una app resuelve nombres por su cuenta.</span>
      </div>
    </div>
    <p class="nota" style="margin-top:4mm">
      Ninguna de estas fuentes lee contenido: son metadatos, categorías y fechas. Y ninguna se
      presenta como disponible hoy — están enumeradas para mostrar por dónde crece el sistema.
    </p>
  </div>

  {pie(9, TOTAL)}
</div>"""

# ═══════════════ 10 · ALIANZAS Y CIERRE ═══════════════
# 🔑 La cita de Navarro va acá y no antes: nombra el hueco que estas alianzas
#    existirían para llenar. El cierre del documento es una pregunta abierta,
#    no una promesa.
P10 = f"""
<div class="page">
  {cinta("Con quiénes")}

  <div class="sec" style="margin-top:9mm">
    <span class="kicker">Alianzas que mejorarían los datos</span>
    <h2>Ninguna está en curso. Todas requieren convenio.</h2>

    <div class="dos" style="margin-top:6mm">
      <div class="item">
        <span class="n">Grooming Argentina · Argentina Cibersegura</span>
        <span class="d">Experticia del dominio y, eventualmente, casos anonimizados con los que
        contrastar lo que el motor considera un patrón.</span>
      </div>
      <div class="item">
        <span class="n">UFECI — Ministerio Público Fiscal</span>
        <span class="d">Validación forense y marco de denuncia. Es donde vive el modus operandi
        salido de causas reales, que la web abierta no tiene.</span>
      </div>
      <div class="item">
        <span class="n">Línea 137 · Programa Las Víctimas contra las Violencias</span>
        <span class="d">Datos de consultas. Ya es el organismo al que el sistema deriva; la
        relación en el otro sentido está por construirse.</span>
      </div>
      <div class="item">
        <span class="n">AAIP — Agencia de Acceso a la Información Pública</span>
        <span class="d">Consulta previa sobre tratamiento de datos de menores, antes de escalar y
        no después.</span>
      </div>
      <div class="item">
        <span class="n">Universidades argentinas</span>
        <span class="d">Grupos de procesamiento de lenguaje en español, para validar criterios sin
        que el sistema tenga que leer contenido.</span>
      </div>
      <div class="item">
        <span class="n">NCMEC · INHOPE</span>
        <span class="d">Taxonomías de conducta y listas verificadas. El acceso es escalonado y
        exige verificación institucional.</span>
      </div>
    </div>
  </div>

  <div class="respiro"></div>

  <div class="cita">«Argentina carece de datos concretos respecto de casuística por jurisdicciones.»
    <span class="aut">Hernán Navarro, director de Grooming Argentina — marzo de 2026</span></div>

  <p style="margin-top:5mm;max-width:150mm">
    Ese hueco es el que estas alianzas existirían para llenar. Y un sistema que observa de forma
    continua, <strong>sin leer una sola conversación</strong>, puede empezar a llenarlo desde el
    lado que hoy no mira nadie.
  </p>

  <div class="contacto">
    <span class="q">Edgardo Lamas</span><span class="m">lamasedgardo2024@gmail.com</span>
  </div>

  {pie(10, TOTAL)}
</div>"""