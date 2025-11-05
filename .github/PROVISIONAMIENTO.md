# PROVISIONAMIENTO

Guía para crear, actualizar y destruir la infraestructura de RaffleNow con Terraform.

>  **Costos:** estos pasos sí crean recursos en AWS. Asegúrate de usar la cuenta/entorno correcto porque sino es muy pregriloso para el bolsillo

## 0) Prerrequisitos

- [ ] Completar **INSTALACION.md** (Git, Terraform, AWS CLI, VS Code).
- [ ] Completar **CONFIGURACION.md** y tienes iac/environments/dev/terraform.tfvars con valores reales.
- [ ] Tu perfil SSO está configurado: aws configure sso y se llama "perfil X".


## 1) Autenticarse en AWS (SSO)

Inicia sesión SSO (se abre el navegador):

```bash
aws sso login --profile perfil
```

## 2) Seleccionar entorno y preparar Terraform

```bash
# Muévete al entorno dev y prepara Terraform:
cd iac/environments/dev

# Inicializa

terraform init -upgrade

# Formatea y valida

terraform fmt -recursive
terraform validate
```
## 3) Generar plan
Crea el plan de cambios:

```bash
terraform plan
```
Si algo no está bien cancela aquí, corrige y vuelve a ejecutar plan.

## 4) Aplicar cambios (crear/actualizar recursos)
```bash
terraform apply
# Mostrará lo siguiente: 
# Do you want to perform these actions?
#  Terraform will perform the actions described above.
#  Only 'yes' will be accepted to approve.
# Enter a value: ---

```
Al finalizar, Terraform imprimirá cuántos recursos creó/actualizó y también los outputs definidos.

## 5) Destruir recursos (DEV solamente)
Solo si necesitas limpiar el entorno dev:
```bash
terraform plan -destroy
```
Irreversible: elimina todos los recursos gestionados por este estado.

## 6) Buenas prácticas y seguridad

Usa un perfil por entorno (ej.: perfildev, perfilqa, perfilprod) y configura el aws_profile en cada terraform.tfvars.

Revisa tags (Project, Environment, Owner, ManagedBy) para control de costos.

No uses -auto-approve en producción exige revisión manual.

Mantén retención de logs y budget alerts (costos) configurados fuera de este flujo si tu equipo lo requiere.
