# Frontend en Vercel

El frontend (Vite + React) se despliega en **un proyecto Vercel separado** del backend.

## Arquitectura

| Proyecto Vercel | Root directory | Dominio |
|-----------------|----------------|---------|
| **intercambius-front** (nuevo) | `/` (raíz del repo) | `intercambius.com.ar`, `www` |
| **intercambios-backend** (existente) | `backend/` | `intercambios-backend.vercel.app` |

El dominio `intercambius.com.ar` va al **proyecto front**, no al backend. Los registros **MX / SPF / DKIM** de Google Workspace no se tocan.

---

## 1. Crear proyecto front en Vercel

1. [vercel.com/new](https://vercel.com/new) → importar el repo de GitHub.
2. **Project Name:** ej. `intercambius-front`
3. **Root Directory:** dejar vacío (raíz del repo). **No** `backend/`.
4. Framework: **Vite** (detectado desde `vercel.json`).
5. Build: `npm run build` → Output: `dist` (ya en `vercel.json`).

---

## 2. Variables de entorno (proyecto front)

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_API_URL` | `https://intercambios-backend.vercel.app` | Production, Preview |
| `VITE_GOOGLE_MAPS_API_KEY` | tu API key de Google Maps | Production, Preview |

**No uses** `intercambius.com.ar` como `VITE_API_URL` (es el front). Debe ser la URL del **backend** con `https://` incluido.

Deploy → las variables se embeben en el build de Vite.

---

## 3. Dominio `intercambius.com.ar`

1. Proyecto **front** → **Settings → Domains**
2. Agregar `intercambius.com.ar` y `www.intercambius.com.ar`
3. Si el dominio ya está en el proyecto **backend**, **quitarlo de ahí** (solo del backend; los DNS de mail quedan en Domains → DNS del equipo).

Vercel provisiona SSL automáticamente.

### DNS (si administrás DNS en Vercel)

- **No eliminar** registros `MX`, `TXT` (SPF, DKIM, DMARC) de Google Workspace.
- El registro **A** / **CNAME** del apex y `www` los crea Vercel al agregar el dominio al proyecto front.

---

## 4. Backend (sin cambios de código)

Proyecto `backend/`:

- `FRONTEND_URL=https://intercambius.com.ar`
- CORS ya acepta `https://intercambius.com.ar` (ver `backend/src/config/cors.ts`).

---

## 5. Verificación post-deploy

- [ ] `https://intercambius.com.ar` carga el sitio (200, SSL válido)
- [ ] `https://intercambius.com.ar/market` no da 404 (SPA rewrite)
- [ ] Login / registro llaman al API (Network → `intercambios-backend.vercel.app`)
- [ ] MX en [mxtoolbox.com](https://mxtoolbox.com) siguen apuntando a Google

---

## 6. Netlify (legacy)

`netlify.toml` queda por compatibilidad; el host oficial del front es **Vercel**. Podés desconectar el sitio de Netlify cuando el front en Vercel esté estable.

---

## Local

```bash
cp .env.example .env.local
# editar VITE_API_URL y VITE_GOOGLE_MAPS_API_KEY
npm run dev
```
