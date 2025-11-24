# Plan de Implementación - RaffleNow AWS Migration

## Objetivo

Validar y completar la infraestructura actual de RaffleNow para que cumpla EXACTAMENTE con lo documentado en `PROCESO-NEGOCIO-Y-FLUJOS.md`. Cada fase se implementará en una rama separada para revisión individual.

## Alcance

Este plan cubre ÚNICAMENTE:
1. Lo descrito en el documento de análisis de negocio
2. Lo mostrado en el diagrama de arquitectura `diagrams/iac.png`
3. Validaciones y flujos operativos documentados

NO incluye: CI/CD detallado, optimizaciones de costo, disaster recovery avanzado, ni features no especificados.

---

## FASE 0: Infraestructura Base CloudFront + Route53

**Rama:** `feature/fase-0-cloudfront-route53`

### 0.1 Provisionar CloudFront Distribution de Prueba

**Problema Identificado:**
No hay forma de validar que la configuración de CloudFront funcione correctamente antes de implementar la aplicación real.

**Acciones Requeridas:**
- Crear bucket S3 temporal para hosting estático de prueba
- Subir archivo HTML simple `index.html` con mensaje "RaffleNow - CloudFront Working"
- Validar que CloudFront distribution sirva el HTML correctamente desde edge locations
- Validar cache behavior configurado con TTLs correctos
- Validar compresión gzip/brotli habilitada
- Validar HTTP/2 y HTTP/3 habilitados
- Eliminar HTML de prueba una vez validado

### 0.2 Configurar Route53 al Final

**Nota:** Route53 se configurará en la ÚLTIMA fase cuando toda la infraestructura esté funcionando en producción. Por ahora usar URLs de CloudFront directamente para testing.

---

## FASE 1: Arquitectura Dual API Gateway

**Rama:** `feature/fase-1-dual-api-gateway`

### 1.1 Separar API Gateway Público y Autenticado

**Problema Identificado:**
Actualmente existe un solo API Gateway que mezcla endpoints públicos y autenticados. El documento de negocio especifica 2 API Gateways separados.

**Acciones Requeridas:**
- Revisar módulo `iac/modules/api-gateway/` actual
- Crear dos REST APIs separadas:
  - **API Gateway Público:** Sin Cognito Authorizer
    - `GET /api/v1/raffles` (listar sorteos)
    - `GET /api/v1/raffles/{id}` (detalle sorteo)
  - **API Gateway Autenticado:** Con Cognito Authorizer
    - `POST /api/v1/assets/upload` (generar presigned URL - solo admins)
    - `POST /api/v1/raffles` (crear sorteo - solo admins)
    - `POST /api/v1/raffles/{id}/participate` (participar - usuarios autenticados)
    - `POST /api/v1/raffles/{id}/close` (cierre manual - solo admins)
- Actualizar outputs de Terraform para exponer ambas URLs
- Validar que Cognito Authorizer verifique grupos (Admin vs Usuario regular)

### 1.2 Configurar CORS en Ambos API Gateways

**Acciones Requeridas:**
- Configurar CORS permitiendo origen del frontend CloudFront
- Headers permitidos: `Authorization`, `Content-Type`
- Métodos permitidos: `GET`, `POST`, `OPTIONS`
- Credentials: `true` para API autenticado

---

## FASE 2: Modernización Lambdas Node.js 22 + Powertools

**Rama individual por cada Lambda:** `feature/fase-2-lambda-{nombre}`

### 2.1 Migración a Node.js 22 ES Modules

**Acciones Requeridas por Lambda:**
- Convertir de CommonJS (`require`/`exports`) a ES Modules (`import`/`export`)
- Agregar `"type": "module"` en `package.json`
- Actualizar imports con extensión `.js`
- Beneficio: sintaxis moderna, mejor performance, top-level await

### 2.2 Integrar AWS Lambda Powertools

**Acciones Requeridas:**
- Instalar `@aws-lambda-powertools/logger`, `@aws-lambda-powertools/tracer`, `@aws-lambda-powertools/metrics`
- Reemplazar logger custom por Powertools Logger con structured logging
- Habilitar tracing con Powertools Tracer para integración X-Ray
- Agregar métricas custom de negocio (participaciones por sorteo, ingresos, conversión)
- Configurar correlation IDs para debugging distribuido
- Beneficio: logs estructurados JSON, tracing automático, métricas CloudWatch custom

### 2.3 Validar Lógica de Negocio por Lambda

**Lambda create-raffle:**
- Validar que agregue campos: `prize_value`, `prize_description`, `category`, `max_participants`, `current_participants = 0`
- Validar cálculo de `category` según rangos (Pequeño: S/100-500, Mediano: S/500-5K, Grande: S/5K-50K, Premium: S/50K+)
- Validar que `max_participants = prize_value / 2` (ticket S/2.00)
- Validar `title` entre 10-200 caracteres
- Validar `description` entre 50-2000 caracteres
- Validar `prize_images` array de 1-5 URLs HTTPS de CloudFront
- Validar duración 7-60 días
- Validar `end_date` formato 23:59:00.000Z

**Lambda upload:**
- Validar que genere presigned URL de S3 válida por 5 minutos
- Validar que solo admins puedan invocar
- Retornar URL para folder `prizes/` (originales)

**Lambda image-optimizer:**
- Validar que consuma eventos de SQS Image Optimizer Queue
- Validar que convierta imágenes a WebP con calidad 80%
- Guardar en folder `optimized/`
- Validar batch_size=1 con maximum_batching_window=5 según event-source-mapping.tf

**Lambda list-raffles:**
- Implementar paginación (limit default 20, máximo 100)
- Implementar filtro por `status` usando GSI StatusEndDateIndex
- Implementar filtro por `category`
- Ordenar por `end_date` ascendente (próximos a cerrar primero)
- Retornar metadata: `total_count`, `has_more`, `next_cursor`

**Lambda get-raffle:**
- Si `status = active`: mostrar todos los campos, botón participar habilitado
- Si `status = processing`: ocultar `current_participants`, mensaje "Seleccionando ganador"
- Si `status = completed`: mostrar ganador (`winner_name`), `total_participants`
- Si `status = cancelled`: mostrar `cancellation_reason`
- Agregar campo calculado `participation_percentage`
- Agregar campo calculado `days_remaining`

**Lambda ingest-participation:**
- Validar que solo emita evento `participation.received` a EventBridge
- Validar `status = active`
- Validar `current_participants < max_participants`
- Validar `end_date > now()`
- Validar duplicado usando GSI (no existe participación previa del mismo user_id en raffle_id)
- NO escribir a DynamoDB (eso lo hace participation-process)
- Retornar HTTP 202 Accepted inmediatamente

**Lambda participation-process:**
- Validar que consuma SQS Participations Queue con batch_size=100, maximum_batching_window=1
- Por cada mensaje del batch:
  - Insertar en tabla Participations
  - Incrementar atómicamente `current_participants` en tabla Raffles
  - Enviar email confirmación usando SES (template simple)
- Implementar manejo de errores con ReportBatchItemFailures

**Lambda check-expired-raffles:**
- Validar que se ejecute mediante EventBridge cron `cron(0 0 * * ? *)` diario a medianoche
- Escanear tabla Raffles con filtros: `status=active` AND `end_date < now()`
- Por cada sorteo expirado:
  - Actualizar `status = processing`
  - Emitir evento `raffle.closed` a EventBridge
- NO enviar directo a SQS (usar EventBridge)

**Lambda close-raffle:**
- Validar que solo admins puedan invocar
- Actualizar `status = processing`
- Emitir evento `raffle.closed` a EventBridge
- Agregar campo `closed_by` para auditoría

**Lambda worker-process:**
- Validar que consuma SQS Raffle Closed Queue con batch_size=1
- Por cada sorteo cerrado:
  - Query tabla Participations con raffle_id
  - Seleccionar ganador con `random.choice()`
  - Actualizar tabla Raffles: `status=completed`, `winner_email`, `winner_name`, `winner_selected_at`
  - Crear registro en tabla Winners (ver FASE 3)
  - Enviar email ganador usando SES (template celebración)

---

## FASE 3: Modelo de Datos DynamoDB Completo

**Rama:** `feature/fase-3-dynamodb-schema`

### 3.1 Crear Tabla Winners

**Problema Identificado:**
No existe tabla Winners separada. Actualmente solo se guarda `winner_email` en tabla Raffles.

**Acciones Requeridas:**
- Crear recurso `aws_dynamodb_table.winners` en `iac/modules/storage/dynamodb.tf`
- Schema:
  - Hash key: `raffle_id` (S)
  - Atributos: `winner_email`, `winner_name`, `user_id`, `selected_at`, `total_participants`, `prize_description`, `prize_value`, `notification_sent` (boolean)
- Agregar GSI `UserIdIndex` con hash_key `user_id` para consultar premios ganados por usuario
- Point-in-time recovery habilitado
- Billing mode: PAY_PER_REQUEST
- Agregar output de table name y ARN
- Actualizar Lambda worker-process para escribir en Winners después de seleccionar ganador

### 3.2 Renombrar Tabla Participants a Participations

**Problema Identificado:**
Tabla se llama `participants` pero documento especifica `participations`.

**Acciones Requeridas:**
- Renombrar tabla en Terraform de `participants` a `participations`
- Cambiar hash_key de `raffle_id` a `participation_id` (UUID único)
- Mantener range_key `participant_email` como atributo regular
- Agregar GSI `RaffleIdIndex` con hash_key `raffle_id` para query por sorteo
- Agregar GSI `UserIdRaffleIdIndex` compuesto: hash_key `user_id`, range_key `raffle_id` para validar duplicados
- Actualizar todas las Lambdas que consultan esta tabla

### 3.3 Agregar Atributos de Negocio a Tabla Raffles

**Problema Identificado:**
Faltan atributos documentados: `prize_value`, `prize_description`, `category`, `current_participants`, `max_participants`.

**Acciones Requeridas:**
- Validar que Lambda create-raffle escriba todos estos campos al crear sorteo
- Validar que Lambda participation-process incremente `current_participants` atómicamente
- Validar que Lambda worker-process lea `current_participants` como `total_participants` final
- NO requiere cambios en Terraform (DynamoDB es schema-less, solo definir keys)

---

## FASE 4: Integración Amazon SES para Notificaciones

**Rama:** `feature/fase-4-ses-notifications`

### 4.1 Configurar SES y Verificar Dominio

**Acciones Requeridas:**
- Crear módulo `iac/modules/ses/` con recursos Terraform
- Verificar dominio `rafflenow.com` en SES
- Configurar registros DNS (DKIM, SPF, DMARC) en Route53 (cuando se configure)
- Por ahora usar email verificado manualmente para testing
- Agregar variable de entorno `SES_SENDER_EMAIL` a Lambdas participation-process y worker-process
- Agregar permisos IAM para `ses:SendEmail` y `ses:SendTemplatedEmail`

### 4.2 Crear Templates de Email

**Acciones Requeridas:**
- **Template ParticipationConfirmation:**
  - Asunto: "Confirmación de participación - {raffle_title}"
  - Cuerpo HTML simple con: logo, mensaje confirmación, detalles sorteo, número de participación, fecha de cierre
  - Variables: `participant_name`, `raffle_title`, `prize_value`, `participation_number`, `end_date`
- **Template WinnerNotification:**
  - Asunto: "¡Felicidades! Ganaste {raffle_title}"
  - Cuerpo HTML celebración con: confetti visual, mensaje personalizado, detalles premio, instrucciones reclamo, total participantes
  - Variables: `winner_name`, `raffle_title`, `prize_description`, `prize_value`, `total_participants`

### 4.3 Implementar Envío en Lambdas

**Lambda participation-process:**
- Después de insertar en DynamoDB, invocar SES con template ParticipationConfirmation
- Si falla SES, loggear error pero NO fallar Lambda (participación ya guardada)

**Lambda worker-process:**
- Después de actualizar Winners, invocar SES con template WinnerNotification
- Actualizar `notification_sent = true` solo si email enviado exitosamente

---

## FASE 5: Configuración WAF y Rate Limiting

**Rama:** `feature/fase-5-waf-rate-limiting`

### 5.1 Configurar AWS WAF Web ACL

**Acciones Requeridas:**
- Crear módulo `iac/modules/waf/` si no existe
- Configurar Web ACL asociado a ambos API Gateways
- Reglas documentadas:
  - Rate limiting: 2,000 requests por 5 minutos por IP
  - AWS Managed Rules: SQLi, XSS, Known Bad Inputs, Bot Control, IP Reputation
- Acción: BLOCK para violaciones
- Logs: habilitar logging a CloudWatch Logs para análisis

### 5.2 API Gateway Throttling

**Acciones Requeridas:**
- Configurar en ambos API Gateways:
  - Global: `rate_limit = 10000` RPS, `burst_limit = 5000`
  - Method-specific:
    - `POST /participate`: 2500 RPS
    - `GET /raffles`: 5000 RPS
    - `POST /raffles`: 100 RPS

---

## FASE 6: Cognito Advanced Security

**Rama:** `feature/fase-6-cognito-security`

### 6.1 Habilitar Advanced Security Features

**Problema Identificado:**
Cognito User Pool no tiene Advanced Security habilitado según documento (bloquea 95% bots).

**Acciones Requeridas:**
- Agregar bloque `user_pool_add_ons` en `iac/modules/cognito/user-pool.tf`:
  ```
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }
  ```
- Configurar risk configuration:
  - BLOCK si risk = HIGH
  - REQUIRE MFA si risk = MEDIUM (pero MFA es opcional, ver 6.2)
  - ALLOW si risk = LOW

### 6.2 Configurar MFA Opcional

**Problema Identificado:**
Documento especifica MFA opcional para usuarios, actualmente está OFF.

**Acciones Requeridas:**
- Cambiar `mfa_configuration = "OFF"` a `mfa_configuration = "OPTIONAL"`
- Habilitar software token MFA (TOTP - Google Authenticator, Authy)
- Usuarios pueden habilitar MFA desde su perfil (implementación en frontend, fuera de scope backend)

---

## FASE 7: CloudWatch Observability Stack Empresarial

**Rama:** `feature/fase-7-cloudwatch-observability`

**Referencia:** Basado en prácticas de observability de empresas como Netflix, Amazon, Datadog, New Relic que manejan sistemas distribuidos de alta escala.

### 7.1 Arquitectura de Observability en 3 Pilares

**Concepto Fundamental:**
Empresas grandes implementan observability basada en 3 pilares interconectados (Metrics, Logs, Traces) conocido como "The Three Pillars of Observability". No son dashboards aislados sino sistema unificado.

**Acciones Requeridas:**
- Crear módulo `iac/modules/monitoring/` con estructura:
  - `dashboards.tf` - Definiciones CloudWatch Dashboards
  - `metrics.tf` - CloudWatch Metrics custom y composite
  - `log_insights.tf` - Saved queries de CloudWatch Logs Insights
  - `service_lens.tf` - Configuración CloudWatch ServiceLens (unifica X-Ray + CloudWatch)
  - `contributor_insights.tf` - CloudWatch Contributor Insights para top-N analysis

### 7.2 Golden Signals Dashboard (SRE - Google)

**Concepto:**
Google SRE define "Golden Signals" como las 4 métricas críticas para monitorear cualquier sistema: Latency, Traffic, Errors, Saturation. Este dashboard es el ÚNICO que debe estar en pantallas 24/7 de operaciones.

**Widgets:**

**Row 1: Latency (percentiles p50, p90, p95, p99, p99.9)**
- API Gateway latency por endpoint con percentiles en gráfica de líneas múltiples (5min granularity)
- Lambda duration percentiles por función crítica (ingest-participation, participation-process, worker-process)
- DynamoDB query latency percentiles por tabla
- End-to-end latency calculada con X-Ray (desde CloudFront hasta respuesta final)
- Anotación visual de SLA (línea roja en 500ms para p95, 1s para p99)

**Row 2: Traffic (throughput y request rate)**
- Requests por segundo (RPS) por API Gateway endpoint con línea de tendencia 24h
- Lambda invocations por minuto por función con stacked area (total system throughput)
- DynamoDB read/write capacity units consumidos vs provisioned (aunque es on-demand, muestra patrón)
- SQS messages enviados/recibidos/procesados por cola con diferencia visual (queue lag)
- CloudFront requests por región geográfica (mapa de calor)

**Row 3: Errors (tasa de error y distribución)**
- Error rate porcentual por servicio (Lambda, API Gateway, DynamoDB) con threshold en 0.1%
- HTTP status codes distribution (2xx, 4xx, 5xx) en stacked bar por endpoint
- Lambda errors por tipo (Timeout, OutOfMemory, UnhandledError, Throttled) en donut chart
- DynamoDB throttling events con alarma visual
- SQS Dead Letter Queue depth con alarma crítica si >0
- Tasa de fallos de email SES (bounce rate, complaint rate)

**Row 4: Saturation (utilización de recursos)**
- Lambda concurrent executions vs límite de cuenta (1000) con gauge y línea de tendencia
- Lambda memory utilization (used/allocated) por función para identificar over-provisioning
- DynamoDB table storage size con proyección de crecimiento
- SQS ApproximateAgeOfOldestMessage por cola (indica lag de procesamiento)
- API Gateway throttling events (429 responses)
- CloudFront origin response time (indica saturación en backend)

**Row 5: Business KPIs Integration**
- Revenue per minute calculado desde participaciones × S/2.00
- Active raffles count con breakdown por categoría
- Conversion funnel: Visits → Raffle Views → Participations (embudo visual)
- Average participation time (tiempo desde ver sorteo hasta participar)

### 7.3 RED Dashboard (Rate, Errors, Duration) - Microservices Pattern

**Concepto:**
Método RED de Weaveworks para monitorear microservices individualmente. Similar a Golden Signals pero más granular por servicio.

**Estructura:**
Un dashboard por cada Lambda function crítica con 3 rows fijas:

**Lambda: ingest-participation**
- **Rate:** Invocations per second con tendencia 1h/24h/7d
- **Errors:** Error rate % con breakdown por error type (ValidationError, RaffleNotActive, DuplicateParticipation, MaxParticipantsReached)
- **Duration:** p50/p95/p99 latency con distribución histogram
- **Extras:** Eventos emitidos a EventBridge (participation.received count), validaciones fallidas por tipo

**Lambda: participation-process**
- **Rate:** Batch processing rate (batches/min), messages por batch (avg/max)
- **Errors:** Failed messages count, DLQ messages, SES delivery failures
- **Duration:** Batch processing time con breakdown: DynamoDB write time, SES send time, total
- **Extras:** Current_participants incrementos por segundo, emails enviados exitosamente

**Lambda: worker-process**
- **Rate:** Sorteos procesados por hora
- **Errors:** Winner selection failures, Cognito validation failures, SES failures
- **Duration:** Processing time por tamaño de sorteo (small: <5s, medium: <30s, large: <2min, premium: <5min)
- **Extras:** Participantes totales procesados, intentos de selección hasta encontrar ganador válido (avg)

**Lambda: check-expired-raffles**
- **Rate:** Ejecuciones diarias (debería ser 1), sorteos detectados por ejecución
- **Errors:** Scan failures, eventos no emitidos
- **Duration:** Scan time, eventos emitidos count
- **Extras:** Sorteos cerrados automáticamente vs manualmente (ratio)

### 7.4 USE Dashboard (Utilization, Saturation, Errors) - Infraestructura

**Concepto:**
Método USE de Brendan Gregg para monitorear recursos de infraestructura. Enfocado en capacity planning.

**DynamoDB Tables:**
- **Utilization:** Read/Write capacity consumed (on-demand muestra patrón de uso)
- **Saturation:** Throttled requests count (debe ser 0)
- **Errors:** System errors, conditional check failures
- **Extras:** Item count por tabla, table size in bytes, GSI performance

**Lambda Functions:**
- **Utilization:** Memory utilization %, duration utilization (usado/timeout)
- **Saturation:** Throttles, concurrent execution vs límite
- **Errors:** All error types aggregated
- **Extras:** Cold start frequency, provisioned concurrency utilization (si aplica)

**SQS Queues:**
- **Utilization:** Messages in flight, messages available
- **Saturation:** ApproximateAgeOfOldestMessage (>1min indica saturación)
- **Errors:** Messages moved to DLQ, failed delivery attempts
- **Extras:** Throughput (messages sent/received/deleted per minute)

**S3 Bucket:**
- **Utilization:** Total storage by folder (prizes/, optimized/)
- **Saturation:** Request rate vs bucket limits (raramente aplica)
- **Errors:** 5xx errors, failed uploads
- **Extras:** Average object size, total object count, lifecycle transitions

### 7.5 CloudWatch ServiceLens - Distributed Tracing Integration

**Concepto:**
CloudWatch ServiceLens unifica X-Ray traces con CloudWatch metrics en una vista de service map. Empresas como AWS, Uber, Airbnb usan esta integración para correlacionar latencia con errores.

**Acciones Requeridas:**
- Habilitar ServiceLens en CloudWatch console
- Configurar service map mostrando:
  - CloudFront → API Gateway Público → Lambdas (list-raffles, get-raffle)
  - CloudFront → API Gateway Autenticado → Cognito → Lambdas (create-raffle, ingest-participation, close-raffle)
  - EventBridge → SQS → Lambdas consumer (participation-process, worker-process, image-optimizer)
  - Lambdas → DynamoDB (queries/scans/writes con latencia)
  - Lambdas → SES (email sends con success rate)
- Configurar trace groups por flujo de negocio:
  - "Raffle Creation Flow": upload → image-optimizer → create-raffle
  - "Participation Flow": ingest-participation → EventBridge → participation-process
  - "Raffle Closing Flow": check-expired-raffles → worker-process
- Configurar trace queries guardadas:
  - "Slow Participations": traces con duration >1s en participation flow
  - "Failed Raffle Creations": traces con errores en creation flow
  - "DynamoDB Hot Keys": traces con DynamoDB throttling

### 7.6 CloudWatch Logs Insights - Saved Queries Empresariales

**Concepto:**
Empresas grandes pre-configuran queries complejas de logs para debugging rápido. No esperan a que ocurra incidente para escribir query.

**Queries Guardadas:**

**Query: "Top 10 Errores por Función Lambda (última hora)"**
```
fields @timestamp, function_name, error_type, error_message
| filter level = "ERROR"
| stats count(*) as error_count by function_name, error_type
| sort error_count desc
| limit 10
```

**Query: "Latencia p99 por Endpoint API (últimas 24h)"**
```
fields @timestamp, endpoint, duration
| filter endpoint != "" and duration > 0
| stats pct(duration, 99) as p99_latency by endpoint
| sort p99_latency desc
```

**Query: "Participaciones Fallidas con Razón (última hora)"**
```
fields @timestamp, raffle_id, user_id, failure_reason
| filter function_name = "ingest-participation" and level = "WARN"
| parse @message "Validation failed: *" as failure_reason
| stats count(*) by failure_reason
| sort count desc
```

**Query: "Sorteos Sin Participantes al Cerrar (última semana)"**
```
fields @timestamp, raffle_id, raffle_title, category
| filter function_name = "worker-process" and @message like "No participants found"
| display @timestamp, raffle_id, raffle_title, category
```

**Query: "Cold Starts por Lambda (última hora)"**
```
fields @timestamp, function_name, @initDuration
| filter @type = "REPORT" and @initDuration > 0
| stats count(*) as cold_starts, avg(@initDuration) as avg_init_ms by function_name
| sort cold_starts desc
```

**Query: "Correlation ID Trace - Seguir Request Completo"**
```
fields @timestamp, @message, correlation_id, function_name
| filter correlation_id = "VALOR-DINAMICO"
| sort @timestamp asc
| display @timestamp, function_name, @message
```

**Query: "DynamoDB Throttling Events con Tabla Afectada"**
```
fields @timestamp, function_name, table_name, operation
| filter @message like "ProvisionedThroughputExceededException"
| stats count(*) as throttle_count by table_name, operation
| sort throttle_count desc
```

**Query: "SQS Message Processing Lag"**
```
fields @timestamp, queue_name, 
       sentTimestamp, 
       receiveTimestamp, 
       (receiveTimestamp - sentTimestamp)/1000 as lag_seconds
| filter queue_name != ""
| stats avg(lag_seconds) as avg_lag, max(lag_seconds) as max_lag by queue_name
```

### 7.7 CloudWatch Contributor Insights - Top-N Analysis

**Concepto:**
Identificar automáticamente los top contributors a métricas clave (top IPs generando errores, top usuarios participando, top sorteos con tráfico).

**Reglas a Crear:**

**Rule: "Top 10 IPs Generando Errores 5xx"**
- Log group: API Gateway access logs
- Pattern: filtrar status code 5xx
- Contributor: IP address
- Output: Top 10 IPs con más errores en últimas 24h

**Rule: "Top 10 Usuarios Más Activos (Participaciones)"**
- Log group: Lambda ingest-participation logs
- Pattern: eventos participation.received exitosos
- Contributor: user_id
- Output: Top 10 usuarios con más participaciones en última semana

**Rule: "Top 10 Sorteos con Más Tráfico"**
- Log group: Lambda get-raffle logs
- Pattern: requests GET exitosos
- Contributor: raffle_id
- Output: Top 10 sorteos más visitados en últimas 24h

**Rule: "Top 10 Endpoints con Mayor Latencia"**
- Log group: API Gateway execution logs
- Pattern: filtrar latency >1s
- Contributor: endpoint path
- Output: Top 10 endpoints más lentos

### 7.8 CloudWatch Anomaly Detection - Machine Learning Automático

**Concepto:**
CloudWatch puede crear modelos ML automáticos que aprenden patrones normales y alertan sobre anomalías sin definir thresholds estáticos.

**Métricas con Anomaly Detection:**
- Lambda invocations por función (detecta picos anormales o caídas súbitas)
- API Gateway request rate por endpoint (detecta ataques DDoS o tráfico inusual)
- DynamoDB consumed capacity (detecta queries ineficientes nuevas)
- SQS messages in queue (detecta cuellos de botella)
- Cognito daily active users (detecta bots o caída de tráfico real)
- CloudFront cache hit ratio (detecta problemas de cache invalidation)

**Configuración:**
- Training period: 14 días (2 semanas para aprender patrones normales incluyendo fines de semana)
- Confidence band: 2 standard deviations (99.7% confianza)
- Alarma si métrica sale del band durante 2 períodos consecutivos

### 7.9 Custom Business Metrics con CloudWatch Embedded Metrics Format (EMF)

**Concepto:**
En lugar de usar CloudWatch PutMetricData API (caro y lento), empresas grandes usan EMF en logs estructurados que CloudWatch convierte automáticamente en métricas.

**Implementación en Lambdas con Powertools:**
```javascript
// Powertools Metrics ya usa EMF internamente
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({ namespace: 'RaffleNow/Business' });

// En Lambda ingest-participation
metrics.addMetric('ParticipationAttempt', MetricUnits.Count, 1);
metrics.addMetric('ParticipationSuccess', MetricUnits.Count, success ? 1 : 0);
metrics.addDimension('RaffleCategory', raffle.category);
metrics.addDimension('RaffleStatus', raffle.status);

// En Lambda participation-process
metrics.addMetric('Revenue', MetricUnits.Count, 2.00); // S/ 2.00 por participación
metrics.addMetric('EmailsSent', MetricUnits.Count, emailsSentCount);

// En Lambda worker-process
metrics.addMetric('WinnerSelected', MetricUnits.Count, 1);
metrics.addMetric('PrizeValue', MetricUnits.Count, raffle.prize_value);
metrics.addDimension('PrizeCategory', raffle.category);
```

**Métricas Custom a Crear:**
- `ParticipationAttempt`, `ParticipationSuccess`, `ParticipationFailed` por categoría
- `Revenue` acumulado con dimensión por categoría
- `RaffleCreated`, `RaffleClosed`, `RaffleCancelled`
- `WinnerSelected` con dimensión prize_value_range
- `EmailSent`, `EmailBounced`, `EmailComplaint`
- `ImageOptimized` con compression_ratio
- `CognitoSignUp`, `CognitoSignIn`, `CognitoMFAEnabled`

### 7.10 Dashboard Ejecutivo (C-Level) - Business Intelligence

**Concepto:**
Dashboard simplificado con SOLO métricas de negocio que entienda management sin contexto técnico. Actualización en tiempo real.

**Widgets:**

**KPI Cards (número grande):**
- Revenue Today: S/ XXX,XXX (calculado desde participaciones × 2)
- Revenue MTD: S/ X,XXX,XXX (Month-to-Date)
- Active Users Today: X,XXX (DAU - Daily Active Users)
- Active Raffles: XX sorteos

**Conversion Funnel (embudo visual):**
- Visitors: 100,000 (100%)
- Raffle Views: 45,000 (45%)
- Participations: 15,000 (15% conversion total, 33% de viewers)

**Revenue by Category (stacked area 30 días):**
- Premium: línea superior (mayor ingreso por sorteo)
- Grande: línea media
- Mediano: línea inferior
- Pequeño: línea base

**Geographic Distribution (mapa Perú):**
- Heatmap de participaciones por departamento
- Top 5: Lima (60%), Arequipa (8%), Cusco (5%), Trujillo (4%), Piura (3%)

**Growth Metrics (líneas tendencia):**
- MAU (Monthly Active Users) últimos 12 meses con proyección ML
- Revenue últimos 12 meses con proyección
- Average Revenue Per User (ARPU) tendencia

**System Health Score (gauge 0-100):**
- Calculado desde: availability (40%), error rate (30%), latency (20%), saturation (10%)
- Verde >95, Amarillo 90-95, Rojo <90

---

## FASE 8: CloudWatch Alarms

**Rama:** `feature/fase-8-cloudwatch-alarms`

### 8.1 Alarmas Críticas

**Acciones Requeridas:**
- Crear módulo `iac/modules/monitoring/alarms.tf`
- Configurar alarmas documentadas en sección 5.7:
  - API Gateway error rate >1% (5xx) durante 2 períodos de 1 minuto
  - Lambda errors >0.5% en funciones críticas durante 5 minutos
  - DynamoDB throttled requests >10/min
  - Dead Letter Queue depth >100 mensajes
  - Cron check-expired-raffles falló ejecución

**Nota:** NO usar SNS/PagerDuty (no está en diagrama). Las alarmas solo cambian estado en CloudWatch. Notificaciones se implementarán posteriormente si es necesario.

### 8.2 Alarmas Warning

**Acciones Requeridas:**
- Lambda p99 latency >5 segundos
- API Gateway p95 latency >1 segundo
- CloudFront 4xx error rate >5%
- Cognito failed login rate >10%
- SQS queue depth >1,000 mensajes

### 8.3 Alarmas Info

**Acciones Requeridas:**
- Storage S3 excediendo 1TB
- Costo diario AWS excediendo threshold configurado

---

## FASE 9: AWS X-Ray Tracing

**Rama:** `feature/fase-9-xray-tracing`

### 9.1 Habilitar X-Ray en Lambdas

**Acciones Requeridas:**
- Agregar `tracing_config { mode = "Active" }` a todas las Lambdas en `iac/modules/compute/lambdas.tf`
- Ya está integrado con Powertools Tracer (FASE 2)
- Configurar sampling rules: 100% errores, 10% requests exitosos

### 9.2 Habilitar X-Ray en API Gateway

**Acciones Requeridas:**
- Agregar `xray_tracing_enabled = true` en ambos API Gateways en `iac/modules/api-gateway/rest-api.tf`
- Validar que traces muestren cadena completa: CloudFront → API Gateway → Lambda → DynamoDB/SQS

---

## FASE 10: Configuración Route53 Final

**Rama:** `feature/fase-10-route53-dns`

### 10.1 Registrar Dominio y Configurar DNS

**Acciones Requeridas:**
- Crear módulo `iac/modules/route53/` con hosted zone
- Configurar registros DNS:
  - A record alias a CloudFront distribution
  - CNAME records para API Gateways
  - MX, TXT records para SES (DKIM, SPF, DMARC)
- Validar propagación DNS global
- Actualizar frontend para usar dominio custom en lugar de URLs CloudFront/API Gateway directas

---

## FASE 11: Validación End-to-End

**Rama:** `feature/fase-11-e2e-validation`

### 11.1 Testing Manual de Flujos Completos

**Acciones Requeridas:**
- Flujo creación sorteo:
  - Login admin → POST /assets/upload → subir imagen a S3 → validar optimización automática → POST /raffles → validar sorteo creado
- Flujo participación:
  - Login usuario → GET /raffles → GET /raffles/{id} → POST /participate → validar email confirmación → validar incremento current_participants
- Flujo cierre automático:
  - Esperar medianoche → validar cron ejecutó → validar sorteo cambió a processing → validar ganador seleccionado → validar email ganador
- Flujo cierre manual:
  - Login admin → POST /raffles/{id}/close → validar processing → validar ganador seleccionado
- Flujo consulta pública:
  - Sin login → GET /raffles → GET /raffles/{id} → validar contenido varía por status

### 11.2 Validar Métricas y Dashboards

**Acciones Requeridas:**
- Validar que dashboards CloudWatch muestren datos reales
- Validar que alarmas se disparen correctamente en escenarios de error simulados
- Validar que X-Ray traces muestren latencias correctas
- Validar que métricas custom de negocio se registren

---

## Resumen de Ramas y Orden de Implementación

1. `feature/fase-0-cloudfront-route53` → Validar CloudFront con HTML prueba
2. `feature/fase-1-dual-api-gateway` → Separar APIs público/autenticado
3. `feature/fase-2-lambda-create-raffle` → Modernizar + validar lógica negocio
4. `feature/fase-2-lambda-upload` → Modernizar + presigned URLs
5. `feature/fase-2-lambda-image-optimizer` → Modernizar + WebP
6. `feature/fase-2-lambda-list-raffles` → Modernizar + paginación/filtros
7. `feature/fase-2-lambda-get-raffle` → Modernizar + contenido variable
8. `feature/fase-2-lambda-ingest-participation` → Modernizar + solo emit evento
9. `feature/fase-2-lambda-participation-process` → Modernizar + batch 100
10. `feature/fase-2-lambda-check-expired-raffles` → Modernizar + cron diario
11. `feature/fase-2-lambda-close-raffle` → Modernizar + emit evento
12. `feature/fase-2-lambda-worker-process` → Modernizar + selección ganador
13. `feature/fase-3-dynamodb-schema` → Tabla Winners + renombrar Participations
14. `feature/fase-4-ses-notifications` → Templates email + integración
15. `feature/fase-5-waf-rate-limiting` → WAF rules + throttling
16. `feature/fase-6-cognito-security` → Advanced Security + MFA opcional
17. `feature/fase-7-cloudwatch-dashboards` → 4 dashboards con métricas
18. `feature/fase-8-cloudwatch-alarms` → Alarmas críticas/warning/info
19. `feature/fase-9-xray-tracing` → Tracing distribuido
20. `feature/fase-10-route53-dns` → DNS configuración final
21. `feature/fase-11-e2e-validation` → Testing completo

Cada rama se mergeará a `develop` → `qa` → `release/vX.X.X` → `production` siguiendo estrategia documentada.

---

## Métricas de Éxito

Al completar este plan:
- Captura de participaciones: 98% (vs 30% actual)
- Latencia p95 API Gateway: <500ms
- Tasa de error Lambda: <0.1%
- Disponibilidad: 99.9%
- Tiempo de recovery: <5 minutos
- Todas las validaciones de negocio implementadas según documento
- Arquitectura dual API Gateway funcionando
- Notificaciones SES operativas
- Dashboards mostrando métricas reales
- Sistema completo alineado con PROCESO-NEGOCIO-Y-FLUJOS.md
