# Documentación Intercambius

## Contenido

- **DOCUMENTACION-PROYECTO-INTERCAMBIUS.md** – Documentación técnica del proyecto (Mail, Admin, Métricas, Usuarios, Newsletter, Front, Excel).

## Generar PDF

Desde la raíz del proyecto:

```bash
npm run docs:pdf
```

El PDF se genera en la misma carpeta que el Markdown: **docs/DOCUMENTACION-PROYECTO-INTERCAMBIUS.pdf**. La primera vez puede tardar (md-to-pdf usa Puppeteer y puede descargar Chromium).

**Alternativas si no querés instalar nada:**

1. **VS Code**: instalar la extensión *Markdown PDF*, abrir `DOCUMENTACION-PROYECTO-INTERCAMBIUS.md`, clic derecho → “Markdown PDF: Export (pdf)”.
2. **Navegador**: abrir el archivo `.md` (o previsualizarlo en VS Code/GitHub) y usar **Imprimir → Guardar como PDF**.
3. **Pandoc** (si lo tenés instalado):  
   `pandoc docs/DOCUMENTACION-PROYECTO-INTERCAMBIUS.md -o docs/DOCUMENTACION-PROYECTO-INTERCAMBIUS.pdf`
