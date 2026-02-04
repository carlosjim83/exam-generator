# 🔐 Configuración de OIDC para GitHub Actions

Esta guía te ayudará a configurar OpenID Connect (OIDC) para que GitHub Actions pueda deployar a Azure sin necesidad de almacenar credenciales secretas.

## 📋 Información de tu cuenta

Para obtener tu información:

```bash
# Subscription ID
az account show --query id -o tsv

# Tenant ID
az account show --query tenantId -o tsv

# Usuario actual
az account show --query user.name -o tsv
```

## 🎯 ¿Qué es OIDC?

OpenID Connect permite que GitHub Actions se autentique en Azure usando **tokens temporales** en lugar de contraseñas. Es más seguro y no requiere rotar secretos.

---

## 📝 Pasos de Configuración

### Paso 1: Crear App Registration en Azure AD

Ejecuta este comando para crear una aplicación en Azure AD:

```bash
az ad app create --display-name "exam-generator-github-oidc"
```

**Guarda el output**, especialmente el `appId` (lo necesitarás después).

### Paso 2: Obtener el App ID

Si ya creaste la app, obtén el ID con:

```bash
az ad app list --display-name "exam-generator-github-oidc" --query "[0].appId" -o tsv
```

Guarda este valor como `APP_ID`.

### Paso 3: Crear Service Principal

Crea un Service Principal asociado a la aplicación:

```bash
APP_ID="<TU_APP_ID_AQUI>"

az ad sp create --id $APP_ID
```

### Paso 4: Asignar permisos al Service Principal

Dale permisos de **Contributor** sobre tu Resource Group:

```bash
# Obtén tu Subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
RESOURCE_GROUP="exam-generator-rg"

az role assignment create \
  --role "Contributor" \
  --assignee $APP_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
```

### Paso 5: Configurar Federated Credentials para GitHub

Ahora configuramos la "confianza" entre GitHub y Azure.

**Para la rama `main`:**

```bash
APP_ID="<TU_APP_ID_AQUI>"
GITHUB_ORG_OR_USER="<TU_USUARIO_O_ORG_GITHUB>"  # Ejemplo: "carlosjimenezcj"
GITHUB_REPO="<NOMBRE_DEL_REPO>"                  # Ejemplo: "exam-generator"

az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG_OR_USER"'/'"$GITHUB_REPO"':ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"],
    "description": "GitHub Actions deployment from main branch"
  }'
```

**Para la rama `develop` (opcional):**

```bash
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-develop-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG_OR_USER"'/'"$GITHUB_REPO"':ref:refs/heads/develop",
    "audiences": ["api://AzureADTokenExchange"],
    "description": "GitHub Actions deployment from develop branch"
  }'
```

**Para Pull Requests (opcional):**

```bash
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-pull-requests",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG_OR_USER"'/'"$GITHUB_REPO"':pull_request",
    "audiences": ["api://AzureADTokenExchange"],
    "description": "GitHub Actions for pull requests"
  }'
```

### Paso 6: Verificar la configuración

```bash
# Verificar que el Service Principal existe
az ad sp show --id $APP_ID

# Verificar las Federated Credentials
az ad app federated-credential list --id $APP_ID

# Verificar los permisos
az role assignment list --assignee $APP_ID --output table
```

---

## 🔑 Secretos de GitHub

Ahora configura estos secretos en GitHub (**Settings → Secrets and variables → Actions**):

### 1. `AZURE_CLIENT_ID`

- **Valor**: El `APP_ID` que obtuviste en el Paso 2
- **Comando para obtenerlo**:
  ```bash
  az ad app list --display-name "exam-generator-github-oidc" --query "[0].appId" -o tsv
  ```

### 2. `AZURE_TENANT_ID`

- **Cómo obtenerlo**:
  ```bash
  az account show --query tenantId -o tsv
  ```

### 3. `AZURE_SUBSCRIPTION_ID`

- **Cómo obtenerlo**:
  ```bash
  az account show --query id -o tsv
  ```

### 4. Mantener estos secretos existentes:

- `ACR_USERNAME`
- `ACR_PASSWORD`
- `NEXT_PUBLIC_API_URL` (opcional)

---

## ✅ Checklist de Configuración

- [ ] App Registration creada
- [ ] Service Principal creado
- [ ] Permisos de Contributor asignados
- [ ] Federated Credentials configuradas para `main`
- [ ] Federated Credentials configuradas para `develop` (opcional)
- [ ] Federated Credentials configuradas para PRs (opcional)
- [ ] `AZURE_CLIENT_ID` configurado en GitHub
- [ ] `AZURE_TENANT_ID` configurado en GitHub
- [ ] `AZURE_SUBSCRIPTION_ID` configurado en GitHub
- [ ] Workflows actualizados para usar OIDC

---

## 🔧 Comandos Útiles

### Listar todas tus aplicaciones:

```bash
az ad app list --show-mine --query "[].{Name:displayName, AppId:appId}" -o table
```

### Ver detalles de la app:

```bash
az ad app show --id $APP_ID
```

### Eliminar Federated Credential (si necesitas recrearla):

```bash
az ad app federated-credential delete --id $APP_ID --federated-credential-id <credential-id>
```

### Eliminar la app (si algo sale mal):

```bash
az ad app delete --id $APP_ID
```

---

## 🆘 Troubleshooting

### Error: "Insufficient privileges to complete the operation"

- Tu cuenta de estudiante no tiene permisos para crear App Registrations
- **Solución**: Contacta al administrador de Azure de la URJC o usa la Opción 3 (CI sin CD)

### Error: "The subject claim does not match"

- El formato del `subject` en la Federated Credential es incorrecto
- **Solución**: Verifica que el formato sea: `repo:USERNAME/REPO:ref:refs/heads/BRANCH`

### Error: "No subscription found"

- El Service Principal no tiene permisos en la subscription
- **Solución**: Verifica los role assignments con `az role assignment list`

---

## 📚 Referencias

- [GitHub Actions - Azure Login with OIDC](https://github.com/Azure/login#configure-a-service-principal-with-a-federated-credential-to-use-oidc-based-authentication)
- [Microsoft Docs - Workload Identity Federation](https://learn.microsoft.com/en-us/azure/active-directory/develop/workload-identity-federation)
- [Configure OIDC with Azure](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)

---

## 🚀 Siguiente Paso

Una vez completados estos pasos, ejecuta:

```bash
# Desde el directorio del proyecto
git add .
git commit -m "Configure OIDC authentication for GitHub Actions"
```

Y los workflows estarán listos para usar OIDC! 🎉
