# 🚀 Guía de Despliegue a Producción

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Pre-requisitos](#pre-requisitos)
3. [Configuración Inicial](#configuración-inicial)
4. [Despliegue Automático](#despliegue-automático)
5. [Configuración Manual](#configuración-manual)
6. [Verificación](#verificación)
7. [Troubleshooting](#troubleshooting)
8. [Rollback](#rollback)

---

## 🏗️ Arquitectura

### Infraestructura en Azure

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Front Door                      │
│              (CDN + WAF + Load Balancer)                 │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│   Frontend   │  │    Backend    │
│ Container App│  │ Container App │
│  (Next.js)   │  │  (Fastify)    │
└───────┬──────┘  └──────┬────────┘
        │                │
        └────────┬───────┘
                 │
        ┌────────┴────────────────────────────┐
        │                                     │
┌───────▼─────────┐  ┌──────────────┐  ┌────▼─────┐
│  PostgreSQL     │  │ Redis Cache  │  │  Blob    │
│  (pgvector)     │  │  (BullMQ)    │  │ Storage  │
└─────────────────┘  └──────────────┘  └──────────┘
        │
┌───────▼─────────────────────────────────────────────┐
│           Azure Monitor + App Insights              │
│        (Logging, Metrics, Alerts, APM)              │
└─────────────────────────────────────────────────────┘
```

### Componentes Principales

| Servicio                          | Tipo                  | Propósito                           |
| --------------------------------- | --------------------- | ----------------------------------- |
| **Azure Container Apps**          | Serverless Containers | Backend + Frontend con auto-scaling |
| **Azure Container Registry**      | Private Registry      | Almacenamiento de imágenes Docker   |
| **Azure Database for PostgreSQL** | Managed Database      | Base de datos con pgvector          |
| **Azure Cache for Redis**         | Managed Cache         | Job queues (BullMQ)                 |
| **Azure Blob Storage**            | Object Storage        | Documentos subidos por usuarios     |
| **Azure Key Vault**               | Secrets Manager       | API keys, connection strings        |
| **Azure Application Insights**    | APM                   | Monitoring, logging, performance    |
| **GitHub Actions**                | CI/CD                 | Automated deployments               |

---

## 📦 Pre-requisitos

### Herramientas Necesarias

```bash
# 1. Azure CLI
az --version  # Debe ser >= 2.50.0

# 2. Docker
docker --version  # Para testing local

# 3. Git
git --version

# 4. Node.js + pnpm
node --version  # v20+
pnpm --version  # v8+
```

### Cuentas Requeridas

- ✅ **Azure Subscription** (Azure for Students válido)
- ✅ **GitHub Account** con acceso al repositorio
- ✅ **Azure OpenAI Access** (ya configurado)

---

## ⚙️ Configuración Inicial

### 1. Login en Azure

```bash
# Login
az login

# Verificar subscription
az account show

# Si tienes múltiples subscriptions, selecciona la correcta
az account set --subscription "Azure for Students"
```

### 2. Crear Infraestructura Azure

**Opción A: Script Automático (Recomendado)**

```bash
# Navegar al directorio del proyecto
cd /path/to/exam-generator

# Ejecutar script de setup
./infrastructure/azure/setup.sh
```

Este script creará:

- ✅ Resource Group
- ✅ Container Registry (ACR)
- ✅ Key Vault
- ✅ PostgreSQL Database con pgvector
- ✅ Redis Cache
- ✅ Blob Storage
- ✅ Application Insights
- ✅ Container Apps Environment
- ✅ Backend Container App
- ✅ Frontend Container App

**Tiempo estimado:** 15-20 minutos

**Opción B: Manual (ver `docs/AZURE_MANUAL_SETUP.md`)**

### 3. Configurar GitHub Secrets

Ve a tu repositorio en GitHub: **Settings → Secrets and variables → Actions**

Agrega los siguientes secrets:

#### Secrets de Azure

```bash
# AZURE_CREDENTIALS (Service Principal)
az ad sp create-for-rbac \
  --name "exam-generator-github" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/exam-generator-rg \
  --sdk-auth
```

Copia todo el JSON output y agrégalo como secret `AZURE_CREDENTIALS`

#### Secrets de Container Registry

```bash
# ACR_USERNAME
az keyvault secret show --vault-name exam-generator-kv --name ACR-USERNAME --query value -o tsv

# ACR_PASSWORD
az keyvault secret show --vault-name exam-generator-kv --name ACR-PASSWORD --query value -o tsv
```

#### Secrets de Aplicación

```bash
# JWT_SECRET (generar nuevo)
openssl rand -base64 32

# NEXT_PUBLIC_API_URL
https://exam-generator-backend.delightfulforest-a488ef6b.swedencentral.azurecontainerapps.io
```

**Lista completa de secrets necesarios:**

| Secret                | Descripción                 | Ejemplo                                                                                        |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `AZURE_CREDENTIALS`   | Service Principal JSON      | `{"clientId":"...","clientSecret":"..."}`                                                      |
| `ACR_USERNAME`        | Container Registry username | `examgenacr`                                                                                   |
| `ACR_PASSWORD`        | Container Registry password | `****`                                                                                         |
| `JWT_SECRET`          | Secret para JWT tokens      | `****` (32+ caracteres)                                                                        |
| `NEXT_PUBLIC_API_URL` | Backend URL                 | `https://exam-generator-backend.delightfulforest-a488ef6b.swedencentral.azurecontainerapps.io` |

### 4. Configurar Variables de Entorno en Azure

```bash
# Ejecutar script de configuración
./infrastructure/azure/configure-env.sh
```

### 5. Agregar Secrets Manualmente en Azure Portal

Algunos secrets deben agregarse manualmente por seguridad:

```bash
# 1. Ir a Azure Portal
# 2. Buscar "exam-generator-backend" Container App
# 3. Settings → Environment variables
# 4. Agregar estos secrets:

JWT_SECRET=<tu-secret-generado>
AZURE_OPENAI_API_KEY=<tu-api-key>
AZURE_OPENAI_ENDPOINT=<tu-endpoint>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

---

## 🚀 Despliegue Automático

### Primera Vez

1. **Push al repositorio:**

```bash
git add .
git commit -m "feat: add production deployment infrastructure"
git push origin main
```

2. **GitHub Actions se ejecuta automáticamente:**
   - ✅ Build y test del código
   - ✅ Build de imágenes Docker
   - ✅ Push a Azure Container Registry
   - ✅ Deploy a Azure Container Apps
   - ✅ Run database migrations
   - ✅ Health check verification

3. **Monitorear el progreso:**

Ve a GitHub: **Actions** tab

### Despliegues Subsecuentes

Cualquier push a `main` dispara despliegue automático:

```bash
git push origin main
```

### Despliegue Manual

Si necesitas hacer deploy sin push:

```bash
# Ir a GitHub → Actions → Workflow → Run workflow
```

O desde CLI:

```bash
gh workflow run backend-cicd.yml
gh workflow run frontend-cicd.yml
```

---

## 🔧 Configuración Manual

### Habilitar CORS

```bash
az containerapp ingress cors update \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --allowed-origins "https://exam-generator-frontend.delightfulforest-a488ef6b.swedencentral.azurecontainerapps.io" \
  --allowed-methods GET POST PUT DELETE OPTIONS \
  --allowed-headers "*" \
  --max-age 3600
```

### Configurar Custom Domain

```bash
# 1. Agregar dominio custom
az containerapp hostname add \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --hostname www.tudominio.com

# 2. Configurar SSL (automático con managed certificate)
az containerapp hostname bind \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --hostname www.tudominio.com \
  --environment exam-generator-env
```

### Escalar Manualmente

```bash
# Escalar backend
az containerapp update \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --min-replicas 2 \
  --max-replicas 20

# Escalar frontend
az containerapp update \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --min-replicas 2 \
  --max-replicas 20
```

---

## ✅ Verificación

### Health Checks

```bash
# Backend
curl https://exam-generator-backend.delightfulforest-a488ef6b.swedencentral.azurecontainerapps.io/health

# Frontend
curl https://exam-generator-frontend.delightfulforest-a488ef6b.swedencentral.azurecontainerapps.io/api/health
```

### Logs en Tiempo Real

```bash
# Backend logs
az containerapp logs show \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --follow

# Frontend logs
az containerapp logs show \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --follow
```

### Application Insights

```bash
# Abrir en portal
az monitor app-insights component show \
  --resource-group exam-generator-rg \
  --app exam-generator-insights \
  --query "appId" -o tsv
```

Luego ir a: https://portal.azure.com → Application Insights → exam-generator-insights

---

## 🐛 Troubleshooting

### Container App no inicia

```bash
# Ver logs detallados
az containerapp logs show \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --tail 100

# Ver revisiones
az containerapp revision list \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  -o table
```

### Error de conexión a PostgreSQL

```bash
# Verificar firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group exam-generator-rg \
  --name exam-generator-db

# Agregar IP si necesario
az postgres flexible-server firewall-rule create \
  --resource-group exam-generator-rg \
  --name exam-generator-db \
  --rule-name AllowContainerApps \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

### Error de Redis

```bash
# Verificar Redis está running
az redis show \
  --name exam-generator-cache \
  --resource-group exam-generator-rg \
  --query "provisioningState"

# Regenerar keys si necesario
az redis regenerate-keys \
  --name exam-generator-cache \
  --resource-group exam-generator-rg \
  --key-type Primary
```

---

## 🔄 Rollback

### Rollback a Revisión Anterior

```bash
# Listar revisiones
az containerapp revision list \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  -o table

# Activar revisión anterior
az containerapp revision activate \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --revision <revision-name>
```

### Rollback Completo

```bash
# Re-deploy imagen anterior desde GitHub
gh workflow run backend-cicd.yml --ref <commit-sha>
```

---

## 📊 Monitoreo y Alertas

### Configurar Alertas

```bash
# Alert en caso de errores 5xx
az monitor metrics alert create \
  --name "Backend-5xx-Alert" \
  --resource-group exam-generator-rg \
  --scopes /subscriptions/<sub-id>/resourceGroups/exam-generator-rg/providers/Microsoft.App/containerApps/exam-generator-backend \
  --condition "count HttpResponseTime > 500" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group <action-group-id>
```

---

## 💰 Costos Estimados

| Servicio             | SKU               | Costo Mensual (USD) |
| -------------------- | ----------------- | ------------------- |
| Container Apps (2x)  | 0.5 vCPU, 1GB RAM | ~$20-40             |
| PostgreSQL Flexible  | Standard_B2s      | ~$30                |
| Redis Cache          | Basic C0          | ~$16                |
| Blob Storage         | LRS Hot           | ~$5                 |
| Container Registry   | Basic             | ~$5                 |
| Application Insights | Pay-as-you-go     | ~$10-20             |
| **Total Estimado**   |                   | **~$86-126/mes**    |

**Nota:** Con Azure for Students tienes $100/mes de crédito gratis.

---

## 📚 Recursos Adicionales

- [Azure Container Apps Docs](https://learn.microsoft.com/en-us/azure/container-apps/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Fastify Production Best Practices](https://www.fastify.io/docs/latest/Guides/Getting-Started/#running-in-production)

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa logs en Application Insights
2. Consulta [Troubleshooting](#troubleshooting)
3. Abre un issue en GitHub
4. Contacta al equipo de desarrollo

---

**¡Despliegue completado exitosamente! 🎉**
