# RaffleNow

RaffleNow es una plataforma de sorteos en linea que opera en Peru. La empresa ofrece sorteos con premios que van desde articulos del hogar hasta bienes inmuebles, con un modelo de negocio basado en participaciones de S/ 2.00 por boleto.

## Descripcion General

La plataforma permite a usuarios registrados participar en multiples sorteos simultaneos organizados por categorias segun el valor del premio:

- Sorteos pequenos (S/ 100-500): Electrodomesticos menores
- Sorteos medianos (S/ 500-5,000): Tecnologia y electronica
- Sorteos grandes (S/ 5,000-50,000): Vehiculos y viajes
- Sorteos premium (S/ 50,000+): Bienes inmuebles

Los sorteos tienen duraciones configurables entre 7 y 60 dias, y el cierre se realiza automaticamente a las 23:59 del dia programado.

## Arquitectura

![Diagrama de Infraestructura](diagrams/iac.png)

La plataforma implementa una arquitectura serverless event-driven en AWS, disenada para soportar picos de trafico de hasta 2,500 requests por segundo durante los ultimos minutos antes del cierre de sorteos.

### Patron Event-Driven

El sistema utiliza EventBridge como bus central de eventos para desacoplar los componentes y permitir escalado independiente. Los eventos principales que orquestan el flujo son:

- `participation.received`: Disparado cuando un usuario participa, procesado asincronamente via SQS
- `raffle.closed`: Disparado automaticamente a medianoche o manualmente por administradores, inicia seleccion de ganador
- `s3:ObjectCreated`: Disparado al subir imagenes, activa optimizacion automatica a formato WebP

Este patron permite que el API responda en menos de 200ms mientras el procesamiento pesado ocurre en segundo plano.

### Colas y Procesamiento Asincrono

SQS actua como buffer elastico entre los eventos y las funciones Lambda:

- Participations Queue: Acumula participaciones y las procesa en lotes de 100 mensajes
- Raffle Closed Queue: Encola sorteos cerrados para seleccion de ganadores
- Dead Letter Queue: Captura mensajes fallidos despues de 3 reintentos

### Componentes por Capa

**Distribucion**
- CloudFront como punto de entrada unico con dominio personalizado
- S3 para website estatico e imagenes optimizadas
- WAF con rate limiting de 2,000 requests por 5 minutos por IP

**Autenticacion**
- Cognito User Pool con grupos separados para usuarios y administradores
- Tokens JWT validados en API Gateway mediante authorizer

**APIs**
- API Gateway publico para consultas sin autenticacion
- API Gateway autenticado para participaciones y administracion
- Header X-Origin-Verify para bloquear acceso directo al API

**Computo**
- 8 funciones Lambda en Node.js para logica de negocio
- 1 worker en Python para seleccion aleatoria de ganadores
- Subida de imagenes via URLs prefirmadas de S3

**Almacenamiento**
- DynamoDB en modo on-demand con 3 tablas: Raffles, Participations, Winners
- S3 con carpetas separadas para imagenes originales y optimizadas

**Automatizacion**
- EventBridge con regla cron diaria a las 00:00 UTC para cierre automatico
- Lambda de optimizacion de imagenes disparada por eventos de S3

## Requisitos Previos

- Node.js 22.x o superior
- Python 3.11 o superior
- Terraform 1.5 o superior
- AWS CLI v2 configurado con credenciales validas

## Configuracion del Entorno

### 1. Configurar credenciales de AWS

El proyecto requiere un perfil de AWS configurado en `~/.aws/credentials`:

```
[su-perfil]
aws_access_key_id = SU_ACCESS_KEY
aws_secret_access_key = SU_SECRET_KEY
region = us-east-2
```

### 2. Configurar variables de Terraform

Cree el archivo `iac/environments/dev/terraform.tfvars` con las siguientes variables:

```
aws_region                 = "us-east-2"
environment                = "dev"
project_name               = "rafflenow"
aws_profile                = "su-perfil"
ses_sender_email           = "email-verificado@dominio.com"
origin_verify_header_value = "valor-secreto-generado"
```

Para generar el valor de `origin_verify_header_value`:

```
openssl rand -hex 32
```

Variables opcionales para dominio personalizado:

| Variable | Descripcion |
|----------|-------------|
| domain_name | Dominio para CloudFront (ej: rafflenow.es) |
| acm_certificate_arn | ARN del certificado SSL en us-east-1 |

## Despliegue

```
cd iac/environments/dev
terraform init
terraform plan
terraform apply
```

Los outputs de Terraform proporcionan las URLs de los endpoints y los IDs de recursos creados.

## Endpoints de API

Base URL: `https://{cloudfront_domain}/api/v1`

### Endpoints Publicos (sin autenticacion)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /public/raffles | Listar sorteos activos |
| GET | /public/raffles/{id} | Detalle de un sorteo |

### Endpoints Autenticados (requieren token JWT)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /raffles | Listar sorteos del usuario |
| GET | /raffles/{id} | Detalle con estado de participacion |
| POST | /raffles/{id}/participate | Participar en un sorteo |
| POST | /assets/upload | Obtener URL para subir imagen |

### Endpoints de Administrador

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /raffles | Crear nuevo sorteo |
| POST | /raffles/{id}/close | Cerrar sorteo manualmente |

## Consideraciones de Seguridad

- El archivo `terraform.tfvars` contiene valores sensibles y no debe incluirse en el repositorio
- El valor de `origin_verify_header_value` protege el API Gateway de accesos directos
- Los tokens JWT de Cognito expiran en 1 hora
- El email configurado en `ses_sender_email` debe estar verificado en Amazon SES
