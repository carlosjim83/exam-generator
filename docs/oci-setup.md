# Guía de Despliegue en Oracle Cloud (OCI)

Esta guía explica paso a paso cómo desplegar el Exam Generator en Oracle Cloud Infrastructure usando OpenTofu/Terraform.

## Arquitectura

- **1 VM Ampere ARM** (2 OCPUs, 12GB RAM) - Free Tier
- **Docker Compose** con: PostgreSQL + Redis + Ollama + Backend + Frontend + Nginx
- **Ollama** para IA local (sin APIs externas): Llama 3.2 + nomic-embed-text
- **Object Storage** para documentos
- **Container Registry** para imágenes Docker

## Requisitos Previos

1. Cuenta de Oracle Cloud (regístrate en [cloud.oracle.com](https://cloud.oracle.com))
2. OpenTofu instalado localmente (`brew install opentofu`)
3. Clave SSH (`~/.ssh/id_rsa.pub`)

## Paso 1: Configurar Credenciales de OCI

### 1.1 Crear API Key en OCI Console

1. Ve a Oracle Cloud Console → Perfil (arriba derecha) → Usuario → "API Keys"
2. Click "Add API Key" → "Generate API Key Pair"
3. Descarga la clave privada (`oci_api_key.pem`) y guárdala en `~/.oci/`
4. Guarda la clave pública también
5. Copia el fingerprint que se muestra

### 1.2 Obtener OCIDs

Necesitas estos valores para `terraform.tfvars`:

```bash
# Tenancy OCID: Menú (hamburguesa) → Administración → Detalles de tenencia
# User OCID: Perfil → Usuario → Copiar OCID
# Compartment OCID: Menú → Identidad y seguridad → Compartments → Copiar OCID
```

### 1.3 Configurar el archivo de variables

Crea `terraform/oci/terraform.tfvars`:

```hcl
tenancy_ocid       = "ocid1.tenancy.oc1..xxxxxxxxxx"
user_ocid          = "ocid1.user.oc1..xxxxxxxxxx"
fingerprint        = "xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx"
private_key_path   = "~/.oci/oci_api_key.pem"
region             = "eu-madrid-1"  # Madrid (mejor latencia desde España)

# Instance config
instance_ocpus         = 2    # Máx 4 en Free Tier
instance_memory_in_gbs = 12   # Máx 24 en Free Tier
ssh_public_key_path    = "~/.ssh/id_rsa.pub"

# Secrets
db_password            = "tu-password-segura-para-postgres"
jwt_secret             = "tu-jwt-secret-muy-largo-y-aleatorio"
jwt_refresh_secret     = "otro-secret-para-refresh-tokens"
google_client_id       = "xxx.apps.googleusercontent.com"
google_client_secret   = "GOCSPX-xxxx"

# Ollama (AI local, sin APIs externas)
ollama_model           = "llama3.2"
ollama_embedding_model = "nomic-embed-text"
```

## Paso 2: Desplegar con OpenTofu

```bash
# Ir al directorio de OpenTofu
cd terraform/oci

# Inicializar OpenTofu
tofu init

# Ver el plan (qué va a crear)
tofu plan

# Aplicar (crear la infraestructura)
tofu apply

# Guarda la IP pública que te da como output
```

## Paso 3: Construir y Push Imágenes Docker

```bash
# Login al Container Registry de OCI
# Obtén el namespace:
tofu output bucket_namespace

# Login (usa tu email de OCI como usuario, y el Auth Token de tu perfil)
docker login eu-frankfurt-1.ocir.io -u <tenancy-namespace>/<email>
# Password: Auth Token (generarlo en Perfil → Auth Tokens)

# Construir imágenes
export REGISTRY="eu-frankfurt-1.ocir.io/$(tofu output -raw bucket_namespace)"

docker build -t $REGISTRY/exam-generator-backend:latest -f backend/Dockerfile backend/
docker build -t $REGISTRY/exam-generator-frontend:latest -f frontend/Dockerfile frontend/

# Push al registry
docker push $REGISTRY/exam-generator-backend:latest
docker push $REGISTRY/exam-generator-frontend:latest
```

## Paso 4: Configurar la VM

### 4.1 Conectar por SSH

```bash
ssh -i ~/.ssh/id_rsa opc@<IP_PUBLICA_DE_LA_VM>
```

### 4.2 Configurar el archivo .env

En la VM:

```bash
cd /home/opc/app
sudo nano .env
```

Pega este contenido (usa los valores de tu terraform.tfvars):

```bash
# Database
POSTGRES_USER=examgen
POSTGRES_PASSWORD=tu-password-segura
POSTGRES_DB=exam_generator
REDIS_PASSWORD=misma-password-que-postgres

# Object Storage
OCI_NAMESPACE=tu-namespace
OCI_BUCKET_NAME=exam-generator-documents
OCI_REGION=eu-frankfurt-1

# Ollama (AI local)
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
USE_LOCAL_AI=true

# Auth
JWT_SECRET=tu-jwt-secret
JWT_REFRESH_SECRET=tu-refresh-secret

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://<IP_PUBLICA>/api/auth/google/callback
FRONTEND_URL=http://<IP_PUBLICA>
NEXT_PUBLIC_API_URL=http://<IP_PUBLICA>/api

# Registry
REGISTRY_URL=eu-frankfurt-1.ocir.io/tu-namespace
BACKEND_IMAGE_NAME=exam-generator-backend
FRONTEND_IMAGE_NAME=exam-generator-frontend
IMAGE_TAG=latest
```

### 4.3 Actualizar el docker-compose.yml en la VM

Copia el archivo `docker-compose.prod.yml` del repo:

```bash
# Desde tu máquina local
scp -i ~/.ssh/id_rsa docker-compose.prod.yml opc@<IP_PUBLICA>:/home/opc/app/docker-compose.yml

# También el nginx.conf
scp -i ~/.ssh/id_rsa nginx.conf opc@<IP_PUBLICA>:/home/opc/app/nginx.conf
```

## Paso 5: Iniciar la Aplicación

En la VM:

```bash
cd /home/opc/app
sudo docker-compose up -d

# Ver logs
sudo docker-compose logs -f

# Verificar que todo está corriendo
sudo docker-compose ps
```

## Paso 6: Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → OAuth 2.0 Client IDs
3. Edita tu cliente OAuth
4. Agrega el callback URL: `http://<IP_PUBLICA>/api/auth/google/callback`
5. Guarda cambios

## Paso 7: Configurar Dominio (Opcional)

Para usar tu propio dominio:

1. Crea un registro A en tu DNS apuntando a la IP pública
2. Instala certbot para HTTPS:

```bash
# En la VM
sudo dnf install -y certbot
sudo certbot certonly --standalone -d tu-dominio.com

# Actualizar nginx.conf para usar SSL
echo "
server {
    listen 443 ssl;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # ... resto de config
}
" | sudo tee /home/opc/app/nginx-ssl.conf

# Reiniciar
sudo docker-compose restart nginx
```

## Comandos Útiles

```bash
# Ver logs de un servicio específico
sudo docker-compose logs -f backend

# Reiniciar un servicio
sudo docker-compose restart backend

# Ejecutar comandos en un contenedor
sudo docker-compose exec backend sh

# Ver espacio en disco
df -h

# Ver uso de recursos
top
```

## Solución de Problemas

### La VM no arranca

- Verifica que tienes capacidad disponible en Free Tier (4 OCPUs, 24GB RAM)
- Prueba con menos recursos en `instance_ocpus` y `instance_memory_in_gbs`

### Docker login falla

- Asegúrate de usar el Auth Token (no tu password de OCI)
- El formato es: `tenancy-namespace/email`

### PostgreSQL no inicia

- Verifica el volume: `sudo docker volume ls`
- Borra y recrea: `sudo docker-compose down -v && sudo docker-compose up -d`

### Backend no conecta a la BD

- Verifica DATABASE_URL en `.env`
- Asegúrate de usar el nombre de servicio `postgres`, no localhost

### Costos

**Esta configuración es 100% gratuita mientras uses el Free Tier.** Si Oracle intenta cobrarte, verifica que:

- Estás usando `VM.Standard.A1.Flex` (ARM Ampere)
- No excedes 4 OCPUs ni 24GB RAM
- El storage es menor a 200GB

### Ollama tarda en responder

- La primera vez que usas un modelo, Ollama lo carga en memoria (puede tardar 10-30 segundos)
- Los modelos ocupan RAM:
  - llama3.2: ~4.5GB
  - nomic-embed-text: ~300MB
- Si la VM se queda sin RAM, los modelos se descargan de memoria y se recargan lentamente

## Recursos

- [Oracle Cloud Free Tier FAQ](https://www.oracle.com/cloud/free/faq.html)
- [OCI OpenTofu Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Llama 3.2 Model](https://ollama.com/library/llama3.2)
- [nomic-embed-text Model](https://ollama.com/library/nomic-embed-text)
