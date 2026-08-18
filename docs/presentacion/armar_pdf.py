exec(open(__file__.replace("armar_pdf.py", "cabecera.py")).read())
exec(open(__file__.replace("armar_pdf.py", "estilos.py")).read())
exec(open(__file__.replace("armar_pdf.py", "paginas.py")).read())

HTML = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>AntiGro — Documento de presentación</title>
<style>{ESTILOS}</style>
</head><body>
{P1}{P2}{P3}{P4}{P5}{P6}{P7}{P8}{P9}{P10}
</body></html>
"""

(BASE / "antigro.html").write_text(HTML, encoding="utf-8")

salida = BASE / "AntiGro-presentacion.pdf"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                f"--print-to-pdf={salida}", f"file://{BASE / 'antigro.html'}"],
               check=True, capture_output=True)
print(f"PDF: {salida}")
