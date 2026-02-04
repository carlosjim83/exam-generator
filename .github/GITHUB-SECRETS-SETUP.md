# ⚡ Quick Start: GitHub Secrets Setup

Esta es una guía rápida para configurar los secretos necesarios en GitHub.

## 🎯 Objetivo

Configurar las credenciales del Azure Container Registry para que GitHub Actions pueda subir las imágenes Docker.

## 📝 Pasos

### 1. Obtener las credenciales del ACR

Ejecuta estos comandos en tu terminal:

```bash
# Username
az acr credential show --name examgeneratorcj --query username -o tsv

# Password
az acr credential show --name examgeneratorcj --query "passwords[0].value" -o tsv
```

**Guarda estos valores**, los necesitarás en el siguiente paso.

###2. Configurar secretos en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (⚙️)
3. En el menú lateral, click en **Secrets and variables → Actions**
4. Click en **New repository secret**

#### Secreto 1: `ACR_USERNAME`

- **Name**: `ACR_USERNAME`
- **Secret**: `examgeneratorcj` (el username que obtuviste arriba)
- Click **Add secret**

#### Secreto 2: `ACR_PASSWORD`

- **Name**: `ACR_PASSWORD`
- **Secret**: (el password que obtuviste arriba - algo como `AAHqHtHove...`)
- Click **Add secret**

#### Secreto 3 (Opcional): `NEXT_PUBLIC_API_URL`

Solo si quieres override la URL del backend:

- **Name**: `NEXT_PUBLIC_API_URL`
- **Secret**: `https://exam-generator-backend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io`
- Click **Add secret**

### 3. Verificar

En **Settings → Secrets and variables → Actions** deberías ver:

```
✅ ACR_USERNAME
✅ ACR_PASSWORD
⚠️ NEXT_PUBLIC_API_URL (opcional)
```

## 🎉 ¡Listo!

Ahora GitHub Actions puede construir y subir imágenes al ACR automáticamente.

### Probar el flujo

1. Haz un cambio en el código
2. Commit y push:
   ```bash
   git add .
   git commit -m "Test CI workflow"
   git push origin main
   ```
3. Ve a **Actions** en GitHub
4. Deberías ver el workflow ejecutándose ✅

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**:

- Nunca compartas tus credenciales públicamente
- No hagas commit de archivos con secretos
- Los valores de ACR_PASSWORD, SUBSCRIPTION_ID y TENANT_ID son sensibles
- Guárdalos en un lugar seguro (password manager)

---

## 📚 Próximos Pasos

Una vez configurados los secretos:

1. **Push código** → GitHub Actions construye y sube imagen automáticamente
2. **Cuando estés listo** → Ejecuta `./scripts/deploy.sh` para deployar
3. **¡Listo!** 🎉

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa de deployment.
