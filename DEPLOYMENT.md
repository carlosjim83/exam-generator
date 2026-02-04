# 🚀 Deployment Guide

Este proyecto utiliza un flujo de **CI/CD Híbrido** optimizado para cuentas de Azure for Students.

## 📋 Resumen del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes code to GitHub                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (Automated CI)                              │
│  ✅ Build & Test                                            │
│  ✅ Build Docker Image                                      │
│  ✅ Push to Azure Container Registry                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Manual Deploy (When ready)                                 │
│  🚀 Run deploy script                                       │
│  🔄 Update Container Apps                                   │
│  🏥 Health Check                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Trabajo

### 1. **Desarrollo y Push** 💻

Trabajas normalmente en tu código y haces push a GitHub:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

### 2. **CI Automático** ⚙️ (GitHub Actions)

Automáticamente, GitHub Actions:

- ✅ Ejecuta tests
- ✅ Hace linting y type checking
- ✅ Construye la imagen Docker
- ✅ La sube al Azure Container Registry

**No hace deploy todavía** - la imagen queda lista en el registry.

### 3. **Deploy Manual** 🚀 (Cuando quieras)

Cuando estés listo para deployar, ejecuta:

```bash
# Deploy solo backend
./scripts/deploy-backend.sh

# Deploy solo frontend
./scripts/deploy-frontend.sh

# Deploy todo (backend + frontend)
./scripts/deploy.sh
```

---

## 📦 Scripts de Deploy

### `deploy-backend.sh`

Despliega el backend a Azure Container Apps.

**Uso básico:**

```bash
./scripts/deploy-backend.sh
```

**Deploy un tag específico:**

```bash
./scripts/deploy-backend.sh v1.2.3
```

**Características:**

- ✅ Verifica que la imagen exista en ACR
- ✅ Guarda la revisión actual para rollback
- ✅ Ejecuta migraciones de base de datos
- ✅ Hace health check automático
- ✅ Ofrece rollback si falla

---

### `deploy-frontend.sh`

Despliega el frontend a Azure Container Apps.

**Uso básico:**

```bash
./scripts/deploy-frontend.sh
```

**Deploy un tag específico:**

```bash
./scripts/deploy-frontend.sh v1.2.3
```

**Características:**

- ✅ Verifica que la imagen exista en ACR
- ✅ Guarda la revisión actual para rollback
- ✅ Hace health check automático
- ✅ Ofrece rollback si falla

---

### `deploy.sh`

Despliega **backend y frontend** juntos.

**Uso básico:**

```bash
./scripts/deploy.sh
```

**Deploy tags específicos:**

```bash
./scripts/deploy.sh <backend-tag> <frontend-tag>
# Ejemplo: ./scripts/deploy.sh v1.2.0 v2.3.0
```

**Flujo:**

1. Deploy backend
2. Espera 5 segundos
3. Deploy frontend
4. Muestra resumen final

---

## 🏷️ Tags de Imágenes

GitHub Actions crea automáticamente estos tags:

| Tag              | Cuándo se crea        | Ejemplo                               |
| ---------------- | --------------------- | ------------------------------------- |
| `latest`         | Push a `main`         | `exam-generator-backend:latest`       |
| `<branch>`       | Push a cualquier rama | `exam-generator-backend:develop`      |
| `<branch>-<sha>` | Cada commit           | `exam-generator-backend:main-a1b2c3d` |

**Ejemplo de uso:**

```bash
# Deploy la última versión de main
./scripts/deploy-backend.sh latest

# Deploy una versión específica por commit
./scripts/deploy-backend.sh main-a1b2c3d

# Deploy desde develop
./scripts/deploy-backend.sh develop
```

---

## ✅ Requisitos Previos

### 1. Azure CLI instalado

```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 2. Autenticado en Azure

```bash
az login
```

### 3. Secretos configurados en GitHub

Ve a **GitHub Repository → Settings → Secrets and variables → Actions**

Configura estos secretos:

| Secreto               | Valor                               | Cómo obtenerlo                                                                      |
| --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `ACR_USERNAME`        | `examgeneratorcj`                   | `az acr credential show --name examgeneratorcj --query username -o tsv`             |
| `ACR_PASSWORD`        | `***`                               | `az acr credential show --name examgeneratorcj --query "passwords[0].value" -o tsv` |
| `NEXT_PUBLIC_API_URL` | `https://exam-generator-backend...` | (Opcional) URL del backend                                                          |

---

## 🎯 Workflow Típico

### Escenario 1: Feature nueva

```bash
# 1. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y hacer commits
git add .
git commit -m "Add nueva funcionalidad"

# 3. Push a GitHub
git push origin feature/nueva-funcionalidad

# ✅ GitHub Actions construye y testea automáticamente

# 4. Crear Pull Request en GitHub
# 5. Revisar y mergear a main

# 6. Cuando esté merged, deploy a producción
git checkout main
git pull
./scripts/deploy.sh  # Deploy todo
```

### Escenario 2: Hotfix urgente

```bash
# 1. Fix el problema
git add .
git commit -m "Fix critical bug"

# 2. Push a main
git push origin main

# ✅ GitHub Actions construye la imagen automáticamente

# 3. Deploy inmediato
./scripts/deploy-backend.sh  # o ./scripts/deploy-frontend.sh
```

### Escenario 3: Rollback

```bash
# Ver tags disponibles
az acr repository show-tags \
  --name examgeneratorcj \
  --repository exam-generator-backend \
  --orderby time_desc \
  --output table

# Deploy una versión anterior
./scripts/deploy-backend.sh main-abc123d
```

---

## 🔍 Verificación del Deploy

### Ver logs en tiempo real

```bash
# Backend
az containerapp logs show \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --follow

# Frontend
az containerapp logs show \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --follow
```

### Ver revisiones activas

```bash
# Backend
az containerapp revision list \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --query "[?properties.active].{Name:name, Created:properties.createdTime, Traffic:properties.trafficWeight}" \
  --output table

# Frontend
az containerapp revision list \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --query "[?properties.active].{Name:name, Created:properties.createdTime, Traffic:properties.trafficWeight}" \
  --output table
```

### Health check manual

```bash
# Backend
curl https://exam-generator-backend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io/health

# Frontend
curl https://exam-generator-frontend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io
```

---

## 🆘 Troubleshooting

### El script dice "Image not found"

**Problema:** La imagen no existe en el ACR con ese tag.

**Solución:**

```bash
# Ver tags disponibles
az acr repository show-tags \
  --name examgeneratorcj \
  --repository exam-generator-backend \
  --orderby time_desc \
  --output table

# Usar un tag que exista
./scripts/deploy-backend.sh <tag-que-existe>
```

### Health check falla

**Problema:** La aplicación no responde después del deploy.

**Posibles causas:**

1. Variables de entorno mal configuradas
2. Error en el código
3. Base de datos no accesible

**Solución:**

```bash
# Ver logs
az containerapp logs show \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --follow

# Verificar variables de entorno
az containerapp show \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --query properties.template.containers[0].env
```

### GitHub Actions falla en "Build and push"

**Problema:** No puede subir la imagen al ACR.

**Solución:**

1. Verifica que los secretos `ACR_USERNAME` y `ACR_PASSWORD` estén configurados
2. Verifica que sean correctos:
   ```bash
   az acr credential show --name examgeneratorcj
   ```

---

## 📚 Referencias

- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)

---

## 💡 Tips & Best Practices

### 1. **Siempre revisar el CI antes de deployar**

```bash
# Ver el status del último workflow en GitHub Actions
# Asegúrate de que todo esté verde ✅ antes de deployar
```

### 2. **Usar tags descriptivos para releases importantes**

```bash
git tag -a v1.0.0 -m "First production release"
git push origin v1.0.0
```

### 3. **Mantener un changelog**

Documenta qué cambios incluye cada deploy para facilitar rollbacks.

### 4. **Deploy backend primero, frontend después**

Si hay cambios en la API, despliega backend primero para evitar incompatibilidades.

### 5. **Monitorear después del deploy**

Mantén abiertos los logs durante al menos 5 minutos después del deploy:

```bash
./scripts/deploy-backend.sh && \
  az containerapp logs show \
    --name exam-generator-backend \
    --resource-group exam-generator-rg \
    --follow
```

---

¿Necesitas ayuda? Revisa los logs o contacta al equipo. 🚀
