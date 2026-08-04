# Correo con Google Workspace — envío + bandejas de formulario

- **Remitente / transaccional:** `noreply@intercambius.com.ar` (MFA, bienvenida, compras, chat, newsletter)
- **Formulario — consultas:** `contacto@intercambius.com.ar`
- **Formulario — quejas/sugerencias:** `reclamos@intercambius.com.ar`

`contacto@` y `reclamos@` ya son **usuarios activos** en Workspace (además de `noreply@` e `info@`). Cada uno tiene su propia bandeja Gmail: ahí entran y salen los mails de esa dirección.

Migración desde `Intercambius.info@gmail.com`. Backend en **Vercel**; bandeja en **Google Workspace**.

---

## Arquitectura

```text
SALIENTE (app → usuarios)
  Vercel → smtp.gmail.com (OAuth) → usuarios
  Remitente: noreply@intercambius.com.ar

ENTRANTE
  MX Google → usuarios/alias del dominio

FORMULARIO WEB
  Front → POST /api/contact → Vercel → SMTP (from noreply@)
    consulta/otro  → contacto@intercambius.com.ar
    queja/sugerencia → reclamos@intercambius.com.ar
  Reply-To = email del usuario
```

Vercel **no recibe** SMTP entrante. Solo **envía**.

---

## Paso a paso (sin código)

### 1. Dominio en Workspace

1. [admin.google.com](https://admin.google.com) → **Cuenta → Dominios**.
2. Verificá que `intercambius.com.ar` esté **Activo**.

### 2. DNS (MX, SPF, DKIM, DMARC)

En el panel DNS del dominio:

**MX** (prioridades según Google):

| Prioridad | Servidor |
|-----------|----------|
| 1 | `ASPMX.L.GOOGLE.COM` |
| 5 | `ALT1.ASPMX.L.GOOGLE.COM` |
| 5 | `ALT2.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT3.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT4.ASPMX.L.GOOGLE.COM` |

**SPF** (TXT en `@`):

```text
v=spf1 include:_spf.google.com ~all
```

**DKIM:** Admin → **Apps → Google Workspace → Gmail → Autenticar correo** → generar registro TXT `google._domainkey` → publicar en DNS → **Iniciar autenticación**.

**DMARC** (TXT en `_dmarc`):

```text
v=DMARC1; p=none; rua=mailto:noreply@intercambius.com.ar
```

### 3. Usuario único `noreply@`

1. Admin → **Directorio → Usuarios → Agregar usuario**.
2. Email principal: **`noreply@intercambius.com.ar`**
3. OU: **INTERCAMBIUS**
4. Primer acceso: cambiar contraseña en [mail.google.com](https://mail.google.com).
5. Activar **2FA** en la cuenta.

Asigná como miembros del buzón a quienes atiendan consultas (puede ser una sola persona o varias con delegación en Gmail).

### 3b. Alias obligatorios del formulario (`contacto@` y `reclamos@`)

Sin esto, el formulario “envía OK” y el mail no aparece en ninguna bandeja.

**Opción A — Alias sobre `noreply@` (recomendado, mismo buzón):**

1. Admin → **Directorio → Usuarios → noreply@**.
2. **Información del usuario → Correo electrónico alternativo / Alias**.
3. Agregá:
   - `contacto@intercambius.com.ar`
   - `reclamos@intercambius.com.ar`
4. Todo lo del formulario llega a la bandeja de `noreply@` (podés filtrar por destinatario o por asunto `[Contacto web — …]`).

**Opción B — Usuarios o grupos separados:**

1. Creá usuarios (o Grupos de Google) `contacto@` y `reclamos@`.
2. Si son grupos, agregá como miembros a quienes atiendan.
3. Entrá a cada bandeja (o al grupo) para leer los mensajes.

### 4. Enrutamiento por OU (opcional)

Ruta: **Admin → Apps → Google Workspace → Gmail → Enrutamiento**

Con un solo usuario `noreply@` como email principal, **no hace falta agregar reglas** salvo políticas especiales:

- **INTERCAMBIUS:** la regla por defecto suele alcanzar.
- **Workspace Guests:** reglas restrictivas si aplica.

**No configurar:**

| Opción | Motivo |
|--------|--------|
| Puerta de enlace de salida | La app envía desde Vercel, no desde Gmail de usuarios |
| Buzón ajeno a Gmail | Vercel no es servidor SMTP |

### 5. OAuth para Vercel

1. [console.cloud.google.com](https://console.cloud.google.com) → proyecto → habilitar **Gmail API**.
2. **Credenciales OAuth** (tipo Escritorio) → anotar Client ID y Secret.
3. Admin → **Seguridad → Controles de API** → permitir / confiar la app OAuth para el dominio.
4. En `backend/`:
   ```bash
   npm run gmail-oauth-token
   ```
   Autorizá con **`noreply@intercambius.com.ar`**.
5. Guardar `GMAIL_OAUTH_REFRESH_TOKEN`.

### 6. Variables en Vercel (backend)

```env
SMTP_USER=noreply@intercambius.com.ar
SMTP_FROM="Intercambius" <noreply@intercambius.com.ar>
CONTACT_INBOX_EMAIL=contacto@intercambius.com.ar
RECLAMOS_INBOX_EMAIL=reclamos@intercambius.com.ar

GMAIL_OAUTH_CLIENT_ID=...
GMAIL_OAUTH_CLIENT_SECRET=...
GMAIL_OAUTH_REFRESH_TOKEN=...

FRONTEND_URL=https://intercambius.com.ar
```

Redeploy del backend en Production. Los alias del paso **3b** tienen que existir **antes** de probar el formulario.

### Windows: variable `SMTP_USER` del sistema

Si en Windows tenés `SMTP_USER=lautyfigueroalau@gmail.com` (u otra cuenta) a nivel de usuario, **pisaba** el `noreply@` del `.env` y OAuth fallaba con `535 BadCredentials`. El backend usa `load-env` con `override: true` para priorizar `.env`. Igual conviene **borrar** esa variable en Windows:

**Configuración → Sistema → Acerca de → Configuración avanzada del sistema → Variables de entorno → Usuario → eliminar `SMTP_USER`.**

### 7. Pruebas

| Prueba | Resultado esperado |
|--------|-------------------|
| Mail externo a `noreply@` | Llega a la bandeja |
| Registro en la web | Bienvenida desde `noreply@` |
| Login MFA | Código desde `noreply@` |
| Formulario Contactanos (consulta) | Llega a `contacto@` (o a `noreply@` si es alias) |
| Formulario Quejas | Llega a `reclamos@` (o a `noreply@` si es alias) |
| Mailto en el pie del sitio | Abre `contacto@` / flujo de contacto |

### 8. Transición desde Gmail vieja

1. Reenvío temporal de `Intercambius.info@gmail.com` → `noreply@intercambius.com.ar`.
2. Cuando no llegue más tráfico, desactivar reenvío.

---

## Código (referencia)

| Archivo | Valor |
|---------|-------|
| `src/lib/constants.ts` | `CONTACT_EMAIL` → `contacto@`, `COMPLAINTS_EMAIL` → `reclamos@` |
| `backend/.../email.service.ts` | Default `SMTP_FROM` → `noreply@` |
| `backend/.../ContactController.ts` | consulta → `contacto@`, queja → `reclamos@` |

---

## Checklist

- [ ] MX + SPF + DKIM + DMARC
- [ ] Usuario `noreply@intercambius.com.ar` con 2FA
- [ ] Alias `contacto@` y `reclamos@` (paso 3b)
- [ ] OAuth generado con `noreply@`
- [ ] Variables en Vercel (`CONTACT_INBOX_EMAIL`, `RECLAMOS_INBOX_EMAIL`) + redeploy
- [ ] Pruebas de envío y recepción
- [ ] Apagar cuenta Gmail personal vieja
