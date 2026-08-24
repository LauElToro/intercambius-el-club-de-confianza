# Requisitos de backend para el flujo de compra e intercambio

Este documento indica los comportamientos que el backend debe cumplir para que el frontend funcione correctamente.

## 1. Publicación vendida (checkout)

**Problema:** Si un usuario compra un producto (p. ej. zapatillas), la publicación sigue apareciendo como disponible.

**Requisito:** Al completar con éxito el checkout (`POST /api/checkout/:marketItemId`), el backend debe marcar el ítem del market como **vendido/no disponible**:
- Setear `status = 'sold'` y `availability = 'out_of_stock'` en el MarketItem.
- (CheckoutUseCase ya implementa esto.)

El frontend envía `soloDisponibles=true` al listar el market. El backend debe:
- En `GET /api/market`, si `soloDisponibles=true`, filtrar items con `status !== 'sold'` (y `availability === 'in_stock'`).
- En cada item devuelto, incluir `disponible: boolean` = `(status !== 'sold' && availability === 'in_stock')` para que el frontend pueda filtrar en cliente si hace falta.

El frontend oculta el botón "Comprar" en el detalle, muestra badge "Vendido" y filtra `disponible === false` en Market y Coincidencias.

## 2. Límite de crédito en checkout

**Problema:** El usuario intenta pagar por encima de su límite (ej. 350k) y "parece aceptado" pero la compra no se realiza.

**Requisito:** Si el pago supera el límite de crédito negativo del usuario, el backend **no** debe devolver `200 OK`. Debe devolver un error (p. ej. `400`) con un mensaje que incluya "límite" o "crédito", por ejemplo:

```json
{ "error": "No tenés suficiente crédito. El límite negativo es 100000 IOX." }
```

Así el frontend muestra el toast de error y no el de éxito.

## 3. Límite de crédito por defecto (100k)

**Requisito:** Se definió como límite de crédito por defecto **100.000 IOX**. El frontend usa `CREDIT_LIMIT_DEFAULT = 100_000` cuando el usuario no tiene `limite` en su perfil. El backend debería:

- Usar 100.000 como valor por defecto de `limite` para usuarios nuevos o sin límite configurado.
- Permitir (opcional) que un admin configure otro límite por usuario.

## 4. Mensaje automático en compra directa

**Requisito:** Cuando un usuario hace **compra directa** (botón "Comprar con IOX" en el detalle del producto), el backend **no** debe enviar un mensaje automático al chat que diga algo como "quiere realizar un intercambio". Ese mensaje corresponde solo al flujo de **Coincidencias** (intercambio producto por producto). El frontend ya diferencia ambos casos y solo muestra "Aprobar intercambio" cuando el primer mensaje del otro usuario es una propuesta de intercambio (incluye "Ver mi producto" o "Imagen del producto").

## 5. Chat separado por compra / intercambio

**Problema:** Si el chat se deduplica solo por `marketItemId`, una segunda compra o un nuevo intercambio con la misma publicación reutiliza el mismo hilo y se mezclan mensajes de operaciones distintas.

**Requisito:**

- `POST /api/checkout/:marketItemId` ya devuelve `conversacionId` asociado al **intercambio** creado. Esa conversación debe quedar vinculada al registro de intercambio (compra) y no reutilizarse para otra operación.
- `POST /api/chat/iniciar` debe aceptar **`intercambioId`** (además de `marketItemId` / `vendedorId`). Si viene `intercambioId`, debe devolver o crear la conversación **de ese intercambio** (una por operación), no la conversación “genérica” del mismo `marketItemId` entre las dos partes.
- `GET /api/intercambios/:userId` (o el listado que use el frontend) debe incluir **`conversacionId`** en cada ítem cuando exista, para abrir el chat sin llamadas extra.

El contacto **antes** de comprar desde el detalle del producto sigue usando `marketItemId` (conversación por publicación). El contacto desde **Mis compras** / **Historial** usa `intercambioId` o `conversacionId` para coordinar **esa** compra o venta.

## 6. Sistema de referidos

- **Registro:** `POST /api/auth/register` acepta opcional `codigoReferido` (string: código interno o slug personalizado del referente). Debe validar que exista un usuario con ese código/slug y guardar la relación referido → referente.
- **Usuario:** `GET /api/referidos/me` devuelve `{ codigo, slugPersonalizado, totalReferidos, referidos: [{ id, nombre, email, fechaRegistro }] }`.
- **Slug único:** `PUT /api/referidos/me/slug` con body `{ slug }`. Normalizar a minúsculas; rechazar con **409** si el slug ya está en uso por otro usuario.
- **Link de invitación:** el frontend arma `.../registro?ref=<slug o codigo>`.
- **Admin:** `GET /api/admin/referidos?page=&limit=` devuelve filas con referido, referente, código usado, cantidad de referidos acumulados del referente y fechas; opcional `resumen` con totales agregados.

## 7. Canje bilateral (servicios y permuta)

**Problema:** El registro `Intercambio` solo guarda un `marketItemId` (el de la conversación). En un canje (servicio↔servicio o mixto) el historial no puede mostrar ambos lados.

**Requisito:**

- `POST /api/chat/:id/registro-intercambio` acepta opcional **`otroMarketItemId`**: el ítem que ofreció la otra parte (el que no es el `marketItem` de la conversación). Ignorar si no existe o no pertenece a ninguna de las dos partes.
- `GET /api/intercambios/:userId` debe devolver, cuando existan:
  - `modo`: `"compra"` | `"permuta"`
  - `otroMarketItemId`
  - `otroMarketItem` (mismo shape que `marketItem`: id, titulo, rubro, imagen, etc.)
- El frontend ya envía `otroMarketItemId` y degrada a la descripción bilateral si el backend aún no persiste el segundo ítem.
- `GET /api/chat/:id` hoy selecciona el `marketItem` sin `detalles`. El front pide `/api/market/:id` cuando el destino es un servicio para leer `unidadServicio`. Conviene incluir `detalles` (y `stock`) en el `marketItem` del chat para evitar esa llamada extra.

## 8. Contratar un servicio no lo marca como vendido

**Problema:** Tras un checkout o registro, marcar `status = sold` / `out_of_stock` tiene sentido en un producto único, no en un servicio recurrente.

**Requisito:** Al confirmar una **contratación** (`rubro === "servicios"`), **no** marcar la publicación como vendida. Sigue disponible salvo que el prestador la desactive o ponga `disponible: false`. Los productos (y alimentos/experiencias con stock) siguen agotándose según stock.

## 9. Evaluación en permuta / canje

**Problema:** Hoy solo el “comprador” puntúa el ítem (`puntuacionItem`). En un canje ambas partes reciben algo.

**Requisito:** Si `modo === "permuta"`, ambas partes deberían poder calificar el ítem recibido. `GET /api/evaluaciones/contexto/:id` puede incluir `modo` para que el frontend adapte el copy (“el servicio recibido”). El frontend ya lee `modo` si viene; si no, sigue con el flujo actual de comprador/vendedor.

