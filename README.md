# Intercambius

Marketplace de intercambios y compras dentro de un club de confianza. Sistema de créditos (IX) para transacciones entre miembros.

---

## Índice

- [Arquitectura general](#arquitectura-general)
- [Frontend](#frontend)
- [Backend](#backend)
- [Infraestructura](#infraestructura)
- [Desarrollo local](#desarrollo-local)
- [Deploy](#deploy)
- [Variables de entorno](#variables-de-entorno)

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Netlify)                          │
│  React + Vite + TypeScript + Tailwind + shadcn/ui                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / API calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Vercel)                            │
│  Express + Prisma + PostgreSQL                                      │                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Prisma
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS                               │
│  PostgreSQL (Neon, Supabase, Vercel Postgres o similar)             │
└─────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: SPA en Netlify, consume API del backend.
- **Backend**: API REST en Vercel (serverless), Prisma + PostgreSQL.
- **Storage**: Vercel Blob para imágenes.

---

## Frontend

### Stack

- **React 18** + **TypeScript**
- **Vite** (build y dev server)
- **Tailwind CSS** + **shadcn/ui**
- **React Query** (TanStack Query)
- **React Router**
- **Leaflet** (mapas, OpenStreetMap sin API key)
- **next-themes** (dark/light mode)

### Estructura

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # ProtectedRoute
│   ├── layout/         # Header, Layout
│   ├── location/       # LocationPicker
│   ├── map/            # MapView (Leaflet)
│   └── ui/             # shadcn/ui primitives
├── contexts/           # AuthContext, CurrencyVariantContext
├── hooks/              # use-mobile, use-toast
├── lib/                # api, utils, currency
├── pages/              # Páginas por ruta
│   ├── Market.tsx      # Marketplace principal
│   ├── ProductoDetalle.tsx
│   ├── CrearProducto / EditarProducto
│   ├── MisPublicaciones / MisCompras
│   ├── Chat.tsx
│   ├── Dashboard, Perfil, Favoritos, etc.
│   └── ...
└── services/           # auth, market, chat, checkout, etc.
```

### Rutas principales

| Ruta | Descripción | Protegida |
|------|-------------|-----------|
| `/` | Landing | No |
| `/market` | Marketplace | No |
| `/producto/:id` | Detalle de producto | No |
| `/dashboard` | Saldo, crédito | Sí |
| `/crear-producto` / `/editar-producto/:id` | Publicar/editar | Sí |
| `/mis-publicaciones` | Mis items | Sí |
| `/mis-compras` | Compras realizadas | Sí |
| `/favoritos` | Items favoritos | Sí |
| `/chat` / `/chat/:id` | Mensajes | Sí |
| `/coincidencias` | Matching ofertas/necesidades | Sí |
| `/historial` | Historial de intercambios | Sí |
| `/perfil/:id` | Perfil de usuario | No |

### Funcionalidades

- **Marketplace**: filtros por tipo, rubro, precio (IX), distancia con mapa (Leaflet).
- **Moneda IX**: variante IX-ARS / IX-USD en el header.
- **Favoritos**: guardar productos.
- **Chat**: contacto con vendedor antes o después de comprar.
- **Checkout**: compra con IX directamente desde el detalle.
- **Geolocalización**: filtro por distancia (GPS o ubicación manual).
- **Upload**: fotos de perfil y productos (Vercel Blob).

### Scripts

```bash
npm run dev      # Desarrollo (puerto 8080)
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # ESLint
npm run test     # Vitest
```

---

## Backend

### Stack

- **Node.js** + **TypeScript**
- **Express**
- **Prisma** + **PostgreSQL**
- **JWT** (auth)
- **bcryptjs** (contraseñas)
- **Vercel Blob** (storage)
- **Multer** (upload)

### Arquitectura DDD

```
backend/
├── api/
│   └── index.ts              # Entry point para Vercel serverless
├── src/
│   ├── domain/               # Capa de dominio
│   │   ├── entities/         # User, MarketItem, Intercambio, Auth
│   │   ├── value-objects/    # Currency
│   │   └── repositories/     # Interfaces IUserRepository, etc.
│   ├── application/          # Casos de uso
│   │   └── use-cases/
│   │       ├── auth/         # Login, Register
│   │       ├── checkout/     # CheckoutUseCase
│   │       ├── market/       # GetMarketItemsUseCase
│   │       ├── intercambio/   # Create, Get, Confirm
│   │       ├── coincidencias/
│   │       └── user/
│   ├── infrastructure/       # Implementaciones
│   │   ├── database/         # Prisma client, ensureSchema, seed
│   │   ├── repositories/     # MarketItemRepository, UserRepository, etc.
│   │   ├── middleware/       # auth
│   │   └── storage/          # vercel-blob
│   └── presentation/
│       ├── controllers/      # AuthController, MarketController, etc.
│       └── routes/          # auth, market, chat, checkout, etc.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── scripts/
    ├── vercel-build.cjs     # Build para Vercel
    └── check-and-backfill-coords.ts
```

### Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| GET | `/api/market` | Listar items (filtros: rubro, precio, distancia) |
| GET | `/api/market/:id` | Detalle de item |
| POST | `/api/market` | Crear item (auth) |
| PUT | `/api/market/:id` | Actualizar item (auth) |
| DELETE | `/api/market/:id` | Eliminar item (auth) |
| POST | `/api/favoritos/toggle/:id` | Toggle favorito (auth) |
| GET | `/api/favoritos` | Mis favoritos (auth) |
| POST | `/api/checkout` | Comprar con IX (auth) |
| POST | `/api/chat/iniciar` | Iniciar conversación (auth) |
| GET | `/api/chat` | Listar conversaciones (auth) |
| GET | `/api/chat/:id/mensajes` | Mensajes de conversación (auth) |
| POST | `/api/chat/:id/mensajes` | Enviar mensaje (auth) |
| GET | `/api/intercambios/:userId` | Intercambios del usuario (auth) |
| POST | `/api/upload` | Subir imagen (auth) |
| GET | `/api/coincidencias` | Matching ofertas/necesidades (auth) |

### Modelos principales (Prisma)

- **User**: usuario, saldo, límite, ubicación, perfil.
- **MarketItem**: productos/servicios, precio, ubicación, lat/lng.
- **Intercambio**: transacciones entre usuarios.
- **Conversacion / Mensaje**: chat comprador-vendedor.
- **Favorito**: favoritos por usuario.
- **UserPerfilMercado**: ofrece, necesita (coincidencias).

### Scripts

```bash
npm run dev              # Desarrollo (tsx watch)
npm run build            # tsc + prisma generate
npm run start            # Producción (node dist)
npm run vercel-build     # Build para Vercel (prisma generate + migrate deploy)
npm run db:generate      # prisma generate
npm run db:push          # Sincronizar schema (dev)
npm run db:migrate       # prisma migrate dev
npm run db:migrate:deploy| Migraciones en producción
npm run db:studio        # Prisma Studio
npm run db:seed          # Seed de datos
npm run db:check-coords  # Backfill coordenadas en MarketItems
```

---

## Infraestructura

### Frontend: Netlify

- **Build**: `npm run build`
- **Publish**: `dist/`
- **SPA**: redirect `/*` → `/index.html`
- **Headers**: cache para assets, seguridad básica.

Configuración en `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
```

### Backend: Vercel

- **Root**: directorio `backend/`
- **Build**: `npm run vercel-build` (prisma generate + migrate deploy)
- **Output**: `public/` (placeholder)
- **Functions**: `api/index.ts` como serverless handler
- **Rewrites**: todo el tráfico a `/api/index.ts`

Configuración en `backend/vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "public",
  "functions": { "api/index.ts": { "maxDuration": 30 } },
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index.ts" }]
}
```

### Base de datos

- **PostgreSQL** accesible desde Internet (Neon, Supabase, Vercel Postgres, Railway, etc.).
- Si usás **connection pooling** (Neon, Supabase), configurá `directUrl` en el schema de Prisma para migraciones. Ver `backend/DEPLOY.md`.

### Storage

- **Vercel Blob**: imágenes de perfil, productos, etc.
- Requiere `BLOB_READ_WRITE_TOKEN` en el backend.

---

## Desarrollo local

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+ (o base en la nube)
- npm

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd intercambius-el-club-de-confianza

# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Variables de entorno

**Frontend** — crear `.env` en la raíz:

```env
VITE_API_URL=http://localhost:3001
```

**Backend** — crear `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/intercambius?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=tu-secret-jwt-cambiar-en-produccion
BLOB_READ_WRITE_TOKEN=tu-vercel-blob-token
FRONTEND_URL=http://localhost:8080
```

### 3. Base de datos

```bash
cd backend
npm run db:generate
npm run db:migrate
# Opcional: npm run db:seed
```

### 4. Ejecutar

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3001

---

## Deploy

### Frontend (Netlify)

1. Conectar el repo a Netlify.
2. **Build command**: `npm run build`
3. **Publish directory**: `dist`
4. **Environment variables**:

### Backend (Vercel)

1. Conectar el repo a Vercel.
2. **Root directory**: `backend`
3. **Build command**: `npm run vercel-build` (por defecto en vercel.json)
4. **Environment variables** (ver sección siguiente).

Si hay errores P1001 o de conexión a la base, revisar `backend/DEPLOY.md`.

---

## Variables de entorno

### Frontend

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `https://intercambios-backend.vercel.app` |

### Backend

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | Sí |
| `JWT_SECRET` | Secret para firmar JWT | Sí |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob | Sí |
| `FRONTEND_URL` | Origen permitido para CORS | No (default: *) |
| `PORT` | Puerto (solo local) | No |
| `NODE_ENV` | development / production | No |
| `SKIP_DB_MIGRATE` | Saltar migrate deploy en build | No |

### Google Maps (opcional)

Para usar Google Maps en lugar de Leaflet:

- Frontend: `VITE_GOOGLE_MAPS_API_KEY`

---

## Documentación adicional

- [backend/README.md](./backend/README.md) — Detalle del backend, API, auth.
- [backend/DEPLOY.md](./backend/DEPLOY.md) — Deploy en Vercel, P1001, connection pooling.

---

## Licencia

[Definir según el proyecto]
