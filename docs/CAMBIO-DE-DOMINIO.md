# Cambio de dominio (intercambius.com.ar)

Cuando el frontend pasa a **https://intercambius.com.ar/**, revisá lo siguiente.

## 1. Frontend (Vercel)

- **Dominio:** `intercambius.com.ar` en el proyecto Vercel del **front** (raíz del repo). Ver [`docs/DEPLOY-FRONT-VERCEL.md`](DEPLOY-FRONT-VERCEL.md).
- **Variables de entorno:** `VITE_API_URL=https://intercambios-backend.vercel.app` y opcional `VITE_GOOGLE_MAPS_API_KEY`.
- **Mail:** los registros MX/SPF/DKIM de Google Workspace no se modifican al mover el front a Vercel.

## 2. Backend (Vercel o donde esté el API)

- **CORS:** El backend debe permitir peticiones desde `https://intercambius.com.ar`.
- **`FRONTEND_URL`:** En las variables de entorno del backend poné:
  ```env
  FRONTEND_URL=https://intercambius.com.ar
  ```
  (Sin barra final, o según cómo lea el backend el origen para CORS y emails.)

Si el backend usa esta variable para CORS, con esto deberían dejar de fallar las peticiones desde el nuevo dominio.

## 3. Código ya actualizado en este repo

- **`index.html`:** Las meta `og:image` y `twitter:image` apuntan a `https://intercambius.com.ar/favicon.jpeg`. Añadido `og:url` y descripción para el nuevo dominio.

## 4. Si algo sigue fallando

- **Login/registro:** Si al hacer login no pasa nada o da error de red, suele ser CORS: el backend no está aceptando el origen `https://intercambius.com.ar`. Revisá `FRONTEND_URL` y la configuración de CORS del backend.
- **Después de cambiar el dominio:** Cada dominio tiene su propio `localStorage`. Los usuarios que entraban por el dominio viejo tendrán que volver a iniciar sesión en `https://intercambius.com.ar`.
- **Cookies:** Si usás cookies de sesión, tienen que estar configuradas para el nuevo dominio (o el backend que las emite debe permitir el origen nuevo).
