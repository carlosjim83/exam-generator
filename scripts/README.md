# 🛠️ Deployment Scripts

Este directorio contiene scripts para facilitar el deployment de la aplicación a Azure Container Apps.

## 📜 Scripts Disponibles

### 🚀 `deploy.sh` - Full Stack Deploy

Despliega backend y frontend juntos.

```bash
./scripts/deploy.sh [backend-tag] [frontend-tag]
```

**Ejemplos:**

```bash
# Deploy latest de ambos
./scripts/deploy.sh

# Deploy tags específicos
./scripts/deploy.sh v1.2.0 v1.3.0

# Deploy main branch
./scripts/deploy.sh main main
```

---

### 🐳 `deploy-backend.sh` - Backend Only

Despliega solo el backend.

```bash
./scripts/deploy-backend.sh [tag]
```

**Ejemplos:**

```bash
# Deploy latest
./scripts/deploy-backend.sh

# Deploy tag específico
./scripts/deploy-backend.sh v1.2.0

# Deploy desde commit específico
./scripts/deploy-backend.sh main-abc123d
```

**Características:**

- ✅ Verifica imagen en ACR
- ✅ Guarda revisión actual
- ✅ Ejecuta migraciones
- ✅ Health check
- ✅ Rollback automático si falla

---

### 🎨 `deploy-frontend.sh` - Frontend Only

Despliega solo el frontend.

```bash
./scripts/deploy-frontend.sh [tag]
```

**Ejemplos:**

```bash
# Deploy latest
./scripts/deploy-frontend.sh

# Deploy tag específico
./scripts/deploy-frontend.sh v1.3.0
```

**Características:**

- ✅ Verifica imagen en ACR
- ✅ Guarda revisión actual
- ✅ Health check
- ✅ Rollback automático si falla

---

## 📋 Requisitos

- Azure CLI instalado y configurado
- Autenticado en Azure (`az login`)
- Las imágenes Docker deben estar en ACR

## 💡 Tips

### Ver tags disponibles

```bash
# Backend
az acr repository show-tags \
  --name examgeneratorcj \
  --repository exam-generator-backend \
  --orderby time_desc \
  --output table

# Frontend
az acr repository show-tags \
  --name examgeneratorcj \
  --repository exam-generator-frontend \
  --orderby time_desc \
  --output table
```

### Monitorear logs después del deploy

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

---

## 📚 Documentación Completa

Ver [DEPLOYMENT.md](../DEPLOYMENT.md) para la guía completa de deployment.
