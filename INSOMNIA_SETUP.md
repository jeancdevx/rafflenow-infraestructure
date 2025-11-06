# Guía de Configuración de Insomnia para RaffleNow API

## 1. Configuración Inicial

### Obtener Información de Cognito

**Desde Terraform:**
```powershell
cd iac/environments/dev
terraform output
```

Necesitarás estos valores:
- **User Pool ID**: Copiar de terraform output
- **Client ID**: Copiar de terraform output
- **Region**: us-east-2 (o tu región)
- **API Base URL**: Copiar de terraform output (api_gateway_invoke_url)

---

## 2. Crear Usuarios de Prueba

### Paso 1: Configurar el Script

**Primera vez:**
```powershell
# Copiar el archivo de ejemplo
cd c:\Dev\rafflenow
Copy-Item scripts/create-test-users.ps1.example scripts/create-test-users.ps1
```

### Paso 2: Obtener User Pool ID

```powershell
# Desde Terraform
cd iac/environments/dev
terraform output

# O desde AWS CLI
aws cognito-idp list-user-pools --max-results 10 --profile your-aws-profile
```

### Paso 3: Editar Configuración

Edita el archivo `scripts/create-test-users.ps1` y reemplaza:

```powershell
# ===== CONFIGURACIÓN PERSONALIZABLE =====
$UserPoolId = "YOUR_USER_POOL_ID"     # ⚙️ Cambiar por: us-east-2_AbCdEfGhI
$Profile = "your-aws-profile"         # ⚙️ Cambiar por: default, jeancdev, etc.
# ========================================
```

**Ejemplo:**
```powershell
$UserPoolId = "us-east-2_0pco0yiVE"  # Tu User Pool ID real
$Profile = "jeancdev"                 # Tu perfil de AWS CLI
```

### Paso 4: Ejecutar el Script

```powershell
# Navegar al directorio del proyecto
cd c:\Dev\rafflenow

# Ejecutar script de creación de usuarios
.\scripts\create-test-users.ps1
```

**Si no configuraste el script, verás:**
```
❌ ERROR: Debes configurar las variables UserPoolId y Profile

Pasos para configurar:
1. Obtén tu User Pool ID:
   cd iac/environments/dev && terraform output

2. Edita este archivo (scripts/create-test-users.ps1) y reemplaza:
   - YOUR_USER_POOL_ID por tu User Pool ID real
   - your-aws-profile por tu perfil AWS CLI

3. Vuelve a ejecutar el script
```

**Salida esperada (configurado correctamente):**
```
=== Creando usuarios de prueba en Cognito ===

Creando usuario Admin...
✓ Usuario Admin creado: admin@rafflenow.com / AdminPass123!

Creando usuario regular...
✓ Usuario regular creado: user@rafflenow.com / UserPass123!

=== Proceso completado ===

Credenciales para Insomnia:
  Admin: admin@rafflenow.com / AdminPass123!
  User:  user@rafflenow.com / UserPass123!
```

> **Nota**: Si los usuarios ya existen, el script mostrará un warning ⚠ pero no fallará.

---

## 3. Configuración en Insomnia

### Paso 1: Crear Environment

En Insomnia, crea un nuevo Environment con las siguientes variables (reemplaza con tus valores reales de terraform output):

```json
{
  "base_url": "TU_API_GATEWAY_URL",
  "user_pool_id": "TU_USER_POOL_ID",
  "client_id": "TU_CLIENT_ID",
  "region": "us-east-2",
  "admin_email": "admin@rafflenow.com",
  "admin_password": "AdminPass123!",
  "user_email": "user@rafflenow.com",
  "user_password": "UserPass123!",
  "admin_token": "",
  "user_token": ""
}
```

### Paso 2: Crear Request para Autenticación (Admin)

**Request Name**: `Auth - Get Admin Token`
- **Method**: POST
- **URL**: `https://cognito-idp.us-east-2.amazonaws.com/`
- **Headers**:
  - `Content-Type`: `application/x-amz-json-1.1`
  - `X-Amz-Target`: `AWSCognitoIdentityProviderService.InitiateAuth`

**Body (JSON)**:
```json
{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "{{ _.client_id }}",
  "AuthParameters": {
    "USERNAME": "{{ _.admin_email }}",
    "PASSWORD": "{{ _.admin_password }}"
  }
}
```

**Response**: Copia el valor de `AuthenticationResult.IdToken` y pégalo en la variable `admin_token` del environment.

### Paso 3: Crear Request para Autenticación (User)

**Request Name**: `Auth - Get User Token`
- **Method**: POST
- **URL**: `https://cognito-idp.us-east-2.amazonaws.com/`
- **Headers**:
  - `Content-Type`: `application/x-amz-json-1.1`
  - `X-Amz-Target`: `AWSCognitoIdentityProviderService.InitiateAuth`

**Body (JSON)**:
```json
{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "{{ _.client_id }}",
  "AuthParameters": {
    "USERNAME": "{{ _.user_email }}",
    "PASSWORD": "{{ _.user_password }}"
  }
}
```

**Response**: Copia el valor de `AuthenticationResult.IdToken` y pégalo en la variable `user_token` del environment.

---

## 4. Requests de la API

### GET /raffles (Público - No requiere auth)

**Request Name**: `GET Raffles`
- **Method**: GET
- **URL**: `{{ _.base_url }}/api/v1/raffles`
- **Headers**: Ninguno especial

### GET /raffles/{id} (Público - No requiere auth)

**Request Name**: `GET Raffle by ID`
- **Method**: GET
- **URL**: `{{ _.base_url }}/api/v1/raffles/{raffle_id}`
- **Headers**: Ninguno especial

### POST /raffles (Admin only)

**Request Name**: `POST Create Raffle (Admin)`
- **Method**: POST
- **URL**: `{{ _.base_url }}/api/v1/raffles`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `{{ _.admin_token }}`

**Body (JSON)**:
```json
{
  "title": "MacBook Pro M3",
  "description": "Sorteo de una MacBook Pro M3 Pro 14 pulgadas",
  "end_date": "2025-11-25",
  "max_participants": 500,
  "prize_image_url": "https://example.com/macbook.jpg"
}
```

### POST /raffles/{id}/participate (User o Admin)

**Request Name**: `POST Participate in Raffle (User)`
- **Method**: POST
- **URL**: `{{ _.base_url }}/api/v1/raffles/{raffle_id}/participate`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `{{ _.user_token }}`

**Body (JSON)**:
```json
{
  "participant_name": "Juan Pérez",
  "participant_email": "user@rafflenow.com"
}
```

### POST /raffles/{id}/close (Admin only)

**Request Name**: `POST Close Raffle (Admin)`
- **Method**: POST
- **URL**: `{{ _.base_url }}/api/v1/raffles/{raffle_id}/close`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `{{ _.admin_token }}`

**Body**: Ninguno

---

## 5. Recrear Usuarios (Después de terraform destroy)

Si destruyes y vuelves a crear la infraestructura con Terraform, los usuarios se perderán. Para recrearlos:

### Paso 1: Obtener nuevo User Pool ID
```powershell
cd iac/environments/dev
terraform output
```

### Paso 2: Actualizar configuración
Edita `scripts/create-test-users.ps1` con el nuevo `UserPoolId`:
```powershell
$UserPoolId = "us-east-2_NUEVOID"  # Nuevo User Pool ID
```

### Paso 3: Ejecutar script
```powershell
.\scripts\create-test-users.ps1
```

> **Nota**: El script está en `.gitignore`, por lo que tus credenciales locales no se subirán al repositorio.

### Alternativa: Comandos CLI Individuales

Si prefieres crear usuarios manualmente:

```powershell
# Variables de configuración
$UserPoolId = "us-east-2_XXXXXXXXX"  # Tu User Pool ID
$Profile = "tu-perfil-aws"            # Tu perfil AWS

# Crear Admin
aws cognito-idp admin-create-user `
  --user-pool-id $UserPoolId `
  --username admin@rafflenow.com `
  --user-attributes Name=email,Value=admin@rafflenow.com Name=email_verified,Value=true `
  --temporary-password "TempAdmin123!" `
  --message-action SUPPRESS `
  --profile $Profile

aws cognito-idp admin-add-user-to-group `
  --user-pool-id $UserPoolId `
  --username admin@rafflenow.com `
  --group-name Admin `
  --profile $Profile

aws cognito-idp admin-set-user-password `
  --user-pool-id $UserPoolId `
  --username admin@rafflenow.com `
  --password "AdminPass123!" `
  --permanent `
  --profile $Profile

# Crear User (repetir pasos similares)
```

---

## 6. Script PowerShell (Referencia)

El script completo está en `scripts/create-test-users.ps1.example`. 

**Uso:**
1. Copia el archivo de ejemplo: `Copy-Item scripts/create-test-users.ps1.example scripts/create-test-users.ps1`
2. Edita `scripts/create-test-users.ps1` con tu configuración
3. Ejecuta el script

**Archivo en el repositorio:** `scripts/create-test-users.ps1.example`

**Tu archivo local (no commiteable):** `scripts/create-test-users.ps1` ← Este está en `.gitignore`

---

## 7. Workflow de Prueba

### Escenario 1: Admin crea raffle
1. Ejecutar `Auth - Get Admin Token`
2. Copiar `IdToken` a variable `admin_token`
3. Ejecutar `POST Create Raffle (Admin)` ✓ Debería funcionar

### Escenario 2: User intenta crear raffle
1. Ejecutar `Auth - Get User Token`
2. Copiar `IdToken` a variable `user_token`
3. Cambiar header Authorization de POST Create Raffle a `{{ _.user_token }}`
4. Ejecutar request ✗ Debería retornar 403 Forbidden

### Escenario 3: User participa en raffle
1. Obtener raffle_id del GET Raffles
2. Usar `user_token` en Authorization
3. Ejecutar `POST Participate in Raffle` ✓ Debería funcionar

### Escenario 4: Sin autenticación
1. Remover header `Authorization`
2. Intentar POST Create Raffle ✗ Debería retornar 401 Unauthorized

---

## 8. Respuestas Esperadas

### 200/201 - Success
```json
{
  "message": "Raffle created successfully",
  "raffle": { ... }
}
```

### 401 - Unauthorized (sin token)
```json
{
  "message": "Unauthorized"
}
```

### 403 - Forbidden (sin permisos)
```json
{
  "message": "Forbidden",
  "error": "Admin role required to create raffles"
}
```

### 400 - Validation Error
```json
{
  "message": "Validation error",
  "error": "prize_image_url is required and cannot be empty"
}
```

---

## 9. Tips y Troubleshooting

### Token expirado
- Los IdTokens expiran después de 60 minutos
- Si recibes 401, vuelve a ejecutar el request de autenticación

### Error "Unauthorized" con token válido
- Verifica que estés usando el **IdToken** no el AccessToken
- Asegúrate de que el token NO incluya "Bearer " (API Gateway lo agrega automáticamente)

### Recrear usuarios después de terraform destroy
- Ejecuta el script `create-test-users.ps1`
- O copia/pega los comandos CLI individuales

### Ver usuarios existentes
```bash
aws cognito-idp list-users \
  --user-pool-id us-east-2_0pco0yiVE \
  --profile jeancdev
```

### Eliminar usuario
```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-2_0pco0yiVE \
  --username admin@rafflenow.com \
  --profile jeancdev
```
