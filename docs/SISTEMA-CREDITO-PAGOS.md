# Sistema de crédito y pagos (IOX)

Definición del sistema de crédito, comisiones y reglas de pago en Intercambius.

---

## 1. Comisión del 5% en IOX

- **Cada intercambio** (compra o venta) tiene un pago mínimo del **5% en IOX** por defecto.
- Aplica a menos que el usuario no acepte los términos y condiciones (ver más abajo); incluso en ese caso, **cuando compre debe pagar siempre un 5% en IOX** para que la moneda se vaya emitiendo.
- **Quienes venden** por la página **deben aceptar siempre un 5% de pago en IOX**. Es obligatorio para vendedores.

---

## 2. Límite de deuda: 100.000 IOX

- El usuario se **endeuda** hasta un máximo de **100.000 IOX** en negativo.
- Al llegar a deber **100.000 IOX**, ya no puede seguir comprando con crédito en la plataforma.
- A partir de ese momento **solo puede pagar por fuera de la página** (efectivo, transferencia, etc.), coordinando con el vendedor.
- La persona queda con saldo negativo de **100.000 IOX** hasta que genere crédito (vendiendo, prestando servicios, etc.).

---

## 3. Oferta de crédito al ingresar al portal

- Al **ingresar al portal** (registro o primer acceso) se le ofrece al usuario **100.000 IOX de crédito**.
- **Si acepta los términos y condiciones:**
  - Su saldo inicial queda en **-100.000 IOX** (tiene 100k de crédito para usar).
  - Puede comprar hasta agotar ese crédito; al llegar a -100k solo podrá pagar por fuera.
- **Si no acepta los términos y condiciones:**
  - Su saldo queda en **0 IOX**.
  - Aun así, **cuando compre debe pagar siempre al menos un 5% en IOX** para que la moneda se emita.

---

## 4. Quienes ya deben 100.000 IOX

- Las personas que **ya deben 100.000 IOX** solo pueden **pagar por fuera de la página** cuando compran (no pueden usar más crédito IOX en la plataforma).
- Los **vendedores** siempre deben aceptar un **5% de pago en IOX** en cada venta.

---

## 5. Devolución de deuda al año (100k IOX adeudados)

- Los usuarios que **al año sigan debiendo 100.000 IOX** deben devolver de alguna de estas formas:
  - **Trabajar en una ONG seleccionada** por el proyecto, o
  - **Participar de un evento de intercambio** y trabajar para el proyecto en el evento, o
  - **Otra forma** de trabajar para el proyecto y devolver ese servicio en IOX (según se definan más opciones).
- Si no cumplen ninguna de estas opciones, el caso se analizará de forma particular (puede haber muchas alternativas).

---

## Resumen para implementación

| Concepto | Valor / Regla |
|----------|----------------|
| Comisión mínima por operación | 5% en IOX |
| Límite de crédito negativo | 100.000 IOX |
| Oferta al ingresar (si acepta T&C) | 100.000 IOX → saldo inicial -100.000 IOX |
| Si no acepta T&C | Saldo inicial 0; igual debe pagar 5% IOX al comprar |
| En -100k IOX | Solo pagar por fuera de la página |
| Vendedores | Siempre aceptan 5% en IOX |
| Deuda al año | Trabajo en ONG, evento o proyecto para devolver en IOX |

---

## Frontend implementado

- **Constantes** (`src/lib/constants.ts`): `CREDIT_LIMIT_DEFAULT`, `CREDITO_OFERTA_INGRESO`, `COMISION_IOX_PORCENTAJE`.
- **Modal oferta de crédito** (`src/components/credito/OfertaCreditoTerminos.tsx`): se muestra al usuario logueado que aún no respondió; opciones "Aceptar términos" (crédito 100k) o "No aceptar" (saldo 0). La elección se guarda en `localStorage` por usuario para no volver a mostrar el modal.
- **En límite -100k**: en detalle de producto y en Coincidencias se oculta "Comprar con IX" y se muestra el mensaje de que solo puede pagar por fuera.
- **Checkout**: texto que indica el 5% en IOX y que los vendedores siempre aceptan ese porcentaje.
- **ComoFuncionaIX**: explicación de IOX, oferta al ingresar, 5%, límite y regla del año (ONG/evento).

## Backend pendiente

- Al registrar o al **aceptar términos**: si el usuario acepta, asignar `saldo = -100_000` y `limite = 100_000`; si no acepta, `saldo = 0` (y opcionalmente persistir `aceptaTerminosCredito`).
- Endpoint opcional para registrar la aceptación/rechazo de términos (p. ej. `POST /api/users/me/terminos-credito` con `{ acepta: true | false }`) y aplicar el saldo inicial según corresponda.
- En cada operación de compra/venta: aplicar y descontar el 5% en IOX (comisión de la plataforma).
