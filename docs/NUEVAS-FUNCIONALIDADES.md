# Documentación de nuevas funcionalidades

Este documento describe las funcionalidades implementadas recientemente en Intercambius.

---

## Índice

1. [Flujo de intercambios (Coincidencias)](#1-flujo-de-intercambios-coincidencias)
2. [Mejoras de usabilidad y onboarding](#2-mejoras-de-usabilidad-y-onboarding)
3. [Creación de productos mejorada](#3-creación-de-productos-mejorada)
4. [Branding y favicon](#4-branding-y-favicon)
5. [Moderación de imágenes (NSFW.js)](#5-moderación-de-imágenes-nsfwjs)

---

## 1. Flujo de intercambios (Coincidencias)

### Descripción

Flujo tipo “tabla” para intercambiar productos/servicios: se elige qué ofrecer, se busca qué se quiere recibir y se inicia la negociación por chat.

### Componentes

| Componente | Ubicación | Función |
|------------|-----------|---------|
| Selector de producto propio | Panel lateral en Coincidencias | Desplegable con los productos del usuario |
| Búsqueda | Panel lateral | Filtra coincidencias o busca en todo el marketplace |
| Botón "Intercambiar" | Tarjeta de producto | Inicia conversación y envía mensaje predefinido |

### Flujo

1. **Selección de producto propio**  
   En “¿Qué ofrecés a cambio?” se elige el producto o servicio propio a intercambiar.

2. **Búsqueda de coincidencias**  
   - Por defecto: productos con valor similar (precio, preferencias según cookies).  
   - Opción “Buscar en todo el marketplace” para búsqueda libre.

3. **Intercambio**  
   Al hacer clic en “Intercambiar” se inicia una conversación y se envía el mensaje:

   ```
   Hola [Nombre]. Quiero realizar un intercambio: [tu producto/servicio]
   ```

4. **Negociación por chat**  
   - Los usuarios negocian por mensajes.  
   - Si hay diferencia de valor: botón “Pagar con IX” para proponer un monto.  
   - La otra parte puede usar “Aceptar monto” para aceptar la propuesta y redirigir a Registrar intercambio.

### Archivos modificados

- `src/pages/Coincidencias.tsx` — Flujo principal
- `src/services/chat.service.ts` — Método `iniciarIntercambio()`
- `src/pages/Chat.tsx` — Botones “Pagar con IX” y “Aceptar monto”
- `src/pages/RegistrarIntercambio.tsx` — Pre-carga de monto desde el chat

---

## 2. Mejoras de usabilidad y onboarding

### Banner de bienvenida (Dashboard)

- Se muestra a usuarios nuevos (sin productos ni intercambios).
- Tres pasos: Crear producto → Ver coincidencias → Negociar por chat.
- Dismissible (se guarda en `localStorage` para no volver a mostrarlo).

**Archivo:** `src/components/onboarding/WelcomeBanner.tsx`

### Explicación de IX

- Sección expandible “¿Qué son los IX?” en la tarjeta de saldo.
- Explica qué son los IX y cómo se ganan y usan.

**Archivo:** `src/components/onboarding/ComoFuncionaIX.tsx`

### Guía en Coincidencias

- Pasos numerados: 1) Elegir producto, 2) Buscar, 3) Hacer clic en Intercambiar.
- Dismissible para usuarios que vuelven.

**Archivo:** `src/components/onboarding/GuiaCoincidencias.tsx`

### Empty states mejorados

- **Coincidencias:** Mensajes según contexto (sin productos, sin resultados, etc.) y CTA “Crear mi primer producto”.
- **Chat:** Enlaces a Intercambius y Market en lugar de texto genérico.

### Navegación

- Nuevo enlace “Inicio” en la barra superior para usuarios logueados (redirige al Dashboard).
- El logo redirige al Dashboard si hay sesión; a Landing si no hay sesión.

---

## 3. Creación de productos mejorada

### Múltiples formas de intercambio

- Antes: un solo medio de pago (select).
- Ahora: varias opciones (checkboxes): IX, IX y pesos, Pago a convenir, Pesos.
- Se envía al backend como string separado por comas (ej. `"ix,pesos"`).

### Ubicación por defecto

- La ubicación del producto se toma automáticamente del perfil del usuario.
- Se usan coordenadas conocidas (CABA, Córdoba, La Plata, etc.) mediante `resolveUbicacionToCoords`.
- Se puede cambiar manualmente en el LocationPicker.
- Indicador: *“Por defecto se usa tu ubicación de perfil. Cambiala solo si el producto está en otro lugar.”*

### Archivos

- `src/lib/ubicaciones.ts` — Función `resolveUbicacionToCoords()`
- `src/pages/CrearProducto.tsx` — Checkboxes y ubicación por defecto
- `src/pages/EditarProducto.tsx` — Mismas mejoras
- `src/pages/ProductoDetalle.tsx` — Visualización de múltiples formas de pago

---

## 4. Branding y favicon

### Marca Intercambius

- Uso consistente de “Intercambius” como marca.
- Sustitución de “Intercambios” por “Intercambius” en títulos y secciones relevantes (Coincidencias, Chat, WelcomeBanner).

### Favicon

- Favicon con el logo de Intercambius.
- Copia del logo en `public/favicon.jpeg`.
- Referencia en `index.html`: `<link rel="icon" type="image/jpeg" href="/favicon.jpeg" />`.

### Meta tags

- Nueva descripción: *“Intercambius - Club de intercambio con créditos IX”*.

---

## 5. Moderación de imágenes (NSFW.js)

### Descripción

Sistema de moderación de imágenes en el cliente para detectar contenido inapropiado antes de subir fotos de productos.

### Tecnología

- **Librería:** [NSFW.js](https://nsfwjs.com/)
- **Modelo:** MobileNetV2 (~2.6MB)
- **Clases revisadas:** Porn, Hentai, Sexy (umbral 60 %)

### Flujo

1. El usuario selecciona imágenes en Crear/Editar producto.
2. Se clasifica cada imagen con NSFW.js.
3. Si se detecta contenido inapropiado, la imagen se rechaza y se muestra un toast.
4. Los videos no se verifican (solo imágenes).

### Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/lib/nsfwCheck.ts` | `isImageNsfw(file: File)`, carga del modelo |
| `src/pages/CrearProducto.tsx` | Integración en `handleMediaChange` |
| `src/pages/EditarProducto.tsx` | Integración en `handleMediaChange` |

### Configuración

En `src/lib/nsfwCheck.ts`:

- `NSFW_THRESHOLD`: sensibilidad (por defecto 0.6).
- `NSFW_CLASSES`: clases consideradas inapropiadas.

### Dependencias

```json
{
  "nsfwjs": "^x.x.x",
  "@tensorflow/tfjs": "^x.x.x"
}
```

---

## Resumen de archivos nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/lib/ubicaciones.ts` | Resolución de ubicación → coordenadas |
| `src/lib/nsfwCheck.ts` | Clasificación NSFW de imágenes |
| `src/components/onboarding/WelcomeBanner.tsx` | Banner de bienvenida |
| `src/components/onboarding/ComoFuncionaIX.tsx` | Explicación de IX |
| `src/components/onboarding/GuiaCoincidencias.tsx` | Guía en Coincidencias |
| `public/favicon.jpeg` | Favicon de Intercambius |

---

## Estructura de componentes de onboarding

```
src/components/onboarding/
├── WelcomeBanner.tsx      # Banner para usuarios nuevos
├── ComoFuncionaIX.tsx     # Explicación expandible de IX
└── GuiaCoincidencias.tsx  # Pasos en Coincidencias
```
