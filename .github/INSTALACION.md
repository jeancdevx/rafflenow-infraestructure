# INSTALACION

Guía para preparar el entorno local de trabajo del proyecto RaffleNow – Infraestructura como Código.

## 1. Requisitos del sistema

Se recomienda:
- Sistema operativo: Windows 10/11, macOS o Linux (x86_64 o ARM64)  
- Conexión a Internet: necesaria para descargar herramientas y autenticarse en AWS  
- Tiempo: para hacer todo esto

## 2. Herramientas necesarias

Instala las siguientes herramientas:

| Herramienta | Versión mínima | Descripción | Enlace |
|--------------|----------------|--------------|--------|
| Git | 2.30+ | Control de versiones para clonar y sincronizar el repositorio. | [https://git-scm.com/downloads](https://git-scm.com/downloads) |
| Terraform | 1.6+ | Motor de infraestructura como código (IaC) para desplegar recursos en AWS. | [https://developer.hashicorp.com/terraform/downloads](https://developer.hashicorp.com/terraform/downloads) |
| AWS CLI | 2.13+ | Interfaz oficial para autenticación y comunicación con AWS. | [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| VS Code | Última | Editor recomendado para visualizar y editar los archivos del proyecto. | [https://code.visualstudio.com/](https://code.visualstudio.com/) |

> *Opcional*:  
> - **Insomnia** – solo si más adelante vas a probar los endpoints del API Gateway.

## 3. Verificar instalación

Abre una terminal (CMD o PowerShell en Windows / Terminal en macOS o Linux) y ejecuta:

```bash
git --version
terraform -version
aws --version
```

## 4. Clonar repositorio
Esto clonará el repo y abrirá Visual Studio Code con toda la estructura del repositorio lista para trabajar.
```bash
git clone https://github.com/jeancdevx/rafflenow-v2.git
cd rafflenow-v2
code .
```
Si vas a trabajar sobre la rama de desarrollo:
```bash
git checkout develop
git pull origin develop
```

## 5. Autenticación en AWS (SSO)
El proyecto utiliza AWS IAM Identity Center (SSO) para autenticarse de manera segura.
Ejecuta lo siguiente en la terminal:
```bash
aws configure sso
```
En la cmd te pedirá varios datos. Usa estas referencias:
| Pregunta en consola                | Ejemplo de respuesta                   | Descripción                                     |
| ---------------------------------- | -------------------------------------- | ----------------------------------------------- |
| **SSO session name (Recommended)** | axeldev                              | Nombre interno del perfil SSO.                  |
| **SSO start URL**                  | https://9a676c4c12.awsapps.com/start | URL del portal SSO de tu organización.          |
| **SSO region**                     | us-east-2                            | Región donde está configurado el servicio SSO.  |
| **SSO registration scopes**        | (presiona Enter)                     | Mantén el valor por defecto.                    |
| **AWS account ID**                 | 422228620990                         | Cuenta a la que tienes acceso.                  |
| **Rol disponible**                 | AdministratorAccess                  | Rol asignado a tu usuario dentro de esa cuenta. |
| **Default client Region**          | us-east-2                            | Región predeterminada de trabajo.               |
| **CLI default output format**      | json                                 | Formato de salida recomendado.                  |
| **Profile name**                   | axeldev                              | Nombre con el que guardarás este perfil local.  |

## 6. Confirmación de entorno

Si completaste los pasos anteriores, ya tienes:

Git funcional y sincronizado con el repositorio remoto.

Terraform instalado y validado localmente.

AWS CLI autenticado por SSO con el perfil ingresado.

El proyecto abierto y accesible en VS Code.

---