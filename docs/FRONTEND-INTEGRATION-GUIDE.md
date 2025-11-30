# RaffleNow - Guía de Integración Frontend

> Documentación técnica para el equipo de desarrollo del cliente web (Vite + React + TypeScript)

---

## Tabla de Contenidos

1. [Contexto del Proyecto](#1-contexto-del-proyecto)
2. [Arquitectura General](#2-arquitectura-general)
3. [Autenticación con Cognito](#3-autenticación-con-cognito)
4. [APIs y Endpoints](#4-apis-y-endpoints)
5. [Flujos de Usuario](#5-flujos-de-usuario)
6. [Manejo de Errores](#6-manejo-de-errores)
7. [Variables de Entorno](#7-variables-de-entorno)
8. [Requerimientos de UI](#8-requerimientos-de-ui)

---

## 1. Contexto del Proyecto

### ¿Qué es RaffleNow?

RaffleNow es una plataforma de sorteos en línea donde:

- **Administradores** crean sorteos con premios
- **Usuarios** participan en los sorteos activos
- El sistema selecciona ganadores automáticamente al cerrar un sorteo

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Admin** | Crear sorteos, subir imágenes, cerrar sorteos |
| **User** | Ver sorteos, participar en sorteos activos |
| **Público** | Ver lista de sorteos, ver detalle de sorteo |

### Flujo General

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────▶│   Crea      │────▶│  Usuarios   │────▶│   Admin     │
│   Login     │     │   Sorteo    │     │  Participan │     │   Cierra    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │  Ganador    │
                                                           │  Notificado │
                                                           └─────────────┘
```

---

## 2. Arquitectura General

### Stack Backend

- **API Gateway**: Dos APIs separadas (pública y autenticada)
- **Lambda**: Node.js 22.x para procesamiento
- **DynamoDB**: Base de datos NoSQL
- **Cognito**: Autenticación y autorización
- **S3 + CloudFront**: Almacenamiento y CDN de imágenes
- **SES**: Envío de emails (confirmación, ganador)

### URLs Base (Desarrollo)

```typescript
// API Pública (sin autenticación)
const PUBLIC_API = "https://da3lsoqq05.execute-api.us-east-2.amazonaws.com/dev"

// API Autenticada (requiere token JWT)
const AUTH_API = "https://bh0wwtdxak.execute-api.us-east-2.amazonaws.com/dev"

// CDN para imágenes
const CDN_URL = "https://d218s9yrkijnhp.cloudfront.net"
```

---

## 3. Autenticación con Cognito

### Configuración de Cognito

```typescript
// src/config/cognito.ts
export const cognitoConfig = {
  region: "us-east-2",
  userPoolId: "us-east-2_kjacyDfWd",
  clientId: "4o3h81gg0b89or8dsr52hkanh8",
  // Hosted UI (opcional)
  domain: "rafflenow-dev-422228629090-auth",
  authUrl: "https://rafflenow-dev-422228629090-auth.auth.us-east-2.amazoncognito.com"
}
```

### Instalación de AWS Amplify

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### Configuración de Amplify

```typescript
// src/config/amplify.ts
import { Amplify } from 'aws-amplify'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_kjacyDfWd',
      userPoolClientId: '4o3h81gg0b89or8dsr52hkanh8',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true
      },
      userAttributes: {
        email: { required: true },
        given_name: { required: true },
        family_name: { required: true }
      }
    }
  }
})
```

### Flujo de Autenticación

#### Sign Up (Registro)

```typescript
import { signUp, confirmSignUp } from 'aws-amplify/auth'

// 1. Registrar usuario
async function registerUser(email: string, password: string, firstName: string, lastName: string) {
  const { userId, nextStep } = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        given_name: firstName,
        family_name: lastName
      }
    }
  })
  
  // nextStep.signUpStep será 'CONFIRM_SIGN_UP'
  return { userId, nextStep }
}

// 2. Confirmar con código de verificación (enviado por email)
async function confirmUser(email: string, code: string) {
  await confirmSignUp({
    username: email,
    confirmationCode: code
  })
}
```

#### Sign In (Login)

```typescript
import { signIn, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

async function login(email: string, password: string) {
  const { isSignedIn, nextStep } = await signIn({
    username: email,
    password
  })
  
  return { isSignedIn, nextStep }
}

// Obtener usuario actual
async function getUser() {
  const user = await getCurrentUser()
  return user
}

// Obtener token JWT para las APIs
async function getAccessToken(): Promise<string> {
  const session = await fetchAuthSession()
  return session.tokens?.idToken?.toString() || ''
}
```

#### Sign Out (Logout)

```typescript
import { signOut } from 'aws-amplify/auth'

async function logout() {
  await signOut()
}
```

### Enviar Token en Requests

```typescript
// src/lib/api.ts
async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAccessToken()
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token,
      'Content-Type': 'application/json'
    }
  })
}
```

> ℹ️ **Nota sobre User-Agent**: Los navegadores envían automáticamente el header `User-Agent`, por lo que **no necesitas agregarlo manualmente** en tu código React. El WAF valida que exista este header, pero el navegador lo incluye por defecto. Solo herramientas como Insomnia o Postman requieren configurarlo manualmente.

### Grupos de Usuario

Los usuarios pertenecen a grupos que determinan sus permisos:

- `Admin`: Puede crear sorteos, subir imágenes, cerrar sorteos
- `User`: Solo puede participar en sorteos

El grupo se obtiene del token JWT en `cognito:groups`.

---

## 4. APIs y Endpoints

### 4.1 API Pública (Sin autenticación)

Base URL: `https://da3lsoqq05.execute-api.us-east-2.amazonaws.com/dev`

---

#### GET /api/v1/raffles

Lista todos los sorteos con paginación.

**Query Parameters:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `status` | string | No | Filtrar por estado: `active`, `completed`, `cancelled`, `processing` |
| `limit` | number | No | Cantidad de resultados (default: 20, max: 100) |
| `cursor` | string | No | Token de paginación para siguiente página |

**Request:**

```typescript
// Sin filtro
GET /api/v1/raffles

// Con filtro por estado
GET /api/v1/raffles?status=active

// Con paginación
GET /api/v1/raffles?status=active&limit=10&cursor=eyJyYWZmbGVfaWQiOiJ...
```

**Response 200:**

```typescript
interface ListRafflesResponse {
  message: "Raffles retrieved successfully"
  raffles: Raffle[]
  count: number
  has_more: boolean
  next_cursor: string | null
  scanned_count: number
}

interface Raffle {
  raffle_id: string
  title: string
  description: string
  status: "active" | "processing" | "completed" | "cancelled"
  start_date: string  // ISO 8601
  end_date: string    // ISO 8601
  prize_value: number
  category: "pequeño" | "mediano" | "grande" | "premium"
  prize_images: string[]
  max_participants: number
  current_participants: number
  created_at: string
  updated_at: string
}
```

**Ejemplo de uso:**

```typescript
async function listRaffles(status?: string, cursor?: string) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (cursor) params.append('cursor', cursor)
  
  const response = await fetch(`${PUBLIC_API}/api/v1/raffles?${params}`)
  
  return response.json()
}
```

---

#### GET /api/v1/raffles/{id}

Obtiene el detalle de un sorteo específico.

**Path Parameters:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID del sorteo (formato: `raffle-uuid`) |

**Request:**

```typescript
GET /api/v1/raffles/raffle-550e8400-e29b-41d4-a716-446655440000
```

**Response 200 (Sorteo Activo):**

```typescript
interface ActiveRaffleResponse {
  raffle_id: string
  title: string
  description: string
  status: "active"
  start_date: string
  end_date: string
  prize_value: number
  category: string
  prize_images: string[]
  created_at: string
  updated_at: string
  user_has_participated: boolean  // Si el usuario logueado ya participó
  max_participants: number
  current_participants: number
  participation_percentage: number  // 0-100
  days_remaining: number
  can_participate: boolean
}
```

**Response 200 (Sorteo en Procesamiento):**

```typescript
interface ProcessingRaffleResponse {
  raffle_id: string
  title: string
  description: string
  status: "processing"
  start_date: string
  end_date: string
  prize_value: number
  category: string
  prize_images: string[]
  created_at: string
  updated_at: string
  user_has_participated: boolean
  max_participants: number
  message: "Seleccionando ganador..."
  participation_percentage: 100
  days_remaining: 0
  can_participate: false
}
```

**Response 200 (Sorteo Completado):**

```typescript
interface CompletedRaffleResponse {
  raffle_id: string
  title: string
  description: string
  status: "completed"
  start_date: string
  end_date: string
  prize_value: number
  category: string
  prize_images: string[]
  created_at: string
  updated_at: string
  user_has_participated: boolean
  max_participants: number
  total_participants: number
  winner_name: string | null
  winner_selected_at: string | null
  completed_at: string | null
  participation_percentage: 100
  days_remaining: 0
  can_participate: false
}
```

**Response 200 (Sorteo Cancelado):**

```typescript
interface CancelledRaffleResponse {
  raffle_id: string
  title: string
  description: string
  status: "cancelled"
  start_date: string
  end_date: string
  prize_value: number
  category: string
  prize_images: string[]
  created_at: string
  updated_at: string
  user_has_participated: boolean
  cancellation_reason: string
  cancelled_at: string | null
  cancelled_by: string | null
  participation_percentage: number
  days_remaining: 0
  can_participate: false
}
```

**Response 404:**

```typescript
{
  "error": "Raffle not found"
}
```

---

### 4.2 API Autenticada (Requiere JWT)

Base URL: `https://bh0wwtdxak.execute-api.us-east-2.amazonaws.com/dev`

> ⚠️ Todos los endpoints requieren el header `Authorization` con el token JWT de Cognito.

---

#### POST /api/v1/raffles

Crea un nuevo sorteo. **Solo Admin**.

**Headers:**

```
Authorization: <JWT Token>
Content-Type: application/json
```

**Request Body:**

```typescript
interface CreateRaffleRequest {
  title: string           // 10-200 caracteres
  description: string     // 50-2000 caracteres
  prize_value: number     // 100 - 3,000,000 (en soles)
  prize_images: string[]  // 1-5 URLs de CloudFront
}
```

**Validaciones:**

| Campo | Regla |
|-------|-------|
| `title` | Mínimo 10, máximo 200 caracteres |
| `description` | Mínimo 50, máximo 2000 caracteres |
| `prize_value` | Entre 100 y 3,000,000 |
| `prize_images` | Array de 1-5 URLs válidas |

**Campos Calculados Automáticamente:**

El backend calcula automáticamente basado en `prize_value`:

| prize_value | Categoría | Duración | Max Participantes |
|-------------|-----------|----------|-------------------|
| < 500 | pequeño | 7 días | 3,600 |
| 500 - 4,999 | mediano | 14 días | 60,000 |
| 5,000 - 49,999 | grande | 30 días | 300,000 |
| ≥ 50,000 | premium | 60 días | 1,800,000 |

**Request Example:**

```typescript
const createRaffle = async (data: CreateRaffleRequest) => {
  const token = await getAccessToken()
  
  const response = await fetch(`${AUTH_API}/api/v1/raffles`, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: "iPhone 15 Pro Max 256GB",
      description: "Participa en este increíble sorteo para ganar un iPhone 15 Pro Max completamente nuevo, sellado, con garantía de Apple por 1 año.",
      prize_value: 5500,
      prize_images: [
        "https://d218s9yrkijnhp.cloudfront.net/optimized/abc123.webp"
      ]
    })
  })
  
  return response.json()
}
```

**Response 201:**

```typescript
{
  "message": "Raffle created successfully",
  "raffle": {
    "raffle_id": "raffle-550e8400-e29b-41d4-a716-446655440000",
    "title": "iPhone 15 Pro Max 256GB",
    "description": "...",
    "status": "active",
    "start_date": "2025-11-29T12:00:00.000Z",
    "end_date": "2025-12-29T23:59:00.000Z",
    "prize_value": 5500,
    "category": "grande",
    "max_participants": 300000,
    "current_participants": 0,
    "prize_images": ["https://..."],
    "created_by": "admin@rafflenow.com",
    "created_at": "2025-11-29T12:00:00.000Z",
    "updated_at": "2025-11-29T12:00:00.000Z"
  }
}
```

**Response 400 (Validation Error):**

```typescript
{
  "message": "Validation error",
  "error": "Title must be at least 10 characters",
  "current_length": 5
}
```

**Response 401:**

```typescript
{
  "message": "Authorization token is required"
}
```

**Response 403:**

```typescript
{
  "message": "Admin access required"
}
```

---

#### POST /api/v1/raffles/{id}/participate

Participa en un sorteo. **Solo User** (no Admin).

**Headers:**

```
Authorization: <JWT Token>
Content-Type: application/json
```

**Path Parameters:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID del sorteo |

**Request:**

```typescript
POST /api/v1/raffles/raffle-550e8400-e29b-41d4-a716-446655440000/participate
```

> ℹ️ No requiere body. Los datos del participante se extraen del token JWT.

**Response 202:**

```typescript
{
  "message": "Participation request accepted",
  "raffle_id": "raffle-550e8400-e29b-41d4-a716-446655440000",
  "participant_email": "usuario@email.com"
}
```

> ℹ️ El código 202 indica que la participación fue aceptada y está siendo procesada asincrónicamente.

**Response 403 (Admin no puede participar):**

```typescript
{
  "message": "Admins cannot participate in raffles"
}
```

**Response 404:**

```typescript
{
  "message": "Raffle not found"
}
```

**Response 409 (Ya participó):**

```typescript
{
  "message": "You have already participated in this raffle",
  "participated_at": "2025-11-29T10:30:00.000Z"
}
```

**Response 409 (Sorteo lleno):**

```typescript
{
  "message": "Raffle has reached maximum participants"
}
```

**Response 409 (Sorteo no activo):**

```typescript
{
  "message": "Raffle is not active"
}
```

---

#### POST /api/v1/raffles/{id}/close

Cierra un sorteo e inicia la selección del ganador. **Solo Admin**.

**Headers:**

```
Authorization: <JWT Token>
Content-Type: application/json
```

**Path Parameters:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID del sorteo |

**Request:**

```typescript
POST /api/v1/raffles/raffle-550e8400-e29b-41d4-a716-446655440000/close
```

**Response 200 (Con participantes):**

```typescript
{
  "message": "Raffle closed successfully and winner selection initiated",
  "raffle": {
    "raffle_id": "raffle-550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "closed_by": "admin-user-id",
    "closed_at": "2025-11-29T18:00:00.000Z",
    // ... otros campos
  }
}
```

**Response 200 (Sin participantes):**

```typescript
{
  "message": "Raffle closed successfully without participants",
  "raffle": {
    "raffle_id": "raffle-550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "closed_by": "admin-user-id",
    "closed_at": "2025-11-29T18:00:00.000Z",
    // ... otros campos
  }
}
```

**Response 409:**

```typescript
{
  "message": "Raffle is not in active status or was already closed"
}
```

---

#### POST /api/v1/assets/upload

Genera una URL pre-firmada para subir imágenes a S3. **Solo Admin**.

**Headers:**

```
Authorization: <JWT Token>
Content-Type: application/json
```

**Request Body:**

```typescript
interface UploadRequest {
  fileName: string   // Nombre del archivo con extensión
  fileType: string   // MIME type
  fileSize?: number  // Tamaño en bytes (opcional, max 10MB)
}
```

**MIME Types permitidos:**

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`

**Request Example:**

```typescript
const getUploadUrl = async (file: File) => {
  const token = await getAccessToken()
  
  const response = await fetch(`${AUTH_API}/api/v1/assets/upload`, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })
  })
  
  return response.json()
}
```

**Response 200:**

```typescript
{
  "message": "Presigned URL generated successfully",
  "upload": {
    "url": "https://rafflenow-dev-xxx-assets.s3.us-east-2.amazonaws.com/...",
    "method": "PUT",
    "headers": {
      "Content-Type": "image/jpeg"
    },
    "expiresIn": 300  // 5 minutos
  },
  "file": {
    "key": "uploads/admin@email.com/1701234567890-imagen.jpg",
    "cloudFrontUrl": "https://d218s9yrkijnhp.cloudfront.net/optimized/1701234567890-imagen.webp",
    "originalUrl": "https://d218s9yrkijnhp.cloudfront.net/uploads/admin@email.com/1701234567890-imagen.jpg",
    "fileName": "imagen.jpg"
  },
  "instructions": [
    "1. Use PUT method to upload the file to the presigned URL",
    "2. Set Content-Type header to match the file type",
    "3. Once uploaded, use the cloudFrontUrl (optimized) in your raffle",
    "4. The URL expires in 300 seconds (5 minutes)",
    "5. Image will be automatically optimized to WebP format"
  ]
}
```

### Flujo completo de subida de imagen:

```typescript
async function uploadImage(file: File): Promise<string> {
  // 1. Obtener URL pre-firmada
  const { upload, file: fileInfo } = await getUploadUrl(file)
  
  // 2. Subir archivo directamente a S3
  await fetch(upload.url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  })
  
  // 3. Retornar URL de CloudFront (optimizada)
  return fileInfo.cloudFrontUrl
}

// Uso en formulario de crear sorteo
const handleSubmit = async (formData: FormData) => {
  // Subir todas las imágenes
  const imageUrls = await Promise.all(
    selectedFiles.map(file => uploadImage(file))
  )
  
  // Crear sorteo con las URLs
  await createRaffle({
    title: formData.title,
    description: formData.description,
    prize_value: formData.prizeValue,
    prize_images: imageUrls
  })
}
```

---

## 5. Flujos de Usuario

### 5.1 Flujo de Registro

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Formulario  │────▶│   signUp()   │────▶│    Email     │────▶│ confirmSign  │
│   Registro   │     │   Cognito    │     │  Verificar   │     │    Up()      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
                                                                      ▼
                                                              ┌──────────────┐
                                                              │   Redirect   │
                                                              │   /sign-in   │
                                                              └──────────────┘
```

### 5.2 Flujo de Participación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Ver Sorteo  │────▶│   Validar    │────▶│    POST      │────▶│   Response   │
│   Detalle    │     │   Logged In  │     │  /participate│     │     202      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │                                         │
                            │ No logged                               ▼
                            ▼                                 ┌──────────────┐
                    ┌──────────────┐                          │    Email     │
                    │   Redirect   │                          │ Confirmación │
                    │   /sign-in   │                          └──────────────┘
                    └──────────────┘
```

### 5.3 Flujo de Crear Sorteo (Admin)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Seleccionar │────▶│   Obtener    │────▶│   Subir a    │────▶│   Obtener    │
│   Imágenes   │     │  Upload URL  │     │     S3       │     │ CloudFront   │
└──────────────┘     └──────────────┘     └──────────────┘     │    URLs      │
                                                               └──────────────┘
                                                                      │
                     ┌──────────────┐     ┌──────────────┐            │
                     │   Sorteo     │◀────│    POST      │◀───────────┘
                     │   Creado     │     │   /raffles   │
                     └──────────────┘     └──────────────┘
```

---

## 6. Manejo de Errores

### Códigos HTTP

| Código | Significado | Acción Recomendada |
|--------|-------------|-------------------|
| 200 | Éxito | Procesar respuesta |
| 201 | Creado | Mostrar confirmación |
| 202 | Aceptado | Mostrar "procesando" |
| 400 | Validación | Mostrar error al usuario |
| 401 | No autenticado | Redirigir a login |
| 403 | Sin permisos | Mostrar acceso denegado |
| 404 | No encontrado | Mostrar "no existe" |
| 409 | Conflicto | Mostrar mensaje específico |
| 429 | Rate limit | Esperar y reintentar |
| 500 | Error servidor | Mostrar error genérico |

### Estructura de Errores

```typescript
interface ApiError {
  message: string
  error?: string
  [key: string]: any  // Campos adicionales según el error
}
```

### Hook de manejo de errores

```typescript
// src/hooks/useApiError.ts
import { useToast } from '@/components/ui/use-toast'

export function useApiError() {
  const { toast } = useToast()
  
  const handleError = (error: Response, data: ApiError) => {
    switch (error.status) {
      case 401:
        // Token expirado o inválido
        signOut()
        window.location.href = '/sign-in'
        break
        
      case 403:
        toast({
          variant: 'destructive',
          title: 'Acceso denegado',
          description: data.message
        })
        break
        
      case 409:
        toast({
          variant: 'warning',
          title: 'Conflicto',
          description: data.message
        })
        break
        
      case 429:
        toast({
          variant: 'destructive',
          title: 'Demasiadas solicitudes',
          description: 'Por favor espera un momento'
        })
        break
        
      default:
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'Ha ocurrido un error'
        })
    }
  }
  
  return { handleError }
}
```

---

## 7. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
VITE_PUBLIC_API_URL=https://da3lsoqq05.execute-api.us-east-2.amazonaws.com/dev
VITE_AUTH_API_URL=https://bh0wwtdxak.execute-api.us-east-2.amazonaws.com/dev
VITE_CDN_URL=https://d218s9yrkijnhp.cloudfront.net

# Cognito
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_USER_POOL_ID=us-east-2_kjacyDfWd
VITE_COGNITO_CLIENT_ID=4o3h81gg0b89or8dsr52hkanh8
```

### Uso en código

```typescript
// src/config/env.ts
export const env = {
  publicApiUrl: import.meta.env.VITE_PUBLIC_API_URL,
  authApiUrl: import.meta.env.VITE_AUTH_API_URL,
  cdnUrl: import.meta.env.VITE_CDN_URL,
  cognito: {
    region: import.meta.env.VITE_COGNITO_REGION,
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID
  }
}
```

---

## 8. Requerimientos de UI

### Librería de Componentes

El proyecto debe usar **shadcn/ui** como librería de componentes.

```bash
# Instalación
npx shadcn@latest init

# Componentes recomendados
npx shadcn@latest add button card badge progress skeleton toast dialog alert separator avatar input label textarea
```

### Dependencias Adicionales

```bash
# Dropzone para subir imágenes
npm install react-dropzone

# Iconos
npm install lucide-react
```

---

### Layout del Detalle de Sorteo (Activo)

El detalle de un sorteo activo tiene un layout de dos columnas: **60%** para imágenes (izquierda) y **40%** para información (derecha).

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          DETALLE DEL SORTEO                                   │
├──────────────────────────────────────────┬────────────────────────────────────┤
│             60% - IMÁGENES               │         40% - INFORMACIÓN          │
├──────────────────────────────────────────┼────────────────────────────────────┤
│                                          │                                    │
│   ┌──────────────────────────────────┐   │   TÍTULO DEL SORTEO       [Activo] │
│   │                                  │   │   ─────────────────                │
│   │                                  │   │                                    │
│   │         COVER IMAGE              │   │   Tiempo restante:                 │
│   │         (Primera URL)            │   │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│   │                                  │   │   │ 12  │ │ 05  │ │ 32  │ │ 48  │ │
│   │                                  │   │   │días │ │hrs  │ │min  │ │seg  │ │
│   │                                  │   │   └─────┘ └─────┘ └─────┘ └─────┘ │
│   └──────────────────────────────────┘   │                                    │
│                                          │   Participantes: 1,234 / 60,000    │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │   ████████████░░░░░░░░░░░  45%     │
│   │      │ │      │ │      │ │      │   │                                    │
│   │  T1  │ │  T2  │ │  T3  │ │  T4  │   │   ┌────────────────────────────┐   │
│   │      │ │      │ │      │ │      │   │   │   PARTICIPAR EN SORTEO     │   │
│   └──────┘ └──────┘ └──────┘ └──────┘   │   └────────────────────────────┘   │
│   (Thumbnails - click para              │                                    │
│    intercambiar con cover)              │   ─────────────────────────────    │
│                                          │                                    │
│                                          │   Descripción                      │
│                                          │   Lorem ipsum dolor sit amet...    │
│                                          │                                    │
│                                          │   ─────────────────────────────    │
│                                          │   📅 Inicio: 15 Nov 2025           │
│                                          │   📅 Cierre: 15 Dic 2025           │
│                                          │   💰 Valor: S/5,500                │
│                                          │   🏷️ Categoría: Grande             │
│                                          │                                    │
└──────────────────────────────────────────┴────────────────────────────────────┘

NOTAS:
- El botón de participar está DEBAJO de la barra de progreso de participantes
- El layout usa grid-cols-[3fr_2fr] para lograr la proporción 60/40
- En móvil (< lg) cambia a una sola columna apilada
```

### Galería de Imágenes con Cover + Thumbnails

```typescript
// src/components/raffle-image-gallery.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface RaffleImageGalleryProps {
  images: string[]
  title: string
}

export function RaffleImageGallery({ images, title }: RaffleImageGalleryProps) {
  const [coverIndex, setCoverIndex] = useState(0)
  
  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Sin imágenes</span>
      </div>
    )
  }

  const coverImage = images[coverIndex]
  const thumbnails = images.filter((_, index) => index !== coverIndex)

  const handleThumbnailClick = (originalIndex: number) => {
    setCoverIndex(originalIndex)
  }

  return (
    <div className="space-y-3">
      {/* Cover Image */}
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img
          src={coverImage}
          alt={`${title} - Imagen principal`}
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                index === coverIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <img
                src={image}
                alt={`${title} - Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === coverIndex && (
                <div className="absolute inset-0 bg-primary/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Contador Regresivo

```typescript
// src/components/countdown-timer.tsx
import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  endDate: string
  onExpire?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ endDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())

  function calculateTimeLeft(): TimeLeft {
    const difference = new Date(endDate).getTime() - new Date().getTime()
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)
      
      // Verificar si expiró
      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        clearInterval(timer)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, onExpire])

  return (
    <div className="flex gap-2 justify-center sm:justify-start">
      <TimeUnit value={timeLeft.days} label="días" />
      <TimeUnit value={timeLeft.hours} label="hrs" />
      <TimeUnit value={timeLeft.minutes} label="min" />
      <TimeUnit value={timeLeft.seconds} label="seg" />
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-muted rounded-lg p-3 min-w-[60px]">
      <span className="text-2xl font-bold tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
```

### Componente Completo del Detalle (Sorteo Activo)

```typescript
// src/components/active-raffle-detail.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, DollarSign, Tag, Users } from 'lucide-react'
import { RaffleImageGallery } from './raffle-image-gallery'
import { CountdownTimer } from './countdown-timer'
import { ParticipateButton } from './participate-button'

interface ActiveRaffleDetailProps {
  raffle: ActiveRaffleResponse
  onParticipate: () => Promise<void>
  isParticipating: boolean
}

export function ActiveRaffleDetail({ 
  raffle, 
  onParticipate, 
  isParticipating 
}: ActiveRaffleDetailProps) {
  
  const handleExpire = () => {
    // Refrescar datos cuando el sorteo expire
    window.location.reload()
  }

  return (
    // Layout: 60% imágenes (izquierda) / 40% información (derecha)
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
      {/* Columna Izquierda - Galería de Imágenes (60%) */}
      <div>
        <RaffleImageGallery 
          images={raffle.prize_images} 
          title={raffle.title} 
        />
      </div>

      {/* Columna Derecha - Información del Sorteo (40%) */}
      <div className="space-y-6">
        {/* Título y Badge */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold">{raffle.title}</h1>
            <Badge className="bg-green-500 flex-shrink-0">Activo</Badge>
          </div>
        </div>

        {/* Contador Regresivo */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Tiempo restante</p>
          <CountdownTimer endDate={raffle.end_date} onExpire={handleExpire} />
        </div>

        {/* Barra de Progreso de Participantes + Botón de Participación */}
        <div className="space-y-4">
          {/* Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Participantes
              </span>
              <span className="font-medium">
                {raffle.current_participants.toLocaleString()} / {raffle.max_participants.toLocaleString()}
              </span>
            </div>
            <Progress value={raffle.participation_percentage} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">
              {raffle.participation_percentage}% completado
            </p>
          </div>

          {/* Botón de Participación - Debajo de la barra de progreso */}
          <ParticipateButton
            canParticipate={raffle.can_participate}
            userHasParticipated={raffle.user_has_participated}
            onParticipate={onParticipate}
            isParticipating={isParticipating}
          />
        </div>

        <Separator />

        {/* Descripción */}
        <div>
          <h3 className="font-semibold mb-2">Descripción</h3>
          <p className="text-muted-foreground whitespace-pre-line">
            {raffle.description}
          </p>
        </div>

        <Separator />

        {/* Detalles del Sorteo */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Fecha de inicio</p>
              <p className="font-medium">
                {new Date(raffle.start_date).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Fecha de cierre</p>
              <p className="font-medium">
                {new Date(raffle.end_date).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Valor del premio</p>
              <p className="font-medium">S/{raffle.prize_value.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Categoría</p>
              <p className="font-medium capitalize">{raffle.category}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Dropzone para Subir Imágenes (Admin)

Componente para que los admins suban imágenes al crear un sorteo:

```typescript
// src/components/image-dropzone.tsx
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageFile {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  cloudFrontUrl?: string
  error?: string
}

interface ImageDropzoneProps {
  maxFiles?: number
  maxSizeMB?: number
  onImagesChange: (urls: string[]) => void
  uploadImage: (file: File) => Promise<string>
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
}

export function ImageDropzone({ 
  maxFiles = 5, 
  maxSizeMB = 10,
  onImagesChange,
  uploadImage
}: ImageDropzoneProps) {
  const [images, setImages] = useState<ImageFile[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Verificar límite de archivos
    const remaining = maxFiles - images.length
    const filesToAdd = acceptedFiles.slice(0, remaining)

    if (filesToAdd.length === 0) return

    // Crear previews locales
    const newImages: ImageFile[] = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploaded: false
    }))

    setImages(prev => [...prev, ...newImages])

    // Subir cada imagen
    for (let i = 0; i < newImages.length; i++) {
      const imageFile = newImages[i]
      
      try {
        const cloudFrontUrl = await uploadImage(imageFile.file)
        
        setImages(prev => prev.map(img => 
          img.preview === imageFile.preview
            ? { ...img, uploading: false, uploaded: true, cloudFrontUrl }
            : img
        ))
      } catch (error) {
        setImages(prev => prev.map(img =>
          img.preview === imageFile.preview
            ? { ...img, uploading: false, error: 'Error al subir' }
            : img
        ))
      }
    }

    // Actualizar URLs para el formulario
    updateUrls()
  }, [images, maxFiles, uploadImage])

  const updateUrls = () => {
    setImages(prev => {
      const urls = prev
        .filter(img => img.uploaded && img.cloudFrontUrl)
        .map(img => img.cloudFrontUrl!)
      onImagesChange(urls)
      return prev
    })
  }

  const removeImage = (preview: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.preview !== preview)
      const urls = updated
        .filter(img => img.uploaded && img.cloudFrontUrl)
        .map(img => img.cloudFrontUrl!)
      onImagesChange(urls)
      return updated
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: maxFiles - images.length,
    disabled: images.length >= maxFiles
  })

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          images.length >= maxFiles && "opacity-50 cursor-not-allowed",
          !isDragActive && "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        
        {isDragActive ? (
          <p className="text-primary">Suelta las imágenes aquí...</p>
        ) : images.length >= maxFiles ? (
          <p className="text-muted-foreground">Límite de {maxFiles} imágenes alcanzado</p>
        ) : (
          <div>
            <p className="font-medium">Arrastra imágenes aquí o haz click para seleccionar</p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG, WebP o GIF. Máximo {maxSizeMB}MB por imagen.
            </p>
            <p className="text-sm text-muted-foreground">
              {images.length} de {maxFiles} imágenes
            </p>
          </div>
        )}
      </div>

      {/* Preview de Imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div 
              key={image.preview} 
              className="relative aspect-square rounded-lg overflow-hidden border"
            >
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de estado */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              
              {image.error && (
                <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
                  <p className="text-white text-xs text-center px-2">{image.error}</p>
                </div>
              )}

              {image.uploaded && (
                <div className="absolute top-1 left-1">
                  <div className="bg-green-500 rounded-full p-1">
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              {/* Botón eliminar */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(image.preview)}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Indicador de primera imagen */}
              {index === 0 && (
                <div className="absolute bottom-1 left-1 right-1">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Cover
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Uso del Dropzone en Formulario de Crear Sorteo

El formulario utiliza el componente `Form` de shadcn/ui con `react-hook-form` y `zod` para validación.

#### Instalación de Dependencias

```bash
npm install react-hook-form zod @hookform/resolvers
```

```bash
npx shadcn@latest add form
```

#### Schema de Validación

```typescript
// src/lib/validations/raffle.ts
import { z } from 'zod'

export const createRaffleSchema = z.object({
  title: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  prize_value: z
    .number()
    .min(100, 'El valor mínimo es S/100')
    .max(3000000, 'El valor máximo es S/3,000,000'),
  prize_images: z
    .array(z.string().url())
    .min(1, 'Debes subir al menos una imagen')
    .max(5, 'Máximo 5 imágenes')
})

export type CreateRaffleFormValues = z.infer<typeof createRaffleSchema>
```

#### Componente del Formulario

```typescript
// src/components/create-raffle-form.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageDropzone } from './image-dropzone'
import { createRaffleSchema, type CreateRaffleFormValues } from '@/lib/validations/raffle'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { getUploadUrl } from '@/lib/api'

export function CreateRaffleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateRaffleFormValues>({
    resolver: zodResolver(createRaffleSchema),
    defaultValues: {
      title: '',
      description: '',
      prize_value: undefined,
      prize_images: []
    }
  })

  // Función para subir una imagen
  const uploadImage = async (file: File): Promise<string> => {
    // 1. Obtener URL pre-firmada
    const { upload, file: fileInfo } = await getUploadUrl(file)
    
    // 2. Subir a S3
    await fetch(upload.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    })
    
    // 3. Retornar URL de CloudFront
    return fileInfo.cloudFrontUrl
  }

  const onSubmit = async (values: CreateRaffleFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Crear sorteo con las URLs de las imágenes ya subidas
      await createRaffle({
        title: values.title,
        description: values.description,
        prize_value: values.prize_value,
        prize_images: values.prize_images
      })
      
      toast({
        title: '¡Sorteo creado!',
        description: 'El sorteo se ha creado exitosamente.',
      })

      // Resetear formulario
      form.reset()
      
      // Redirigir
      // router.push('/admin/raffles')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear el sorteo',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Imágenes del Premio */}
        <FormField
          control={form.control}
          name="prize_images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imágenes del Premio *</FormLabel>
              <FormDescription>
                La primera imagen será la imagen principal (cover)
              </FormDescription>
              <FormControl>
                <ImageDropzone
                  maxFiles={5}
                  maxSizeMB={10}
                  onImagesChange={field.onChange}
                  uploadImage={uploadImage}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Sorteo *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: iPhone 15 Pro Max 256GB"
                  maxLength={200}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/200 caracteres (mínimo 10)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el premio y las condiciones del sorteo..."
                  maxLength={2000}
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/2000 caracteres (mínimo 50)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor del Premio */}
        <FormField
          control={form.control}
          name="prize_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor del Premio (S/) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5500"
                  min={100}
                  max={3000000}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>
                Entre S/100 y S/3,000,000. La duración y categoría se calculan automáticamente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando sorteo...
            </>
          ) : (
            'Crear Sorteo'
          )}
        </Button>
      </form>
    </Form>
  )
}
```

---

### Detalle del Sorteo por Estado

El componente de detalle del sorteo debe renderizar contenido diferente según el estado:

```typescript
// src/components/raffle-detail.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, CheckCircle, XCircle, Trophy } from 'lucide-react'

interface RaffleDetailProps {
  raffle: Raffle
  onParticipate: () => Promise<void>
  isParticipating: boolean
}

export function RaffleDetail({ raffle, onParticipate, isParticipating }: RaffleDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{raffle.title}</CardTitle>
          <StatusBadge status={raffle.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Contenido común */}
        <RaffleImages images={raffle.prize_images} />
        <p className="text-muted-foreground">{raffle.description}</p>
        
        {/* Contenido específico por estado */}
        {raffle.status === 'active' && (
          <ActiveRaffleContent 
            raffle={raffle} 
            onParticipate={onParticipate}
            isParticipating={isParticipating}
          />
        )}
        
        {raffle.status === 'processing' && (
          <ProcessingRaffleContent raffle={raffle} />
        )}
        
        {raffle.status === 'completed' && (
          <CompletedRaffleContent raffle={raffle} />
        )}
        
        {raffle.status === 'cancelled' && (
          <CancelledRaffleContent raffle={raffle} />
        )}
      </CardContent>
    </Card>
  )
}
```

#### Componente StatusBadge

```typescript
function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: { variant: 'default', label: 'Activo', className: 'bg-green-500' },
    processing: { variant: 'secondary', label: 'Procesando', className: 'bg-yellow-500' },
    completed: { variant: 'outline', label: 'Finalizado', className: 'bg-blue-500' },
    cancelled: { variant: 'destructive', label: 'Cancelado', className: '' }
  }
  
  const config = variants[status] || variants.active
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
```

#### Contenido para Sorteo Activo

```typescript
function ActiveRaffleContent({ 
  raffle, 
  onParticipate, 
  isParticipating 
}: { 
  raffle: ActiveRaffleResponse
  onParticipate: () => Promise<void>
  isParticipating: boolean 
}) {
  return (
    <div className="space-y-4">
      {/* Progreso de participantes */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>{raffle.current_participants.toLocaleString()} participantes</span>
          <span>{raffle.participation_percentage}%</span>
        </div>
        <Progress value={raffle.participation_percentage} />
      </div>
      
      {/* Días restantes */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>⏰ {raffle.days_remaining} días restantes</span>
      </div>
      
      {/* Botón de participación */}
      <ParticipateButton 
        canParticipate={raffle.can_participate}
        userHasParticipated={raffle.user_has_participated}
        onParticipate={onParticipate}
        isParticipating={isParticipating}
      />
    </div>
  )
}
```

#### Contenido para Sorteo en Procesamiento

```typescript
function ProcessingRaffleContent({ raffle }: { raffle: ProcessingRaffleResponse }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">{raffle.message}</p>
      <p className="text-sm text-muted-foreground">
        El ganador será anunciado pronto
      </p>
    </div>
  )
}
```

#### Contenido para Sorteo Completado

```typescript
function CompletedRaffleContent({ raffle }: { raffle: CompletedRaffleResponse }) {
  return (
    <div className="space-y-4">
      {/* Ganador */}
      {raffle.winner_name && (
        <div className="flex flex-col items-center py-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
          <Trophy className="h-12 w-12 text-yellow-500 mb-2" />
          <p className="text-sm text-muted-foreground">Ganador</p>
          <p className="text-xl font-bold">{raffle.winner_name}</p>
          {raffle.winner_selected_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Seleccionado el {new Date(raffle.winner_selected_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      
      {/* Estadísticas finales */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{raffle.total_participants.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Participantes totales</p>
        </div>
        <div>
          <p className="text-2xl font-bold">S/{raffle.prize_value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Valor del premio</p>
        </div>
      </div>
      
      {/* Si el usuario participó */}
      {raffle.user_has_participated && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <span className="text-sm">Participaste en este sorteo</span>
        </div>
      )}
    </div>
  )
}
```

#### Contenido para Sorteo Cancelado

```typescript
function CancelledRaffleContent({ raffle }: { raffle: CancelledRaffleResponse }) {
  return (
    <div className="flex flex-col items-center py-6 space-y-2">
      <XCircle className="h-12 w-12 text-destructive" />
      <p className="text-lg font-medium">Sorteo Cancelado</p>
      <p className="text-sm text-muted-foreground text-center">
        {raffle.cancellation_reason}
      </p>
      {raffle.cancelled_at && (
        <p className="text-xs text-muted-foreground">
          Cancelado el {new Date(raffle.cancelled_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
```

### Botón de Participación (Optimistic UI)

El botón de participación tiene un comportamiento especial para evitar múltiples peticiones:

```typescript
// src/components/participate-button.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ParticipateButtonProps {
  canParticipate: boolean
  userHasParticipated: boolean
  onParticipate: () => Promise<void>
  isParticipating: boolean
}

type ButtonState = 'idle' | 'loading' | 'pending' | 'success' | 'error'

export function ParticipateButton({
  canParticipate,
  userHasParticipated,
  onParticipate,
  isParticipating
}: ParticipateButtonProps) {
  const [buttonState, setButtonState] = useState<ButtonState>(
    userHasParticipated ? 'success' : 'idle'
  )
  const { toast } = useToast()

  // Si ya participó, mostrar estado de éxito permanente
  if (userHasParticipated || buttonState === 'success') {
    return (
      <Button disabled className="w-full bg-green-500 hover:bg-green-500">
        <CheckCircle className="mr-2 h-4 w-4" />
        Ya estás participando
      </Button>
    )
  }

  // Si no puede participar (no logueado o es admin)
  if (!canParticipate && buttonState === 'idle') {
    return (
      <Button disabled className="w-full">
        No disponible
      </Button>
    )
  }

  const handleClick = async () => {
    // 1. Deshabilitar inmediatamente al primer click
    setButtonState('loading')
    
    try {
      // 2. Hacer la petición
      await onParticipate()
      
      // 3. Cambiar a estado "pendiente" (en cola)
      setButtonState('pending')
      
      toast({
        title: '¡Solicitud enviada!',
        description: 'Tu participación está siendo procesada...',
      })
      
      // 4. Después de un momento, mostrar éxito
      // (En producción, esto debería venir de un refresh o websocket)
      setTimeout(() => {
        setButtonState('success')
        toast({
          title: '¡Participación confirmada!',
          description: 'Ya estás participando en el sorteo.',
        })
      }, 2000)
      
    } catch (error) {
      setButtonState('error')
      
      // Permitir reintentar después de un error
      setTimeout(() => {
        setButtonState('idle')
      }, 3000)
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo procesar tu participación',
      })
    }
  }

  // Estado: Cargando (petición en curso)
  if (buttonState === 'loading' || isParticipating) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Enviando solicitud...
      </Button>
    )
  }

  // Estado: Pendiente (en cola)
  if (buttonState === 'pending') {
    return (
      <Button disabled className="w-full bg-yellow-500 hover:bg-yellow-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        En cola de procesamiento...
      </Button>
    )
  }

  // Estado: Error (permite reintentar)
  if (buttonState === 'error') {
    return (
      <Button disabled variant="destructive" className="w-full">
        Error - Reintentando...
      </Button>
    )
  }

  // Estado: Idle (listo para participar)
  return (
    <Button onClick={handleClick} className="w-full">
      Participar en el sorteo
    </Button>
  )
}
```

### Hook para Participación

```typescript
// src/hooks/use-participate.ts
import { useState } from 'react'
import { participateInRaffle } from '@/lib/api'

export function useParticipate(raffleId: string) {
  const [isParticipating, setIsParticipating] = useState(false)
  const [hasParticipated, setHasParticipated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const participate = async () => {
    if (isParticipating || hasParticipated) return
    
    setIsParticipating(true)
    setError(null)
    
    try {
      await participateInRaffle(raffleId)
      setHasParticipated(true)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsParticipating(false)
    }
  }

  return {
    participate,
    isParticipating,
    hasParticipated,
    error
  }
}
```

### Flujo del Botón de Participación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTADOS DEL BOTÓN DE PARTICIPAR                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐   Click   ┌─────────┐   202 OK   ┌─────────┐   ┌─────────┐│
│  │  IDLE   │ ────────▶ │ LOADING │ ─────────▶ │ PENDING │ ─▶│ SUCCESS ││
│  │         │           │         │            │ (cola)  │   │         ││
│  │[Azul]   │           │[Spinner]│            │[Amarillo│   │[Verde]  ││
│  └─────────┘           └─────────┘            └─────────┘   └─────────┘│
│       │                     │                                          │
│       │                     │ Error                                    │
│       │                     ▼                                          │
│       │               ┌─────────┐                                      │
│       │◀──── 3s ──────│  ERROR  │                                      │
│       (retry)         │  [Rojo] │                                      │
│                       └─────────┘                                      │
│                                                                         │
│  IMPORTANTE:                                                            │
│  - El botón se deshabilita INMEDIATAMENTE al hacer click               │
│  - No se puede volver a clickear hasta que haya un error               │
│  - Una vez en SUCCESS, el estado es permanente                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Consideraciones Importantes

1. **Deshabilitar al primer click**: El botón debe deshabilitarse inmediatamente al hacer click, antes de que la petición termine.

2. **Estado 202 Accepted**: La API devuelve 202, no 200. Esto significa que la participación fue aceptada pero está en cola para ser procesada.

3. **No permitir múltiples peticiones**: Una vez que el usuario hace click, no debe poder volver a intentar (excepto si hay error).

4. **Persistir estado**: Si el usuario ya participó (`user_has_participated: true` en la respuesta del GET), el botón debe mostrarse en estado SUCCESS desde el inicio.

5. **Refresh de datos**: Después de participar exitosamente, considera hacer un refresh del detalle del sorteo para obtener el estado actualizado de `user_has_participated`.

---

## Notas Adicionales

### WAF (Web Application Firewall)

El backend tiene WAF configurado con las siguientes restricciones:

1. **Geo-blocking**: Solo permite tráfico desde Perú
2. **Rate Limiting**:
   - Global: 2,000 requests/5min por IP
   - Participate: 50 requests/5min por IP
   - Auth (sign-in, sign-up): 25 requests/5min por IP
3. **User-Agent requerido**: El navegador lo envía automáticamente. Solo herramientas como Insomnia/Postman necesitan configurarlo manualmente

### Categorías de Sorteos

| Categoría | Rango de Valor | Color Sugerido |
|-----------|---------------|----------------|
| pequeño | < S/500 | Verde |
| mediano | S/500 - S/4,999 | Azul |
| grande | S/5,000 - S/49,999 | Morado |
| premium | ≥ S/50,000 | Dorado |

### Estados de Sorteo

| Estado | Descripción | UI Sugerida |
|--------|-------------|-------------|
| `active` | En curso | Botón "Participar" visible |
| `processing` | Seleccionando ganador | Spinner/Loading |
| `completed` | Finalizado | Mostrar ganador |
| `cancelled` | Cancelado | Badge "Cancelado" |

---

**Última actualización**: Noviembre 2025  
**Versión API**: v1
