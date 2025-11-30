# Mejoras de Logging para RaffleNow

## Estado Actual

Las Lambdas utilizan AWS Lambda Powertools con logs estructurados en JSON. La implementación actual cubre el 70% de las necesidades de observabilidad.

### Lo que ya funciona

- Logs estructurados en formato JSON
- Campos contextuales: `raffle_id`, `user_email`, `user_id`
- Niveles de log apropiados: `info`, `warn`, `error`
- Métricas custom en namespace `RaffleNow`
- Service name por Lambda

### Lo que falta

- Campo `action` estandarizado para filtrar operaciones
- Campo `error_code` para agrupar errores
- Campo `correlation_id` para trazar requests entre Lambdas
- Campos de negocio adicionales para contexto

---

## Cambios Propuestos

### 1. Campo `action`

Agregar un campo `action` estandarizado en cada log para identificar la operación.

#### Valores por Lambda

| Lambda | Action | Descripcion |
|--------|--------|-------------|
| ingest-participation | `PARTICIPATION_STARTED` | Inicio de procesamiento |
| ingest-participation | `PARTICIPATION_ACCEPTED` | Participacion enviada a cola |
| ingest-participation | `PARTICIPATION_REJECTED` | Rechazada por validacion |
| create-raffle | `RAFFLE_CREATED` | Sorteo creado exitosamente |
| create-raffle | `RAFFLE_CREATION_FAILED` | Fallo al crear sorteo |
| close-raffle | `RAFFLE_CLOSED` | Sorteo cerrado manualmente |
| close-raffle | `RAFFLE_CLOSE_FAILED` | Fallo al cerrar sorteo |
| check-expired-raffles | `EXPIRED_RAFFLE_FOUND` | Sorteo expirado detectado |
| check-expired-raffles | `EXPIRED_RAFFLE_CLOSED` | Sorteo expirado cerrado |
| participation-process | `PARTICIPATION_SAVED` | Participacion guardada en DB |
| participation-process | `PARTICIPATION_SAVE_FAILED` | Fallo al guardar |
| worker-process | `WINNER_SELECTION_STARTED` | Inicio de seleccion |
| worker-process | `WINNER_SELECTED` | Ganador seleccionado |
| worker-process | `WINNER_EMAIL_SENT` | Email enviado al ganador |
| worker-process | `WINNER_EMAIL_FAILED` | Fallo envio de email |
| get-raffle | `RAFFLE_RETRIEVED` | Sorteo consultado |
| list-raffles | `RAFFLES_LISTED` | Lista de sorteos consultada |
| upload-image | `IMAGE_UPLOAD_STARTED` | Inicio de subida |
| upload-image | `IMAGE_UPLOADED` | Imagen subida a S3 |
| image-optimizer | `IMAGE_OPTIMIZED` | Imagen optimizada |
| image-optimizer | `IMAGE_OPTIMIZATION_FAILED` | Fallo optimizacion |

#### Ejemplo de Implementacion

```javascript
// Antes
logger.info('Processing participation request', { ... })

// Despues
logger.info('Processing participation request', { 
  action: 'PARTICIPATION_STARTED',
  ...
})
```

---

### 2. Campo `error_code`

Agregar códigos de error estandarizados para facilitar agrupación y alertas.

#### Codigos de Error

| Codigo | Descripcion | HTTP Status |
|--------|-------------|-------------|
| `VALIDATION_FAILED` | Datos de entrada invalidos | 400 |
| `UNAUTHORIZED` | Token no proporcionado o invalido | 401 |
| `FORBIDDEN` | Usuario sin permisos para la accion | 403 |
| `RAFFLE_NOT_FOUND` | Sorteo no existe | 404 |
| `USER_NOT_FOUND` | Usuario no existe | 404 |
| `RAFFLE_EXPIRED` | Sorteo ya cerro por fecha | 410 |
| `RAFFLE_CLOSED` | Sorteo cerrado manualmente | 410 |
| `RAFFLE_FULL` | Sorteo alcanzo capacidad maxima | 409 |
| `DUPLICATE_PARTICIPATION` | Usuario ya participo en este sorteo | 409 |
| `NO_PARTICIPANTS` | Sorteo sin participantes al cerrar | 422 |
| `EMAIL_SEND_FAILED` | Fallo al enviar notificacion | 500 |
| `DATABASE_ERROR` | Error de DynamoDB | 500 |
| `QUEUE_ERROR` | Error al publicar en SQS/EventBridge | 500 |
| `INTERNAL_ERROR` | Error no categorizado | 500 |

#### Ejemplo de Implementacion

```javascript
// Antes
if (error instanceof ValidationError) {
  logger.warn('Validation error', { error: error.message })
}

// Despues
if (error instanceof ValidationError) {
  logger.warn('Validation error', { 
    error_code: 'VALIDATION_FAILED',
    error: error.message,
    ...error.details
  })
}
```

---

### 3. Campo `correlation_id`

Permite trazar una operacion desde la API hasta el procesamiento final.

#### Flujo

```
API Gateway -> ingest-participation -> EventBridge -> participation-process
     |                                                        |
     +-- correlation_id: "abc-123" -------------------------->+
```

#### Implementacion en ingest-participation

```javascript
// Generar o extraer correlation_id
const correlationId = event.headers['x-correlation-id'] 
  || event.requestContext?.requestId 
  || crypto.randomUUID()

logger.appendKeys({ correlation_id: correlationId })

// Incluir en evento publicado
await publishParticipationReceivedEvent({
  raffleId,
  raffle,
  participantData,
  correlationId
})
```

#### Implementacion en participation-process

```javascript
// Extraer de mensaje
const correlationId = message.detail.correlationId
logger.appendKeys({ correlation_id: correlationId })
```

---

### 4. Campos de Negocio Adicionales

Agregar contexto de negocio para facilitar troubleshooting.

#### ingest-participation

```javascript
// Despues de obtener el raffle
logger.appendKeys({
  raffle_title: raffle.title,
  raffle_owner_id: raffle.created_by,
  raffle_status: raffle.status,
  current_participants: raffle.current_participants,
  max_participants: raffle.max_participants
})
```

#### worker-process

```python
logger.info(
    "Winner selected",
    extra={
        "action": "WINNER_SELECTED",
        "total_participants": len(participants),
        "winner_email": winner['participant_email'],
        "selection_method": "random"
    }
)
```

#### list-raffles

```javascript
logger.info('Raffles listed', {
  action: 'RAFFLES_LISTED',
  result_count: raffles.length,
  filter_status: queryParams.status || 'all'
})
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `app/lambdas/ingest-participation/index.js` | Agregar `action`, `error_code` |
| `app/lambdas/ingest-participation/handler.js` | Agregar campos de negocio, `correlation_id` |
| `app/lambdas/participation-process/index.js` | Agregar `action`, `error_code`, `correlation_id` |
| `app/lambdas/create-raffle/index.js` | Agregar `action`, `error_code` |
| `app/lambdas/create-raffle/handler.js` | Agregar campos de negocio |
| `app/lambdas/close-raffle/index.js` | Agregar `action`, `error_code` |
| `app/lambdas/get-raffle/index.js` | Agregar `action` |
| `app/lambdas/list-raffles/index.js` | Agregar `action`, `result_count` |
| `app/lambdas/check-expired-raffles/index.js` | Agregar `action` |
| `app/lambdas/worker-process/index.py` | Agregar `action` (parcialmente implementado) |
| `app/lambdas/upload-image/index.js` | Agregar `action`, `error_code` |
| `app/lambdas/image-optimizer/index.js` | Agregar `action`, `error_code` |

---

## Queries de Logs Insights Habilitadas

Con estos cambios, las siguientes queries seran posibles:

```sql
-- Todas las participaciones rechazadas
fields @timestamp, raffle_id, user_email, error_code, message
| filter action = 'PARTICIPATION_REJECTED'
| sort @timestamp desc

-- Errores agrupados por tipo
fields error_code
| filter level = 'ERROR' or level = 'WARN'
| stats count(*) by error_code

-- Timeline de una participacion (usando correlation_id)
fields @timestamp, service, action, message
| filter correlation_id = 'abc-123'
| sort @timestamp asc

-- Sorteos con problemas de capacidad
fields @timestamp, raffle_id, raffle_title, current_participants, max_participants
| filter error_code = 'RAFFLE_FULL'

-- Tasa de exito de emails
fields action
| filter action in ['WINNER_EMAIL_SENT', 'WINNER_EMAIL_FAILED']
| stats count(*) by action
```

---

## Prioridad de Implementacion

1. **Alta**: `action` y `error_code` en `ingest-participation` y `worker-process`
2. **Media**: `correlation_id` para trazabilidad
3. **Baja**: Campos de negocio adicionales en otras Lambdas

---

## Testing

Antes de desplegar, verificar:

1. Los logs siguen siendo JSON valido
2. Los campos nuevos aparecen en CloudWatch
3. Las queries de Logs Insights funcionan
4. No hay impacto en performance (los logs son async)

---

## Referencias

- [AWS Lambda Powertools - Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/)
- [Structured Logging Best Practices](https://docs.aws.amazon.com/lambda/latest/operatorguide/parse-logs.html)
