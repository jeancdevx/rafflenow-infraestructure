# CONFIGURACION
Guía para configurar los parámetros, variables y archivos necesarios para desplegar la infraestructura de RaffleNow – Infraestructura como Código.

## 1. Estructura de carpetas

Dentro del proyecto encontrarás:

```bash
rafflenow-v2/
├─ iac/
│ ├─ modules/ 
│ │ ├─ compute/ 
│ │ ├─ api-gateway/ 
│ │ ├─ storage/ 
│ │ └─ scheduler/ 
│ └─ environments/
│ ├─ dev/
│ │ ├─ main.tf
│ │ ├─ variables.tf
│ │ ├─ outputs.tf
│ │ └─ dev.tfvars ← archivo de variables del entorno
│ ├─ qa/
│ └─ prod/
```

Cada ambiente (dev, qa, prod) tiene su propio conjunto de variables y configuraciones.

## 2. Variables principales (variables.tf)

Estas variables son comunes a todos los entornos.  
En el proyecto el archivo `iac/environments/dev/variables.tf` (o QA/Prod) deberían existir o agregarse las siguientes:

| Variable | Tipo | Descripción |
|-----------|------|-------------|
| aws_region | string | Región AWS donde se desplegará la infraestructura (por defecto us-east-2). |
| project_name | string | Nombre del proyecto para etiquetar los recursos. |
| environment | string | Nombre del entorno (dev, qa, prod). |
| tags | map(string) | Conjunto de etiquetas para control de costos y auditoría. |
| lambda_s3_bucket | string` | Nombre del bucket S3 donde se subirán los artefactos .zip de las Lambdas. |
| dynamodb_table_name | string | Nombre de la tabla principal de DynamoDB para sorteos. |
| ses_sender_email | string | Correo verificado en Amazon SES para enviar notificaciones. |
| sqs_queue_name | string | Nombre de la cola SQS para procesar eventos. |

## 3. Crear el archivo terraform.tfvars

Dentro de iac/environments/dev/, crea o edita el archivo `terraform.tfvars` con valores reales.  
Ejemplo de plantilla recomendada:

```hcl
# --- Parámetros generales ---
aws_region   = "us-east-2"
environment  = "dev"
project_name = "rafflenow"
aws_profile  = "perfil"

# --- Etiquetas (tags) ---
tags = {
  Project     = "RaffleNow"
  Environment = "dev"
  Owner       = "perfil"
  ManagedBy   = "Terraform"
}

# --- Recursos principales ---
lambda_s3_bucket    = "rafflenow-dev-artifacts"
dynamodb_table_name = "rafflenow-dev-raffles"
ses_sender_email    = "no-reply@rafflenow.dev"
sqs_queue_name      = "rafflenow-dev-queue"

```
## 4. Configurar SES (Amazon Simple Email Service)

El proyecto utiliza SES para enviar correos al ganador del sorteo.
Antes de desplegar:

Ingresa a la consola de AWS -> SES -> Verified Identities.

Verifica el dominio o el correo que usarás (ej. no-reply@rafflenow.dev).

Espera a que aparezca el estado "Verified".

Copia el correo verificado en la variable ses_sender_email de tu .tfvars.

Si no verificas el dominio, SES solo podrá enviar correos a direcciones “sandbox” (de prueba).

## 5. Configurar perfiles de AWS CLI
Verifica que tu perfil SSO esté correctamente autenticado (como se hizo en la instalación):
```bash
aws sso login --profile perfil

```
Puedes confirmar la región y cuenta asociadas:
```bash
aws configure list --profile perfil

```
Si todo se muestra correctamente, tu perfil está listo para ser usado con Terraform en el paso de provisionamiento
```bash
      profile perfil
   access_key - 
   secret_key - 
       region us-east-2
```
## 6. Recomendaciones
No subir el arhivo .tfvars al repositorio porque contiene información sensible.

Asegúrate de que todos los nombres de recursos sean únicos por entorno.

Revisa que el correo SES esté verificado antes de desplegar.

Siempre valida los cambios antes de aplicar con terraform validate.