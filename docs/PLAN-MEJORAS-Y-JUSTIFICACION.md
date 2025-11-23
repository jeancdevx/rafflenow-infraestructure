# RaffleNow - Plan de Mejoras y Justificación de Negocio

## PARTE 1: Problemas Técnicos Identificados y Soluciones

### 1.1 Problema: Usuario no sabe cuándo su participación fue registrada

#### Situación actual:
```json
POST /raffles/{id}/participate
Response 202 Accepted:
{
  "message": "Participation request accepted",
  "raffle_id": "uuid",
  "participant_email": "user@example.com"
}
```

**Problema:**
- Usuario recibe 202 Accepted (procesamiento asíncrono)
- No sabe si finalmente fue registrado o si hubo error
- No hay confirmación posterior

#### Soluciones propuestas:

**Opción A: WebSocket / SSE (Server-Sent Events) - IDEAL**
```
Usuario → POST /participate → 202 Accepted
                              ↓
          WebSocket connection abierta
                              ↓
          participation-process escribe a DynamoDB
                              ↓
          EventBridge emite participation.confirmed
                              ↓
          Lambda notifier → WebSocket/SSE → Frontend
                              ↓
          Usuario ve: "✓ Participación confirmada"
```

**Ventajas:**
- Confirmación en tiempo real (~1-2 segundos)
- UX superior (usuario ve progreso)
- Útil para múltiples notificaciones (ganador anunciado, etc)

**Desventajas:**
- Requiere WebSocket API Gateway (adicional al REST API)
- Mayor complejidad

---

**Opción B: Polling (Frontend consulta periódicamente) - SIMPLE**
```
Usuario → POST /participate → 202 Accepted + participation_id
                              ↓
Frontend hace polling cada 2s:
GET /participations/{participation_id}/status
                              ↓
Lambda check-participation-status → DynamoDB participants
                              ↓
Si existe: { "status": "confirmed", "participated_at": "..." }
Si no: { "status": "pending" } o { "status": "failed", "error": "..." }
```

**Ventajas:**
- Más simple de implementar
- No requiere infraestructura adicional
- Funciona con REST API actual

**Desventajas:**
- Más requests al servidor (cada usuario polling)
- UX menos fluida (delay de 2-4 segundos)

---

**Opción C: Email de confirmación - SELECCIONADA**
```
Usuario → POST /participate → Lambda ingest-participation
                              ↓
                        EventBridge emite participation.requested
                              ↓
                        SQS participations-queue
                              ↓
          Lambda participation-process → DynamoDB participants (PutItem)
                              ↓
                        EventBridge emite participation.confirmed
                              ↓
          Lambda email-sender → SES → Usuario recibe email
                              ↓
          Email: "✓ Tu participación en {sorteo_nombre} fue confirmada exitosamente"
```

**Ventajas:**
- Usuario tiene confirmación externa (evidencia)
- No requiere estar en la web
- Usa arquitectura event-driven existente
- Simple de implementar (1 Lambda adicional)

**Desventajas:**
- No es instantáneo (1-5 segundos)
- Requiere configurar SES

**Flujo completo con validación de duplicados:**

```javascript
// 1. Lambda ingest-participation (mantener actual + validaciones)
exports.handler = async (event) => {
  const raffleId = event.pathParameters.id;
  const body = JSON.parse(event.body);
  const userEmail = body.participant_email;
  
  // NUEVO: Obtener información del usuario autenticado desde Cognito
  const cognitoGroups = event.requestContext.authorizer.claims['cognito:groups'];
  const userGroups = cognitoGroups ? cognitoGroups.split(',') : [];
  
  // NUEVO: Validar que el usuario NO es administrador
  if (userGroups.includes('Admins')) {
    return {
      statusCode: 403, // Forbidden
      body: JSON.stringify({
        error: 'forbidden',
        message: 'Los administradores no pueden participar en sorteos'
      })
    };
  }
  
  // Validar que raffle existe y está activo
  const raffle = await getRaffleById(raffleId);
  if (!raffle || raffle.status !== 'active') {
    return { statusCode: 400, body: 'Raffle not active' };
  }
  
  // Validar que usuario NO ha participado ya
  const existingParticipation = await checkExistingParticipation(raffleId, userEmail);
  if (existingParticipation && existingParticipation.status === 'confirmed') {
    return {
      statusCode: 409, // Conflict
      body: JSON.stringify({
        error: 'already_participated',
        message: 'Ya participaste en este sorteo',
        participated_at: existingParticipation.participated_at
      })
    };
  }
  
  // Si existe pero falló antes (status = 'failed'), permitir reintentar
  
  // Emitir evento para procesamiento asíncrono
  await eventBridge.putEvents({
    Entries: [{
      Source: 'rafflenow.participations',
      DetailType: 'participation.received',
      Detail: JSON.stringify({
        raffle_id: raffleId,
        participant_email: userEmail,
        participant_name: body.participant_name,
        requested_at: new Date().toISOString()
      })
    }]
  });
  
  return {
    statusCode: 202, // Accepted
    body: JSON.stringify({
      message: 'Participation request accepted',
      raffle_id: raffleId,
      participant_email: userEmail,
      note: 'Recibirás un email de confirmación en breve'
    })
  };
};

// Función helper: verificar participación existente
async function checkExistingParticipation(raffleId, email) {
  const result = await docClient.get({
    TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
    Key: {
      raffle_id: raffleId,
      participant_email: email
    }
  });
  return result.Item;
}
```

```javascript
// 2. Lambda participation-process (consumer de SQS) - ACTUALIZADO
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({});

exports.handler = async (event) => {
  const records = event.Records;
  
  for (const record of records) {
    const detail = JSON.parse(record.body).detail;
    const { raffle_id, participant_email, participant_name } = detail;
    
    try {
      // Escribir a DynamoDB con conditional expression (evita duplicados por race condition)
      await docClient.put({
        TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
        Item: {
          raffle_id: raffle_id,
          participant_email: participant_email,
          participant_name: participant_name,
          participated_at: new Date().toISOString(),
          status: 'confirmed'
        },
        ConditionExpression: 'attribute_not_exists(raffle_id) AND attribute_not_exists(participant_email)'
        // ^ Falla si ya existe (previene duplicados)
      });
      
      // Incrementar contador en tabla raffles
      await docClient.update({
        TableName: process.env.DYNAMODB_RAFFLES_TABLE,
        Key: { raffle_id: raffle_id },
        UpdateExpression: 'ADD current_participants :inc',
        ExpressionAttributeValues: { ':inc': 1 }
      });
      
      // Obtener detalles del raffle para el email
      const raffleResult = await docClient.get({
        TableName: process.env.DYNAMODB_RAFFLES_TABLE,
        Key: { raffle_id: raffle_id }
      });
      
      const raffle = raffleResult.Item;
      
      // NUEVO: Enviar email de confirmación directamente
      if (raffle) {
        await sesClient.send(new SendEmailCommand({
          Source: process.env.SES_FROM_EMAIL || 'noreply@rafflenow.com',
          Destination: {
            ToAddresses: [participant_email]
          },
          Message: {
            Subject: {
              Data: `Confirmación de participación - ${raffle.title}`,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: generateEmailHtml(raffle, participant_name),
                Charset: 'UTF-8'
              },
              Text: {
                Data: generateEmailText(raffle, participant_name),
                Charset: 'UTF-8'
              }
            }
          }
        }));
        
        logger.info('Participation confirmed and email sent', { raffle_id, participant_email });
      }
      
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        // Usuario ya participó (race condition entre 2 requests simultáneos)
        logger.warn('Duplicate participation attempt', { raffle_id, participant_email });
        // NO enviar a DLQ, es comportamiento esperado
        continue;
      }
      
      // Otro error: enviar a DLQ
      logger.error('Failed to process participation', { error, raffle_id, participant_email });
      throw error; // SQS reintentará y eventualmente irá a DLQ
    }
  }
};

// Helper functions para email
function generateEmailHtml(raffle, participantName) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1>Participación Confirmada</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hola ${participantName}</h2>
          <p>Tu participación en el sorteo <strong>${raffle.title}</strong> fue confirmada exitosamente.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalles del Sorteo:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Sorteo:</strong> ${raffle.title}</li>
              <li><strong>Fecha de cierre:</strong> ${new Date(raffle.end_date).toLocaleString('es-PE')}</li>
              <li><strong>Participantes actuales:</strong> ${raffle.current_participants}</li>
            </ul>
          </div>
          
          <p>El ganador será anunciado automáticamente a las 00:00h del día siguiente al cierre.</p>
          <p>Mucha suerte</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>RaffleNow Perú SAC<br>
          Este es un correo automático, por favor no responder.</p>
        </div>
      </body>
    </html>
  `;
}

function generateEmailText(raffle, participantName) {
  return `
Hola ${participantName}

Tu participación en el sorteo "${raffle.title}" fue confirmada exitosamente.

Detalles del Sorteo:
- Sorteo: ${raffle.title}
- Fecha de cierre: ${new Date(raffle.end_date).toLocaleString('es-PE')}
- Participantes actuales: ${raffle.current_participants}

El ganador será anunciado automáticamente a las 00:00h del día siguiente al cierre.

Mucha suerte

---
RaffleNow Perú SAC
Este es un correo automático, por favor no responder.
  `;
}
```

**Arquitectura event-driven actualizada:**

```
┌─────────────────────────────────────────────────────────────────┐
│ FLUJO DE PARTICIPACIÓN (con email de confirmación)              │
└─────────────────────────────────────────────────────────────────┘

Usuario
  │
  │ POST /raffles/{id}/participate
  ↓
┌──────────────────────────┐
│ API Gateway (Público)    │
│ + Cognito Authorizer     │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│ Lambda: ingest-           │
│ participation            │ ← Valida:
│                          │   • Raffle activo
│ 1. Valida raffle         │   • Usuario NO es admin
│ 2. Verifica duplicados   │   • Usuario NO participó ya
│ 3. Emite evento          │   • Capacidad disponible
└────────────┬─────────────┘
             │
             │ EventBridge: participation.received
             ↓
┌──────────────────────────┐
│ SQS: participations-     │ ← Buffer (absorbe picos)
│ queue                    │   Visibility timeout: 60s
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│ Lambda: participation-   │
│ process (batch 10)       │
│                          │
│ 1. PutItem con          │
│    ConditionalExpression │ ← Previene duplicados
│ 2. Incrementa contador   │   (race conditions)
│ 3. GetItem raffle info   │
│ 4. Envía email SES      │ ← Email directo (no evento)
└──────────────────────────┘
             │
             ↓ (1-5 segundos)
        Usuario recibe email
```

**Cambios en Terraform requeridos:**

1. **Actualizar Lambda:** `participation-process` necesita permisos SES
2. **NO crear:** Lambda `email-sender` separado (innecesario)
3. **NO crear:** Cola SQS `email-queue` (innecesaria)
4. **NO crear:** EventBridge rule `participation.confirmed` (innecesario)
5. **SES:** Verificar dominio y email noreply@rafflenow.com
6. **IAM:** Lambda participation-process necesita permiso `ses:SendEmail`

**Validación de "una participación por sorteo":**

- **Primera barrera (API):** Lambda `ingest-participation` consulta DynamoDB antes de aceptar
- **Segunda barrera (procesador):** DynamoDB `ConditionExpression` rechaza duplicados atómicamente
- **Resultado:** Imposible participar 2 veces, incluso con 2 requests simultáneos

**Manejo de errores:**

| Escenario | Comportamiento |
|-----------|----------------|
| Usuario participa 2 veces (segundos después) | Primer request: 202 Accepted. Segundo request: 409 Conflict "Ya participaste". |
| Usuario participa 2 veces simultáneamente (race condition) | Ambos: 202 Accepted. Procesador: Solo 1 se escribe (ConditionalExpression). Email: Solo 1 usuario recibe. |
| SES falla (email no enviado) | Participation se registra igual. Email va a DLQ. Alarma CloudWatch notifica. Reproceso manual. |
| DynamoDB falla | SQS reintenta automáticamente (hasta 3 veces). Luego va a DLQ. |

**Tiempo estimado de confirmación:**

```
POST /participate → 202 Accepted (100ms)
                      ↓
SQS buffer (10-500ms) → Lambda processor (200ms) → EventBridge (50ms)
                      ↓
SQS email (10ms) → Lambda email (100ms) → SES send (1-3s)
                      ↓
TOTAL: 1.5-5 segundos hasta email en inbox del usuario
```

**Conclusión:** Email de confirmación es la solución óptima: simple, confiable, usa arquitectura existente, y provee evidencia externa de participación.

---

### 1.2 Migración a Lambda Powertools

#### Librería seleccionada: **AWS Lambda Powertools for TypeScript/JavaScript**

**Justificación:**
- Oficial de AWS
- Logger estructurado con contexto automático
- Tracer para X-Ray (observabilidad distribuida)
- Metrics para CloudWatch (custom metrics)
- Validación de eventos con Middy middleware

#### Cambios en todos los Lambdas:

**Antes (logger.js custom):**
```javascript
const Logger = require("./logger");
const logger = new Logger(context);
logger.info("Processing request");
```

**Después (Lambda Powertools):**
```javascript
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'rafflenow-api',
  logLevel: process.env.LOG_LEVEL || 'INFO',
});

export const handler = async (event, context) => {
  logger.addContext(context);  // Auto-agrega request_id, function_name, etc
  
  logger.info('Processing request', {
    raffle_id: event.pathParameters?.id,
    operation: 'ingest-participation'
  });
  
  // ... lógica
};
```

#### Actualización a sintaxis Node.js 22:

**Características de Node.js 22 a usar:**
- ES Modules (import/export) en lugar de CommonJS (require/module.exports)
- Top-level await
- Optional chaining mejorado
- Nullish coalescing
- Array.prototype.at()
- Object.hasOwn() en lugar de hasOwnProperty

**Ejemplo migrado:**
```javascript
// Antes (CommonJS)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event, context) => {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);
  // ...
};

// Después (ES Modules + Node 22)
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from '@aws-lambda-powertools/logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const logger = new Logger({ serviceName: 'rafflenow-api' });

export const handler = async (event, context) => {
  logger.addContext(context);
  
  const raffleId = event.pathParameters?.id;  // Optional chaining
  const participant = event.body?.participant_email ?? 'unknown';  // Nullish coalescing
  
  // ... lógica
};
```

---

### 1.3 Análisis: ¿Qué Lambdas necesitan DynamoDB vs Eventos?

#### Lambdas que DEBEN acceder a DynamoDB (lectura):

| Lambda | Operación | Justificación |
|--------|-----------|---------------|
| **list-raffles** | Query/Scan | Listar sorteos públicos - no hay evento que replique esto |
| **get-raffle** | GetItem + Query | Detalle de sorteo + participantes - datos en tiempo real |
| **ingest-participation** | GetItem | Validar raffle activo, capacidad, fechas - necesita datos actuales |
| **worker-process** | GetItem + Query | Validar raffle + obtener participantes para selección |

#### Lambdas que DEBEN acceder a DynamoDB (escritura):

| Lambda | Operación | Justificación |
|--------|-----------|---------------|
| **create-raffle** | PutItem | Crear sorteo en DB |
| **participation-process** | PutItem + UpdateItem | Escribir participación + actualizar contador |
| **close-raffle** | UpdateItem | Marcar sorteo como processing |
| **check-expired-raffles** | Query + UpdateItem | Buscar expirados + marcar como processing |
| **worker-process** | UpdateItem | Actualizar sorteo con ganador (status completed) |

#### Lambdas que SOLO emiten eventos (no DB):

| Lambda | Evento emitido | Justificación |
|--------|----------------|---------------|
| **upload-image** | N/A | Solo genera presigned URL, S3 emite evento después |

#### Lambdas que podrían optimizarse con eventos:

| Lambda | Optimización posible |
|--------|---------------------|
| **ingest-participation** | Cache en memoria de raffles activos (TTL 60s) - reduce GetItem en 90% |
| **worker-process** | Evento raffle.closed ya tiene current_participants - evita GetItem redundante |

---

### 1.4 Atributos de Calidad (Ilities) - Definición y Mapeo AWS

#### Selección de Ilities Críticas para RaffleNow:

Basado en el modelo de negocio (plataforma de sorteos con picos de tráfico), se priorizan **6 atributos de calidad** que impactan directamente el éxito del negocio:

---

#### 1. **SCALABILITY (Escalabilidad)** - CRÍTICO

**Definición:** Capacidad de crecer automáticamente para manejar cargas crecientes sin intervención manual ni degradación.

**Problema actual:**
- Servidor único c5.4xlarge (16 vCPU) satura en 50+ RPS
- Escalado manual toma 15-30 minutos (se pierden participantes)
- No puede manejar 500 RPS en días virales

**Solución AWS:**

| Servicio | SLA / Capacidad | Justificación |
|----------|-----------------|---------------|
| **Lambda** | Auto-scaling hasta 1,000 concurrentes por región (configurable hasta 100,000) | Escala automáticamente de 2 a 500+ RPS en segundos. Cada invocación es aislada. |
| **DynamoDB On-Demand** | Escala automáticamente, soporta millones de requests/segundo | No requiere capacity planning. Absorbe picos sin throttling. |
| **SQS** | Throughput ilimitado, 120,000 mensajes/segundo por cola | Buffer elástico: absorbe picos de 450K participaciones sin pérdida. |
| **API Gateway** | 10,000 RPS por cuenta (soft limit, ampliable) | Soporta 500 RPS con margen. Cache integrado para lecturas. |
| **CloudFront** | Red global con ancho de banda ilimitado | Escala automáticamente para servir imágenes a 1.5M visitantes simultáneos. |

**Métrica objetivo:** Soportar 500 RPS con p95 latency < 1s (vs 5s+ actual con fallas).

---

#### 2. **AVAILABILITY (Disponibilidad)** - CRÍTICO

**Definición:** Porcentaje de tiempo que el sistema está operativo y accesible.

**Problema actual:**
- Uptime: ~95% (downtime frecuente en picos)
- Servidor único = single point of failure
- Deploys causan downtime de 5-10 minutos

**Solución AWS:**

| Servicio | SLA Oficial | Impacto |
|----------|-------------|---------|
| **Lambda** | **99.95%** uptime por región | Sin servidor único. Multi-AZ automático. 26 minutos downtime/año máximo. |
| **DynamoDB** | **99.99%** uptime (Standard SLA) | 52 minutos downtime/año máximo. Multi-AZ replicación síncrona. |
| **S3** | **99.9%** uptime | 8.76 horas downtime/año máximo. |
| **CloudFront** | **99.9%** uptime | Edge locations redundantes. Failover automático. |
| **API Gateway** | **99.95%** uptime | Multi-AZ sin configuración adicional. |
| **Cognito** | **99.9%** uptime | Authentication siempre disponible. |

**SLA compuesto (cadena crítica):**
```
Lambda (99.95%) × DynamoDB (99.99%) × API Gateway (99.95%) = 99.89% uptime
= 9.6 horas downtime/año (vs 438 horas actual = 95%)
```

**Beneficio:** **Reducción de 98% en downtime** (de 438h a 9.6h por año).

---

#### 3. **RELIABILITY (Confiabilidad)** - CRÍTICO

**Definición:** Probabilidad de operar sin fallos y capacidad de recuperación ante errores.

**Problema actual:**
- Error rate: 10-15% en picos (timeouts, 500 errors)
- Sin retry automático
- Pérdida de transacciones en crashes

**Solución AWS:**

| Servicio | Característica | Garantía |
|----------|----------------|----------|
| **SQS** | At-least-once delivery | Mensajes no se pierden. Retry automático configurable (hasta 14 días retention). |
| **Lambda + DLQ** | Dead Letter Queue | Eventos fallidos → SQS DLQ para reprocesar. Visibilidad de errores. |
| **DynamoDB Point-in-Time Recovery** | Backups continuos | Restauración a cualquier segundo en los últimos 35 días. RPO < 1 segundo. |
| **EventBridge** | Retry policy configurable | 24 intentos con exponential backoff. 185 reintentos en 24 horas. |
| **X-Ray** | Distributed tracing | Visibilidad end-to-end. Detecta cuellos de botella y errores en <1min. |

**Patrón de resiliencia:**
```
API Gateway → Lambda → EventBridge → SQS (buffer) → Lambda Processor → DynamoDB
                                       ↓ (si falla)
                                      DLQ → Alarma CloudWatch → Reproceso manual
```

**Métrica objetivo:** Error rate < 0.1% (vs 10-15% actual).

---

#### 4. **PERFORMANCE (Rendimiento)** - CRÍTICO

**Definición:** Tiempo de respuesta bajo diferentes cargas.

**Problema actual:**
- p50: 800ms (normal), 3s (picos)
- p95: 2s (normal), 8s+ (picos) → timeouts
- DB queries sin índices optimizados

**Solución AWS:**

| Servicio | Latencia | Optimización |
|----------|----------|--------------|
| **DynamoDB** | p99 < 10ms para GetItem con partition key | Acceso sub-10ms garantizado. Índices GSI para queries complejos. |
| **Lambda (512MB)** | Cold start: 200-500ms, Warm: 5-20ms | Provisioned concurrency en endpoints críticos (elimina cold starts). |
| **API Gateway Cache** | Hit: < 10ms | Cache de 5 minutos para `GET /raffles` (reduce 90% de llamadas a Lambda). |
| **CloudFront** | p50: 20-50ms global | 450+ edge locations. Imágenes servidas desde cache local. |
| **SQS + Batch Processing** | Throughput: 3,000 msgs/seg/lambda | Procesa participaciones en batches de 10 (reduce invocaciones 90%). |

**Arquitectura optimizada:**
```
# Lectura (GET /raffles)
Usuario → CloudFront (50ms) → API Gateway Cache (10ms) → Response
         └─ Cache hit rate: 85-90%

# Escritura (POST /participate)
Usuario → API Gateway (20ms) → Lambda ingesta (50ms) → EventBridge (30ms) → 202 Accepted (100ms total)
                                                         ↓ (asíncrono)
                                                        SQS → Lambda processor (2s) → DynamoDB → Email SES
```

**Métrica objetivo:** p95 < 500ms (lectura), p95 < 1s (escritura asíncrona percibida como 100ms).

---

#### 5. **SECURITY (Seguridad)** - ALTO

**Definición:** Protección contra accesos no autorizados, fraude y ataques.

**Problema actual:**
- Sin autenticación robusta (passwords débiles)
- Vulnerable a bots (70% de tráfico viral)
- Sin rate limiting ni protección DDoS
- Datos sin cifrado at rest

**Solución AWS:**

| Servicio | Protección | Estándar |
|----------|------------|----------|
| **Cognito Essentials** | MFA, password policies, account lockout | OAUTH 2.0 / OIDC. Integración con Google/Facebook. Hash bcrypt. |
| **WAF** | Rate limiting: 2,000 req/5min por IP. Geo-blocking. SQL injection. | OWASP Top 10. Reglas AWS Managed Rules. |
| **DynamoDB Encryption** | Cifrado at rest con AWS KMS | AES-256. Claves rotadas automáticamente. |
| **S3 + CloudFront** | Presigned URLs con expiración (15 min). HTTPS obligatorio. | TLS 1.2+. Origin Access Identity (solo CF puede acceder a S3). |
| **Secrets Manager** | Rotación automática de credenciales DB cada 30 días | Secrets nunca en código ni logs. |
| **IAM Least Privilege** | Cada Lambda tiene rol específico (solo permisos necesarios) | Zero trust. Auditoría con CloudTrail. |

**Reducción de fraude:**
```python
# Sin Cognito (actual)
participaciones_dia_viral = 450_000
bots_estimados = 450_000 * 0.70 = 315_000
perdida_fraude = 315_000 * S/ 2.00 = S/ 630,000

# Con Cognito + WAF
bots_bloqueados = 315_000 * 0.95 = 299,250  # WAF rate limiting + CAPTCHA
participaciones_limpias = 450_000 - 299_250 + 449_250 reales = 449_250
perdida_residual = 750 * S/ 2.00 = S/ 1,500

Ahorro por seguridad: S/ 628,500 / día viral
```

**Métrica objetivo:** < 2% de tráfico fraudulento (vs 70% actual).

---

#### 6. **DURABILITY (Durabilidad de Datos)** - ALTO

**Definición:** Garantía de que los datos no se pierdan.

**Problema actual:**
- Backups manuales (cada 24h)
- RPO: 24 horas (pérdida de 1 día de datos en crash)
- RTO: 2-4 horas (tiempo de restauración)

**Solución AWS:**

| Servicio | Durabilidad | Recovery |
|----------|-------------|----------|
| **S3** | **99.999999999% (11 nines)** | Probabilidad de perder un objeto: 1 en 100 mil millones por año. Replicación automática en 3+ AZs. |
| **DynamoDB** | **99.999999999% (11 nines)** | Replicación síncrona en 3 AZs. Point-in-Time Recovery: RPO < 1 segundo, RTO < 30 minutos. |
| **DynamoDB Global Tables** | Multi-region replication | Disaster recovery automático. RPO = 0 (replicación continua). |
| **S3 Versioning** | Historial completo de objetos | Recuperación de eliminación accidental. Retención configurable. |

**Backup strategy:**
```
DynamoDB → Point-in-Time Recovery (automático) → Backups on-demand cada semana → S3 Glacier (retención 7 años)
```

**Mejora:**
- **RPO:** 24h → < 1 segundo (mejora de 86,400x)
- **RTO:** 2-4h → 10-30 minutos (mejora de 8-24x)
- **Pérdida de datos:** Virtualmente eliminada (11 nines de durabilidad)

---

#### Resumen Comparativo de Ilities:

| Atributo | Métrica Actual | Métrica AWS | Mejora |
|----------|---------------|-------------|--------|
| **Scalability** | Max 50 RPS | Max 500+ RPS | **10x capacidad** |
| **Availability** | 95% (438h down/año) | 99.89% (9.6h down/año) | **98% reducción downtime** |
| **Reliability** | 10-15% error rate | < 0.1% error rate | **100x más confiable** |
| **Performance** | p95: 8s+ en picos | p95: < 500ms | **16x más rápido** |
| **Security** | 70% tráfico fraudulento | < 2% fraudulento | **35x más seguro** |
| **Durability** | RPO 24h, 3 nines | RPO < 1s, 11 nines | **86,400x mejor RPO** |

---

#### Mapeo: Requisitos de Negocio → Ilities → Servicios AWS

```
NEGOCIO: "Capturar 100% de participaciones en picos virales (500 RPS)"
         ↓
ILITY: Scalability + Performance
         ↓
AWS: Lambda (auto-scale) + SQS (buffer) + DynamoDB (on-demand) + CloudFront (cache)

NEGOCIO: "Evitar pérdida de S/ 2.4M/mes por downtime"
         ↓
ILITY: Availability + Reliability
         ↓
AWS: Multi-AZ (Lambda, DynamoDB, RDS) + DLQ (SQS) + Retry policies (EventBridge)

NEGOCIO: "Reducir fraude (70% bots en días virales)"
         ↓
ILITY: Security
         ↓
AWS: Cognito (MFA) + WAF (rate limiting) + CloudTrail (auditoría)

NEGOCIO: "No perder datos de participaciones (pérdida = pérdida legal + reputación)"
         ↓
ILITY: Durability
         ↓
AWS: S3 (11 nines) + DynamoDB PITR (RPO < 1s) + Backups automáticos
```

---

**Conclusión:** Los 6 atributos de calidad seleccionados están directamente alineados con los problemas actuales del negocio y son garantizados por los SLAs oficiales de AWS. La arquitectura propuesta no solo resuelve los problemas técnicos, sino que habilita el crecimiento del negocio capturando S/ 2.4M+/mes en ingresos perdidos.

---

## PARTE 2: Justificación de Negocio (Datos Ficticios Realistas)

### 2.1 Perfil de la Empresa (RaffleNow Perú)

**Nombre:** RaffleNow Perú SAC  
**Fundación:** 2020  
**Sede:** Lima, Perú  
**Modelo de negocio:** Plataforma de sorteos online con pago por ticket  
**Precio por ticket:** S/ 2.00 (dos soles peruanos)  
**Comisión:** 100% del valor del ticket (empresa asume costo del premio)

---

### 2.2 Métricas Actuales (Sistema Legacy - VM única)

#### Tráfico diario:

| Métrica | Día Normal | Día Promoción | Día Viral |
|---------|-----------|---------------|-----------|
| Visitantes únicos | 20,000 | 250,000 | 1,500,000 |
| Conversión a participar | 15% | 25% | 30% |
| Participantes exitosos | 3,000 | 62,500 | 450,000 |
| **Participantes perdidos por fallas** | **300 (10%)** | **37,500 (60%)** | **1,050,000 (70%)** |

#### Ingresos actuales:

```python
# Día normal
participantes_exitosos = 3_000
perdidos_por_fallas = 300
ticket_precio = 2.00  # soles

ingreso_actual = 3_000 * 2.00 = S/ 6,000 / día
ingreso_potencial = 3_300 * 2.00 = S/ 6,600 / día
perdida = S/ 600 / día

# Día promoción
participantes_exitosos = 62_500
perdidos_por_fallas = 37_500
ingreso_actual = 62_500 * 2.00 = S/ 125,000 / día
ingreso_potencial = 100_000 * 2.00 = S/ 200,000 / día
perdida = S/ 75,000 / día

# Día viral
participantes_exitosos = 450_000
perdidos_por_fallas = 1_050_000
ingreso_actual = 450_000 * 2.00 = S/ 900,000 / día
ingreso_potencial = 1_500_000 * 2.00 = S/ 3,000,000 / día
perdida = S/ 2,100,000 / día
```

#### Distribución mensual (promedio):
- **Días normales:** 25 días/mes
- **Días de promoción:** 4 días/mes
- **Días virales:** 1 día/mes

#### Ingresos y pérdidas mensuales:

```python
ingreso_mensual_actual = (
    (25 * 6_000) +      # Días normales: S/ 150,000
    (4 * 125_000) +     # Días promoción: S/ 500,000
    (1 * 900_000)       # Día viral: S/ 900,000
) = S/ 1,550,000 / mes

ingreso_potencial_sin_fallas = (
    (25 * 6_600) +      # S/ 165,000
    (4 * 200_000) +     # S/ 800,000
    (1 * 3_000_000)     # S/ 3,000,000
) = S/ 3,965,000 / mes

PÉRDIDA MENSUAL = S/ 2,415,000 / mes
PÉRDIDA ANUAL = S/ 28,980,000 / año (~$7.7M USD)
```

---

### 2.3 Costos Actuales (Infraestructura Legacy)

#### Infraestructura de producción:

| Concepto | Especificaciones | Costo Mensual |
|----------|-----------------|--------------|
| Servidor Web (EC2 c5.4xlarge) | 16 vCPU, 32GB RAM, 24/7 | S/ 4,500 |
| Servidor de Base de Datos (RDS PostgreSQL r5.2xlarge) | 8 vCPU, 64GB RAM, Multi-AZ | S/ 6,200 |
| Servidor de Cache (ElastiCache Redis) | 4 nodos, 13GB RAM c/u | S/ 2,800 |
| Load Balancer (ALB) | Tráfico 3M requests/mes | S/ 900 |
| Ancho de banda (8TB/mes) | Transferencia de datos | S/ 1,200 |
| Storage (EBS + Backups) | 1TB SSD + snapshots diarios | S/ 800 |
| CloudWatch básico | Logs y métricas limitadas | S/ 400 |
| **Subtotal infraestructura** | | **S/ 16,800 / mes** |

#### Costos operativos:

| Concepto | Detalle | Costo Mensual |
|----------|---------|--------------|
| Equipo DevOps (2 personas) | Deploys manuales, mantenimiento 24/7 | S/ 18,000 |
| Horas extra en picos | Intervenciones urgentes (promedio 40h/mes a S/ 150/h) | S/ 6,000 |
| Licencias y herramientas | Monitoring, APM, gestión | S/ 2,200 |
| **Subtotal operativo** | | **S/ 26,200 / mes** |

#### TOTAL MENSUAL: **S/ 43,000 / mes** (~$11,500 USD)

**Notas:**
- Servidores sobredimensionados para soportar picos (desperdicio 75% del tiempo)
- Multi-AZ RDS genera doble costo pero aún tiene downtime en picos
- Cache Redis ayuda pero no escala automáticamente
- Equipo DevOps dedicado a mantener infraestructura legacy
- Sin auto-scaling: picos saturan servidores, días normales desperdician recursos

---

### 2.4 Proyección a 2 Años (Si no se soluciona)

#### Supuestos:
- Crecimiento orgánico: 15% anual
- Días virales incrementan: 1 → 2 por mes (mejor marketing)
- **Problema:** Infraestructura actual NO escala, pérdidas aumentan

#### Año 1 (2026):
```python
visitantes_diarios_promedio = 20_000 * 1.15 = 23_000
dias_virales_mes = 2

ingreso_mensual = S/ 1,782,500
perdida_mensual = S/ 3,217,500  # Aumenta porque más tráfico = más fallas
perdida_anual = S/ 38,610,000
```

#### Año 2 (2027):
```python
visitantes_diarios_promedio = 23_000 * 1.15 = 26,450
dias_virales_mes = 3  # Mejor marketing

ingreso_mensual = S/ 2,049,875
perdida_mensual = S/ 4,500,250
perdida_anual = S/ 54,003,000
```

**CONCLUSIÓN:** Sin mejoras, en 2 años la empresa pierde **S/ 92.6 millones** (~$25M USD) en ingresos no capturados.

---

### 2.5 Propuesta: Migración a AWS Serverless

#### Arquitectura nueva:
- **API Gateway** (público + privado)
- **Lambda** (10 funciones, auto-scaling)
- **EventBridge** (event-driven)
- **SQS** (3 colas, buffer picos)
- **DynamoDB** (on-demand)
- **S3 + CloudFront** (assets optimizados)
- **Cognito** (autenticación)
- **WAF** (protección)
- **Route53** (dominio personalizado)
- **SES** (emails transaccionales)

#### Costos estimados AWS (Calculadora oficial - uso mensual realista):

##### Servicios de cómputo y lógica:

| Servicio | Detalle | Costo Mensual |
|----------|---------|---------------|
| **Lambda** | 15M invocaciones/mes, 512MB, 2s promedio | $225 |
| **API Gateway (REST)** | 3M requests/mes (público + privado) | $10.50 |
| **EventBridge** | 2M eventos/mes + reglas | $2 |
| **SQS** | 5M mensajes/mes (3 colas) | $2 |

##### Almacenamiento y bases de datos:

| Servicio | Detalle | Costo Mensual |
|----------|---------|---------------|
| **DynamoDB** | 20GB storage, 50M reads, 15M writes (on-demand) | $280 |
| **S3** | 500GB imágenes + 1M PUT + 10M GET | $20 |
| **CloudFront** | 2TB transfer out, 5M requests | $180 |

##### Autenticación y seguridad:

| Servicio | Detalle | Costo Mensual |
|----------|---------|---------------|
| **Cognito Essentials** | 80,000 MAU (sobre free tier 10k) = 70k × $0.015 | $1,050 |
| **WAF** | 3 Web ACLs + reglas + 3M requests | $60 |
| **Secrets Manager** | 10 secrets (DB creds, API keys) | $4 |

##### Comunicaciones y DNS:

| Servicio | Detalle | Costo Mensual |
|----------|---------|---------------|
| **SES** | 150,000 emails/mes (confirmaciones + ganadores) | $15 |
| **Route53** | 3 hosted zones + queries | $3 |

##### Observabilidad:

| Servicio | Detalle | Costo Mensual |
|----------|---------|---------------|
| **CloudWatch Logs** | 50GB ingest + 100GB storage | $30 |
| **CloudWatch Dashboards** | 4 dashboards × $3/mes | $12 |
| **X-Ray** | 1M traces/mes | $5 |

##### Resumen:

| Categoría | Costo USD | Costo PEN (×3.75) |
|-----------|-----------|-------------------|
| Cómputo y lógica | $239.50 | S/ 898 |
| Almacenamiento y DB | $480 | S/ 1,800 |
| Autenticación y seguridad | $1,114 | S/ 4,178 |
| Comunicaciones y DNS | $18 | S/ 68 |
| Observabilidad | $47 | S/ 176 |
| **TOTAL MENSUAL** | **$1,898.50** | **S/ 7,120** |

#### Comparación Realista:

| Concepto | Sistema Actual | Sistema AWS | Cambio |
|----------|---------------|-------------|--------|
| **Costo infraestructura** | S/ 16,800 | S/ 7,120 | **-58%** (S/ 9,680 ahorro) |
| **Costo operativo (DevOps)** | S/ 26,200 | S/ 6,000 | **-77%** (S/ 20,200 ahorro) |
| **COSTO TOTAL MENSUAL** | **S/ 43,000** | **S/ 13,120** | **-70%** (S/ 29,880 ahorro) |
| **Ingreso mensual** | S/ 1,550,000 | S/ 3,965,000 | **+156%** (S/ 2,415,000) |
| **Pérdida por fallas** | S/ 2,415,000 | S/ 79,300* | **-97%** (S/ 2,335,700) |
| **Utilidad neta** | S/ 1,507,000 | S/ 3,872,580 | **+157%** (S/ 2,365,580) |

\* Pérdida residual 2% por throttling transitorio en picos virales extremos (fallback graceful)

#### Análisis de Cognito MAU:

**Justificación del costo:**
```python
# Escenario mensual promedio
visitantes_unicos_mes = 890_000  # 25 días normales + 4 promo + 1 viral
usuarios_registrados = visitantes_unicos_mes * 0.30  # 30% se registra
usuarios_activos_mes = 267_000  # MAU

# Sin AWS (actual): No hay autenticación robusta
# Bots y duplicados: ~70% del tráfico en picos
participaciones_fraudulentas = 450_000 * 0.70 = 315_000 en día viral
perdida_por_fraude = 315_000 * S/ 2.00 = S/ 630,000 / día viral

# Con Cognito: Autenticación + detección bots
participaciones_limpias = 450_000 * 0.98 = 441_000
perdida_residual = 9_000 * S/ 2.00 = S/ 18,000 / día viral

# ROI de Cognito
costo_cognito_mes = S/ 4,178
ahorro_fraude_mes = S/ 630,000 (1 día viral) = S/ 630,000
ROI = (630_000 - 4_178) / 4_178 = 15,079% mensual
```

**Nota:** El costo de Cognito ($1,050/mes) se paga solo con evitar fraude en 1 día viral. Los otros 29 días es pura ganancia.

#### Operaciones simplificadas:

**DevOps actual (2 personas):**
- Deploy manual vía SSH
- Monitoreo reactivo 24/7
- Escalado manual en picos (agregar instancias)
- Rollback manual si falla deploy
- Costo: S/ 18,000/mes

**DevOps con AWS (1 persona part-time):**
- Deploy automático (git push)
- Auto-scaling sin intervención
- Rollback automático
- Monitoreo proactivo (alarmas)
- Costo: S/ 6,000/mes

**Ahorro operativo:** S/ 12,000/mes (67%)

#### ROI:

```python
# Inversión inicial
desarrollo_migracion = $15,000  # 6 semanas de desarrollo
capacitacion = $2,000           # Training equipo en AWS
buffer = $3,000                 # Contingencia
inversion_total = $20,000 = S/ 75,000

# Retorno mensual
ahorro_infraestructura = S/ 29,880
ahorro_fraude_cogito = S/ 50,000  # Promedio mensual
captura_participaciones_perdidas = S/ 2,415,000

retorno_mensual_total = S/ 2,494,880

# ROI
roi_porcentaje = (2_494_880 - 75_000) / 75_000 = 3,226%
break_even = 75_000 / 2_494_880 = 0.03 meses = ~1 día
```

**Conclusión:** La inversión se recupera en **1 día de operación** y genera **S/ 2.4M+ de retorno mensual**.

---

### 2.6 Beneficios Adicionales

#### Técnicos:
1. **Escalabilidad automática:** De 2 RPS a 500+ RPS sin intervención
2. **Alta disponibilidad:** 99.9% uptime (vs 95% actual)
3. **Rendimiento:** p95 latency < 500ms (vs 5s actual)
4. **Seguridad:** Cognito + WAF + encryption at rest
5. **Observabilidad:** Dashboards, alarmas, logs estructurados

#### Negocio:
1. **Captura 100% de participaciones** (vs 30-40% en picos)
2. **Crecimiento sin límites:** Soporta 10x tráfico actual sin cambios
3. **Mejor UX:** Confirmación inmediata, emails, etc
4. **Menor riesgo:** Sin VM única como single point of failure
5. **Agilidad:** Deploys automatizados, ambientes separados (dev/prod)

---

## PARTE 3: Plan de Acción Guiado (Implementación Completa)

### 3.1 Estructura del Plan

**Total:** 11 fases (80-95 horas estimadas)  
**Objetivo:** Infraestructura productiva completa (sin CI/CD)  
**Enfoque:** Iterativo e incremental - cada fase entrega valor

---

### FASE 1: Correcciones Críticas de Bugs (4-5 horas)

**Objetivo:** Arreglar problemas identificados en el código actual antes de continuar.

#### 1.1 Fix: Status transitions en check-expired-raffles

**Problema:** Lambda marca raffles como "closed" antes de que se seleccione ganador.

**Archivo:** `app/lambdas/check-expired-raffles/index.js` (línea 157)

**Cambio:**
```javascript
// ANTES
results.push({
  raffle_id: item.raffle_id,
  title: item.title,
  status: "closed",  // ❌ INCORRECTO
  // ...
});

// DESPUÉS
results.push({
  raffle_id: item.raffle_id,
  title: item.title,
  status: "processing",  // ✅ CORRECTO
  // ...
});
```

**Validación:**
```bash
# Test manual
node app/lambdas/check-expired-raffles/index.js
# Verificar que raffles expirados tengan status: "processing"
```

#### 1.2 Fix: Agregar validación de end_date en create-raffle

**Problema:** Se aceptan raffles con end_date en cualquier hora (debe ser 23:59:00).

**Archivo:** `app/lambdas/create-raffle/index.js`

**Agregar:**
```javascript
// Después de parsear body
const endDate = new Date(body.end_date);

// Validar que sea 23:59:00
if (endDate.getHours() !== 23 || endDate.getMinutes() !== 59 || endDate.getSeconds() !== 0) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: 'invalid_end_date',
      message: 'end_date debe terminar a las 23:59:00 (ej: 2025-12-31T23:59:00.000Z)'
    })
  };
}
```

**Validación:**
```bash
# Test: end_date inválido (debe rechazar)
curl -X POST https://api.rafflenow.com/raffles \
  -H "Content-Type: application/json" \
  -d '{"end_date": "2025-12-31T18:00:00.000Z"}' # ❌ 400 Bad Request

# Test: end_date válido (debe aceptar)
curl -X POST https://api.rafflenow.com/raffles \
  -d '{"end_date": "2025-12-31T23:59:00.000Z"}' # ✅ 201 Created
```

#### 1.3 Fix: Worker marca status como "completed"

**Problema:** Verificar que worker-process sí marca como "completed" al terminar.

**Archivo:** `app/lambdas/worker-process/index.py`

**Verificar línea:**
```python
# Debe contener
dynamodb.update_item(
    TableName=os.environ['DYNAMODB_RAFFLES_TABLE'],
    Key={'raffle_id': raffle_id},
    UpdateExpression='SET #status = :status, winner_email = :winner',
    ExpressionAttributeNames={'#status': 'status'},
    ExpressionAttributeValues={
        ':status': 'completed',  # ✅ CORRECTO
        ':winner': winner_email
    }
)
```

**Validación:**
```bash
# Simular proceso completo
1. Crear raffle con end_date = ayer
2. Agregar participantes
3. Ejecutar check-expired-raffles → status debe ser "processing"
4. Ejecutar worker-process → status debe ser "completed"
```

**Entregable:** 3 bugs críticos corregidos, validados con tests manuales.

---

### FASE 2: Migración a Lambda Powertools (Node.js 22) (8-10 horas)

**Objetivo:** Eliminar `logger.js` custom, implementar logging estructurado profesional.

#### 2.1 Crear configuración compartida de logger

**Nuevo archivo:** `app/lambdas/shared/logger-config.mjs`

```javascript
import { Logger } from '@aws-lambda-powertools/logger';

export const createLogger = (serviceName) => {
  return new Logger({
    serviceName: serviceName,
    logLevel: process.env.LOG_LEVEL || 'INFO',
    environment: process.env.ENVIRONMENT || 'dev',
  });
};
```

#### 2.2 Migrar Lambdas de CommonJS a ES Modules

**Orden de migración (por criticidad):**

1. **ingest-participation** (alto tráfico)
2. **get-raffle** (alto tráfico)
3. **list-raffles** (medio tráfico)
4. **create-raffle** (bajo tráfico, admin)
5. **close-raffle** (bajo tráfico, admin)
6. **check-expired-raffles** (cron)
7. **upload-image** (medio tráfico)
8. Resto de Lambdas

**Template de migración (ej: ingest-participation):**

**ANTES** (`index.js` CommonJS):
```javascript
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const Logger = require("./logger");  // ❌ Custom logger

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.info("Processing participation");
  // ...
};
```

**DESPUÉS** (`index.mjs` ES Module):
```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { createLogger } from '../shared/logger-config.mjs';

const logger = createLogger('rafflenow-ingest-participation');
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridge = new EventBridgeClient({});

export const handler = async (event, context) => {
  logger.addContext(context);  // Auto-agrega request_id, function_name, etc
  
  const raffleId = event.pathParameters?.id;
  const body = JSON.parse(event.body);
  
  logger.info('Processing participation request', {
    raffle_id: raffleId,
    participant_email: body.participant_email
  });
  
  try {
    // ... lógica
    
    logger.info('Participation accepted', { raffle_id: raffleId });
    
    return {
      statusCode: 202,
      body: JSON.stringify({ message: 'Participation accepted' })
    };
    
  } catch (error) {
    logger.error('Failed to process participation', { error, raffle_id: raffleId });
    throw error;
  }
};
```

#### 2.3 Actualizar package.json de cada Lambda

**ANTES:**
```json
{
  "name": "ingest-participation",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x",
    "@aws-sdk/lib-dynamodb": "^3.x"
  }
}
```

**DESPUÉS:**
```json
{
  "name": "ingest-participation",
  "version": "1.0.0",
  "type": "module",  // ← IMPORTANTE: habilita ES Modules
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "@aws-sdk/client-eventbridge": "^3.700.0",
    "@aws-lambda-powertools/logger": "^2.10.0"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

#### 2.4 Actualizar Terraform para Node.js 22

**Archivo:** `iac/modules/compute/lambdas.tf`

```hcl
resource "aws_lambda_function" "ingest_participation" {
  # ...
  runtime = "nodejs22.x"  # ← Cambiar de nodejs18.x a nodejs22.x
  handler = "index.handler"  # ← Sigue siendo index.handler (funciona con .mjs)
  
  environment {
    variables = {
      LOG_LEVEL   = "INFO"
      ENVIRONMENT = var.environment
      # ...
    }
  }
}
```

#### 2.5 Eliminar archivos logger.js

```bash
# Después de migrar cada Lambda
rm app/lambdas/ingest-participation/logger.js
rm app/lambdas/get-raffle/logger.js
# ... etc (7 lambdas Node.js)
```

#### 2.6 Validación

**Test logs estructurados en CloudWatch:**
```bash
# Invocar Lambda migrado
aws lambda invoke \
  --function-name rafflenow-dev-ingest-participation \
  --payload '{"pathParameters": {"id": "test-123"}}' \
  response.json

# Ver logs en CloudWatch
aws logs tail /aws/lambda/rafflenow-dev-ingest-participation --follow

# Verificar formato JSON estructurado:
# {
#   "level": "INFO",
#   "message": "Processing participation request",
#   "service": "rafflenow-ingest-participation",
#   "timestamp": "2025-11-22T10:30:00.000Z",
#   "xray_trace_id": "1-...",
#   "raffle_id": "test-123",
#   "function_name": "rafflenow-dev-ingest-participation",
#   "function_request_id": "abc-123-xyz"
# }
```

**Entregable:** 7 Lambdas Node.js migrados a Powertools + ES Modules, logs estructurados validados.

---

### FASE 3: Implementar Email de Confirmación (SES) (5-6 horas)

**Objetivo:** Usuario recibe email cuando su participación es confirmada.

#### 3.1 Configurar Amazon SES

```bash
# 1. Verificar dominio (si tienes rafflenow.com)
aws ses verify-domain-identity --domain rafflenow.com

# 2. O verificar email individual (para testing)
aws ses verify-email-identity --email-address noreply@rafflenow.com

# 3. Salir de sandbox (producción)
# - Ir a consola SES → Account Dashboard → Request production access
# - Justificación: "Plataforma de sorteos, envío de confirmaciones transaccionales"
# - Límite solicitado: 50,000 emails/día
```

**Configuración DNS (si usas dominio):**
```
# Agregar records TXT para verificación (SES los proporciona)
# Agregar SPF, DKIM, DMARC para deliverability
```

#### 3.2 Crear Lambda email-sender

**Archivo:** `app/lambdas/email-sender/index.mjs`

```javascript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createLogger } from '../shared/logger-config.mjs';

const logger = createLogger('rafflenow-email-sender');
const sesClient = new SESClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event, context) => {
  logger.addContext(context);
  
  for (const record of event.Records) {
    const detail = JSON.parse(record.body).detail;
    const { raffle_id, participant_email, participant_name } = detail;
    
    try {
      // Obtener detalles del raffle
      const raffleResult = await docClient.send(new GetCommand({
        TableName: process.env.DYNAMODB_RAFFLES_TABLE,
        Key: { raffle_id }
      }));
      
      const raffle = raffleResult.Item;
      
      if (!raffle) {
        logger.warn('Raffle not found', { raffle_id });
        continue;
      }
      
      // Enviar email
      await sesClient.send(new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL,
        Destination: {
          ToAddresses: [participant_email]
        },
        Message: {
          Subject: {
            Data: `✓ Confirmación de participación - ${raffle.title}`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: generateEmailHtml(raffle, participant_name),
              Charset: 'UTF-8'
            },
            Text: {
              Data: generateEmailText(raffle, participant_name),
              Charset: 'UTF-8'
            }
          }
        }
      }));
      
      logger.info('Confirmation email sent', { raffle_id, participant_email });
      
    } catch (error) {
      logger.error('Failed to send email', { error, raffle_id, participant_email });
      throw error;  // Irá a DLQ
    }
  }
};

function generateEmailHtml(raffle, participantName) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1>¡Participación Confirmada! ✓</h1>
        </div>
        <div style="padding: 20px;">
          <h2>¡Hola ${participantName}!</h2>
          <p>Tu participación en el sorteo <strong>${raffle.title}</strong> fue confirmada exitosamente.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalles del Sorteo:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>📌 <strong>Sorteo:</strong> ${raffle.title}</li>
              <li>📅 <strong>Fecha de cierre:</strong> ${new Date(raffle.end_date).toLocaleString('es-PE')}</li>
              <li>👥 <strong>Participantes actuales:</strong> ${raffle.current_participants}</li>
            </ul>
          </div>
          
          <p>El ganador será anunciado automáticamente a las <strong>00:00h</strong> del día siguiente al cierre.</p>
          <p>¡Mucha suerte! 🍀</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>RaffleNow Perú SAC<br>
          Este es un correo automático, por favor no responder.</p>
        </div>
      </body>
    </html>
  `;
}

function generateEmailText(raffle, participantName) {
  return `
¡Hola ${participantName}!

Tu participación en el sorteo "${raffle.title}" fue confirmada exitosamente.

Detalles del Sorteo:
- Sorteo: ${raffle.title}
- Fecha de cierre: ${new Date(raffle.end_date).toLocaleString('es-PE')}
- Participantes actuales: ${raffle.current_participants}

El ganador será anunciado automáticamente a las 00:00h del día siguiente al cierre.

¡Mucha suerte! 🍀

---
RaffleNow Perú SAC
Este es un correo automático, por favor no responder.
  `;
}
```

**package.json:**
```json
{
  "name": "email-sender",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-ses": "^3.700.0",
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "@aws-lambda-powertools/logger": "^2.10.0"
  }
}
```

#### 3.3 Actualizar Lambda participation-process

**Archivo:** `app/lambdas/participation-process/package.json` (agregar dependencia SES)

```json
{
  "name": "participation-process",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "@aws-sdk/client-ses": "^3.700.0",
    "@aws-lambda-powertools/logger": "^2.10.0"
  }
}
```

**Archivo:** `app/lambdas/participation-process/index.mjs` (ya actualizado arriba)

#### 3.4 Actualizar Terraform - participation-process necesita permisos SES

**Archivo:** `iac/modules/compute/lambdas.tf` (actualizar)

```hcl
# Agregar policy para SES en participation-process
resource "aws_iam_role_policy" "participation_process_ses" {
  name = "ses-send-email"
  role = aws_iam_role.lambda_participation_process_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Agregar variable de entorno SES_FROM_EMAIL
resource "aws_lambda_function" "participation_process" {
  # ... configuración existente
  
  environment {
    variables = {
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
      DYNAMODB_RAFFLES_TABLE      = var.dynamodb_raffles_table_name
      SES_FROM_EMAIL              = "noreply@rafflenow.com"
      LOG_LEVEL                   = "INFO"
      ENVIRONMENT                 = var.environment
    }
  }
}
```

#### 3.5 Agregar validación de grupos Cognito en ingest-participation

**Archivo:** `app/lambdas/ingest-participation/index.mjs` (actualizar)

```javascript
// Al inicio del handler, después de parsear body
const cognitoGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'];
const userGroups = cognitoGroups ? cognitoGroups.split(',') : [];

// Validar que el usuario NO es administrador
if (userGroups.includes('Admins')) {
  logger.warn('Admin attempted to participate', { raffle_id: raffleId });
  return {
    statusCode: 403,
    body: JSON.stringify({
      error: 'forbidden',
      message: 'Los administradores no pueden participar en sorteos'
    })
  };
}
```

#### 3.6 Desplegar y validar

```bash
# 1. Preparar Lambdas
cd scripts
./prepare-lambdas.ps1

# 2. Aplicar Terraform
cd ../iac/environments/dev
terraform init
terraform plan
terraform apply

# 3. Test: Usuario normal participa (debe funcionar)
curl -X POST https://api.rafflenow.com/raffles/test-123/participate \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"participant_email": "user@example.com", "participant_name": "Test User"}'
# Esperado: 202 Accepted + email en 1-5 segundos

# 4. Test: Admin intenta participar (debe fallar)
curl -X POST https://api.rafflenow.com/raffles/test-123/participate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"participant_email": "admin@example.com", "participant_name": "Admin User"}'
# Esperado: 403 Forbidden

# 5. Verificar email recibido en inbox
```

**Entregable:** SES configurado, participation-process envía emails, admins bloqueados de participar, validación de duplicados funcionando.

---

### FASE 4: CloudFront Validation (2-3 horas)

**Objetivo:** Validar que CloudFront está sirviendo assets correctamente.

#### 4.1 Subir archivos de test a S3

```bash
# Crear archivos test
echo "<html><body><h1>CloudFront Test OK</h1></body></html>" > test.html
echo "test image" > test.jpg
echo "test webp" > test.webp

# Subir a S3
aws s3 cp test.html s3://rafflenow-dev-images/test.html --content-type "text/html"
aws s3 cp test.jpg s3://rafflenow-dev-images/test.jpg --content-type "image/jpeg"
aws s3 cp test.webp s3://rafflenow-dev-images/test.webp --content-type "image/webp"
```

#### 4.2 Probar acceso via CloudFront

```bash
# Obtener CloudFront domain
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_distribution_domain)

# Test 1: HTML
curl https://${CLOUDFRONT_DOMAIN}/test.html
# Debe devolver: <html><body><h1>CloudFront Test OK</h1></body></html>

# Test 2: Image
curl -I https://${CLOUDFRONT_DOMAIN}/test.jpg
# Debe devolver: HTTP/2 200, content-type: image/jpeg

# Test 3: WebP
curl -I https://${CLOUDFRONT_DOMAIN}/test.webp
# Debe devolver: HTTP/2 200, content-type: image/webp

# Test 4: Verificar cache headers
curl -I https://${CLOUDFRONT_DOMAIN}/test.jpg
# Debe incluir: x-cache: Hit from cloudfront (en segundo request)
```

#### 4.3 Validar comportamiento 404

```bash
curl -I https://${CLOUDFRONT_DOMAIN}/no-existe.jpg
# Debe devolver: HTTP/2 404
```

**Entregable:** CloudFront sirviendo assets correctamente, cache funcionando.

---

### FASE 5: Dual API Gateway (Público + Privado) (6-8 horas)

**Objetivo:** Segregar endpoints públicos (sin auth) vs privados (Cognito auth).

#### 5.1 Decisión de arquitectura

**API Gateway Público (sin auth):**
- `GET /raffles` (listar sorteos activos)
- `GET /raffles/{id}` (detalle de sorteo)
- `POST /raffles/{id}/participate` (participar - requiere Cognito pero via API público)

**API Gateway Privado (Cognito required):**
- `POST /raffles` (crear sorteo - admin)
- `PUT /raffles/{id}` (cerrar sorteo manualmente - admin)
- `GET /admin/raffles` (listar todos incluyendo cerrados - admin)
- `POST /raffles/{id}/upload-url` (generar presigned URL - admin)

#### 5.2 Crear módulo Terraform para API Privado

**Nuevo archivo:** `iac/modules/api-gateway-private/main.tf`

```hcl
# REST API
resource "aws_api_gateway_rest_api" "private_api" {
  name        = "${var.project_name}-${var.environment}-private-api"
  description = "Private API for admin operations (Cognito auth required)"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Authorizer Cognito
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "CognitoAuthorizer"
  rest_api_id   = aws_api_gateway_rest_api.private_api.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]
}

# Resources y métodos (similar a API público)
# ... (ver código completo en implementación)
```

#### 5.3 Actualizar API Público (remover auth de endpoints públicos)

**Archivo:** `iac/modules/api-gateway/methods.tf`

```hcl
# GET /raffles (público, sin authorizer)
resource "aws_api_gateway_method" "list_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "GET"
  authorization = "NONE"  # ← SIN AUTH
}

# POST /raffles/{id}/participate (requiere Cognito)
resource "aws_api_gateway_method" "participate" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.raffle_participate.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}
```

**Entregable:** 2 API Gateways funcionales, segregación público/privado validada.

---

### FASE 6: DynamoDB Optimizations (4-5 horas)

**Objetivo:** Crear índices GSI, optimizar queries, agregar cache en memoria.

#### 6.1 Crear GSI para queries frecuentes

**Archivo:** `iac/modules/storage/dynamodb.tf`

```hcl
# GSI: Listar raffles por status
resource "aws_dynamodb_table" "raffles" {
  # ... config existente
  
  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "end_date"
    projection_type = "ALL"
    
    read_capacity  = 0  # On-demand
    write_capacity = 0
  }
  
  # GSI: Listar participantes de un raffle (ya existe partition key)
  # Pero agregar projection específica para winner selection
  global_secondary_index {
    name            = "RaffleParticipantsIndex"
    hash_key        = "raffle_id"
    range_key       = "participated_at"
    projection_type = "INCLUDE"
    non_key_attributes = ["participant_email", "participant_name"]
    
    read_capacity  = 0
    write_capacity = 0
  }
}
```

#### 6.2 Cache en memoria para ingest-participation

**Archivo:** `app/lambdas/ingest-participation/index.mjs`

```javascript
// Cache global (persiste entre invocaciones warm)
const raffleCache = new Map();
const CACHE_TTL = 60 * 1000;  // 60 segundos

async function getRaffleWithCache(raffleId) {
  const cached = raffleCache.get(raffleId);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    logger.debug('Cache hit', { raffle_id: raffleId });
    return cached.data;
  }
  
  // Cache miss: consultar DynamoDB
  const result = await docClient.send(new GetCommand({
    TableName: process.env.DYNAMODB_RAFFLES_TABLE,
    Key: { raffle_id: raffleId }
  }));
  
  raffleCache.set(raffleId, {
    data: result.Item,
    timestamp: Date.now()
  });
  
  logger.debug('Cache miss', { raffle_id: raffleId });
  return result.Item;
}
```

**Beneficio:** Reduce 90% de GetItem calls en picos (10 requests/seg → 1 request/seg por raffle).

**Entregable:** GSI creados, cache implementado, queries optimizados.

---

### FASE 7: CloudWatch Dashboards (5-6 horas)

**Objetivo:** 4 dashboards profesionales para monitoreo.

#### 7.1 Dashboard 1: Business Metrics

**Archivo:** `iac/modules/observability/dashboards.tf`

```hcl
resource "aws_cloudwatch_dashboard" "business" {
  dashboard_name = "${var.project_name}-${var.environment}-business"

  dashboard_body = jsonencode({
    widgets = [
      # Participaciones por hora
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", period = 3600 }]
          ]
          title  = "Participaciones por Hora"
          region = var.aws_region
        }
      },
      # Tasa de conversión
      # ... más widgets
    ]
  })
}
```

#### 7.2 Dashboards 2-4 (Lambda, Infrastructure, Users)

*(Código completo en implementación)*

**Entregable:** 4 dashboards funcionando, métricas visualizadas.

---

### FASE 8: Route53 + ACM (3-4 horas)

**Objetivo:** Dominios personalizados con SSL.

#### 8.1 Configurar dominios

```hcl
resource "aws_route53_zone" "main" {
  name = "rafflenow.com"
}

resource "aws_route53_record" "api_public" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.rafflenow.com"
  type    = "A"
  
  alias {
    name                   = aws_api_gateway_domain_name.api_public.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.api_public.cloudfront_zone_id
    evaluate_target_health = true
  }
}
```

**Entregable:** Dominios funcionando con SSL.

---

### FASE 9: WAF (4-5 horas)

**Objetivo:** Protección contra ataques.

```hcl
resource "aws_wafv2_web_acl" "api_public" {
  name  = "${var.project_name}-${var.environment}-api-public-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000  # 2000 req / 5 min por IP
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRule"
      sampled_requests_enabled  = true
    }
  }
}
```

**Entregable:** WAF activo, rate limiting funcionando.

---

### FASE 10: Worker Email Notification (Ganador) (2-3 horas)

**Objetivo:** Enviar email al ganador directamente desde worker-process.

**Archivo:** `app/lambdas/worker-process/index.py` (actualizar)

```python
import boto3
import json
import os
from datetime import datetime

dynamodb = boto3.client('dynamodb')
ses = boto3.client('ses')

def handler(event, context):
    for record in event['Records']:
        detail = json.loads(record['body'])['detail']
        raffle_id = detail['raffle_id']
        
        # ... código existente de selección de ganador
        
        # Actualizar raffle con ganador
        dynamodb.update_item(
            TableName=os.environ['DYNAMODB_RAFFLES_TABLE'],
            Key={'raffle_id': {'S': raffle_id}},
            UpdateExpression='SET #status = :status, winner_email = :winner, winner_name = :winner_name',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': {'S': 'completed'},
                ':winner': {'S': winner_email},
                ':winner_name': {'S': winner_name}
            }
        )
        
        # NUEVO: Enviar email al ganador
        ses.send_email(
            Source=os.environ.get('SES_FROM_EMAIL', 'noreply@rafflenow.com'),
            Destination={
                'ToAddresses': [winner_email]
            },
            Message={
                'Subject': {
                    'Data': f'¡Felicitaciones! Ganaste el sorteo {raffle_title}',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Html': {
                        'Data': generate_winner_email_html(raffle_title, winner_name),
                        'Charset': 'UTF-8'
                    },
                    'Text': {
                        'Data': generate_winner_email_text(raffle_title, winner_name),
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        
        print(f"Winner notified: {winner_email} for raffle {raffle_id}")

def generate_winner_email_html(raffle_title, winner_name):
    return f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FFD700; color: #333; padding: 20px; text-align: center;">
          <h1>¡FELICITACIONES! 🎉</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hola {winner_name}</h2>
          <p>¡Tenemos excelentes noticias!</p>
          <p style="font-size: 18px; font-weight: bold; color: #4CAF50;">
            Ganaste el sorteo: {raffle_title}
          </p>
          <p>Nos pondremos en contacto contigo en las próximas 24 horas para coordinar la entrega del premio.</p>
          <p>Gracias por participar en RaffleNow</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>RaffleNow Perú SAC</p>
        </div>
      </body>
    </html>
    """

def generate_winner_email_text(raffle_title, winner_name):
    return f"""
¡FELICITACIONES! 🎉

Hola {winner_name}

¡Tenemos excelentes noticias!

Ganaste el sorteo: {raffle_title}

Nos pondremos en contacto contigo en las próximas 24 horas para coordinar la entrega del premio.

Gracias por participar en RaffleNow

---
RaffleNow Perú SAC
    """
```

**Terraform:** Agregar permisos SES a worker-process

```hcl
# iac/modules/compute/lambdas.tf
resource "aws_iam_role_policy" "worker_process_ses" {
  name = "ses-send-email"
  role = aws_iam_role.lambda_worker_process_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_lambda_function" "worker_process" {
  # ... config existente
  
  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE     = var.dynamodb_raffles_table_name
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
      SES_FROM_EMAIL             = "noreply@rafflenow.com"
    }
  }
}
```

**Entregable:** Ganador recibe email automáticamente al ser seleccionado.

---

### FASE 11: Testing E2E y Documentación (6-8 horas)

**Objetivo:** Validar flujo completo end-to-end.

#### 11.1 Tests automatizados

```bash
# Script: scripts/test-e2e.sh
#!/bin/bash

echo "=== Test E2E: Flujo completo de participación ==="

# 1. Crear raffle
RAFFLE_ID=$(curl -X POST https://admin-api.rafflenow.com/raffles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title": "Test Raffle", "end_date": "2025-12-31T23:59:00.000Z"}' \
  | jq -r '.raffle_id')

echo "✓ Raffle creado: $RAFFLE_ID"

# 2. Participar
curl -X POST https://api.rafflenow.com/raffles/$RAFFLE_ID/participate \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"participant_email": "test@example.com", "participant_name": "Test User"}'

echo "✓ Participación enviada"

# 3. Esperar email (validación manual)
echo "⏳ Verificar email recibido en inbox..."

# 4. Validar DynamoDB
aws dynamodb get-item \
  --table-name rafflenow-dev-participants \
  --key "{\"raffle_id\": {\"S\": \"$RAFFLE_ID\"}, \"participant_email\": {\"S\": \"test@example.com\"}}"

echo "✓ Test E2E completado"
```

#### 11.2 Documentación final

**Crear:** `docs/ARQUITECTURA-FINAL.md`

- Diagramas actualizados
- Costos reales (después de 1 mes)
- Métricas de performance
- Guía de troubleshooting

**Entregable:** Tests E2E pasando, documentación completa.

---

### Resumen del Plan

| Fase | Duración | Prioridad | Entregable |
|------|----------|-----------|-----------|
| 1. Bug Fixes | 4-5h | CRÍTICO | 3 bugs corregidos |
| 2. Lambda Powertools | 8-10h | ALTO | 7 Lambdas migrados |
| 3. Email Confirmación | 5-6h | ALTO | SES funcionando |
| 4. CloudFront Validation | 2-3h | MEDIO | Assets validados |
| 5. Dual API Gateway | 6-8h | ALTO | 2 APIs funcionando |
| 6. DynamoDB Optimization | 4-5h | MEDIO | GSI + cache |
| 7. CloudWatch Dashboards | 5-6h | MEDIO | 4 dashboards |
| 8. Route53 + ACM | 3-4h | MEDIO | Dominios con SSL |
| 9. WAF | 4-5h | ALTO | Protección activa |
| 10. Winner Email | 2-3h | MEDIO | Email ganador |
| 11. Testing E2E | 6-8h | CRÍTICO | Tests + docs |
| **TOTAL** | **48-62h** | | **Infra completa** |

**Próximo paso:** ¿Comenzamos con FASE 1 (Bug Fixes) o quieres ajustar alguna fase?
