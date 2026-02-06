# 🏗️ Exam Generator - Infrastructure as Code (Terraform)

## 📋 Overview

This Terraform configuration manages ALL infrastructure for the Exam Generator application on Azure. It replaces manual deployments with versioned, reproducible Infrastructure as Code.

### **Current Setup**

This configuration maintains the **existing Azure infrastructure** until the Redis retirement date (September 2028):

- ✅ Azure Cache for Redis (Classic) - Basic C0 tier
- ✅ PostgreSQL Flexible Server 16 with pgvector
- ✅ Azure Container Apps (Backend + Frontend)
- ✅ Azure OpenAI with GPT-4o and text-embedding-3-small
- ✅ Azure Blob Storage for document uploads
- ✅ Azure Key Vault for secrets management
- ✅ Application Insights for monitoring

**Note**: Azure Cache for Redis is retiring September 30, 2028. See [ADR-0008](../docs/adr/0008-redis-migration.md) for migration options being evaluated.

---

## 🏛️ Architecture

```
exam-generator-rg (Resource Group - Sweden Central)
├── Key Vault (secrets management)
├── Container Registry (Docker images)
├── Storage Account (document uploads)
│   └── Container: documents
├── PostgreSQL Flexible Server (database + pgvector)
│   └── Database: exam_generator
├── Azure Cache for Redis (BullMQ queue) - Basic C0
├── Azure OpenAI (AI services)
│   ├── Deployment: gpt-4o
│   └── Deployment: text-embedding-3-small
├── Application Insights (monitoring)
├── Container Apps Environment
    ├── Backend Container App (Fastify + BullMQ worker)
    └── Frontend Container App (Next.js)
```

---

## 💰 Cost Estimate

### **Current Monthly Cost**

| Service                    | SKU/Tier                    | Estimated Cost    |
| -------------------------- | --------------------------- | ----------------- |
| PostgreSQL Flexible Server | B_Standard_B1ms (Burstable) | ~€15              |
| Azure Cache for Redis      | Basic C0 (250MB)            | ~€59              |
| Container Registry         | Basic                       | ~€5               |
| Storage Account            | Standard_LRS                | ~€1-2             |
| Container Apps             | Consumption (2 apps)        | ~€5-10            |
| Application Insights       | Pay-as-you-go               | ~€5               |
| Key Vault                  | Standard                    | ~€1               |
| Azure OpenAI               | Pay-per-use                 | Variable          |
| **TOTAL (excl. OpenAI)**   |                             | **~€91-98/month** |

**Note**: Redis C0 is expensive for its size. See ADR-0008 for cost optimization options (Upstash, self-hosted, etc.) that could reduce costs by €40-50/month.

---

## 📂 Project Structure

```
terraform/
├── main.tf                      # Main orchestration file
├── variables.tf                 # Variable definitions
├── outputs.tf                   # Output values (URLs, connection strings)
├── terraform.tfvars.example     # Template for configuration
├── terraform.tfvars             # Actual secrets (GITIGNORED - DO NOT COMMIT)
├── .terraform.lock.hcl          # Provider dependency lock
├── README.md                    # This file
└── modules/                     # Infrastructure modules
    ├── redis/                   # Azure Cache for Redis (classic)
    ├── postgres/                # PostgreSQL Flexible Server
    ├── storage/                 # Azure Storage Account
    ├── acr/                     # Azure Container Registry
    ├── keyvault/                # Azure Key Vault
    ├── openai/                  # Azure OpenAI
    ├── monitoring/              # Application Insights
    ├── container_apps_env/      # Container Apps Environment
    └── container_app/           # Individual Container App
```

---

## 🚀 Quick Start

### **Prerequisites**

1. **Azure CLI** installed and authenticated:

   ```bash
   az login
   az account show  # Verify correct subscription
   az account set --subscription "<your-subscription-id>"
   ```

2. **Terraform or OpenTofu** installed (v1.6+):

   ```bash
   # Option 1: Install Terraform
   brew install terraform

   # Option 2: Install OpenTofu (open source alternative)
   brew install opentofu

   # Verify
   terraform version  # or: tofu version
   ```

   **Note**: This project uses `tofu` (OpenTofu) due to Terraform's BUSL license change. They are 100% compatible.

3. **Required secrets** from current deployment:

   ```bash
   # Get current PostgreSQL password from Key Vault
   az keyvault secret show --vault-name exam-gen-kv-cj --name DATABASE-URL

   # Get OAuth credentials (if configured)
   az containerapp show --name exam-generator-backend --resource-group exam-generator-rg \
     --query 'properties.template.containers[0].env[?name==`GOOGLE_CLIENT_ID`]'
   ```

---

### **Step 1: Configure Variables**

1. Copy the example file:

   ```bash
   cd terraform/
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your actual values:

   ```hcl
   # Azure Subscription
   subscription_id = "your-subscription-id-here"

   # PostgreSQL Password (get from Key Vault or existing deployment)
   postgres_admin_password = "your-secure-postgres-password"

   # JWT Secrets (get from existing deployment or generate new)
   jwt_secret         = "your-jwt-secret-here"
   jwt_refresh_secret = "your-jwt-refresh-secret-here"

   # OAuth Credentials (optional)
   google_client_id     = "your-google-client-id.apps.googleusercontent.com"
   google_client_secret = "your-google-client-secret"

   # Redis configuration (non-HA for dev/test)
   redis_non_ha = true
   ```

   **⚠️ SECURITY**: NEVER commit `terraform.tfvars` to git (already in `.gitignore`)

---

### **Step 2: Initialize Terraform**

```bash
cd terraform/
tofu init
```

This will:

- Download required providers (azurerm ~3.100, random ~3.6)
- Initialize backend (local state by default)
- Validate configuration

**Output should show**:

```
OpenTofu has been successfully initialized!
```

---

### **Step 3: Review Infrastructure Plan**

```bash
tofu plan -out=tfplan
```

**⚠️ IMPORTANT**: Review the plan carefully. It will show:

- ✅ **Resources to CREATE**: New infrastructure from scratch
- ⚠️ **Resources to MODIFY**: Changes to existing resources
- ❌ **Resources to DESTROY**: Resources to be removed

**Example plan output**:

```
Plan: 15 to add, 0 to change, 0 to destroy.
```

**BEFORE APPLYING**:

1. ✅ Verify all resource names match existing deployment
2. ✅ Check that no critical resources are marked for DESTROY
3. ✅ Ensure PostgreSQL password is correct
4. ✅ Backup database if applying changes to existing infrastructure

---

### **Step 4: Apply Infrastructure**

```bash
tofu apply tfplan
```

This will:

1. Create resource group (if not exists)
2. Deploy all infrastructure modules
3. Configure networking and security
4. Set up monitoring
5. Deploy container apps

**Expected time**: 10-15 minutes

**Progress indicator**:

```
module.postgres.azurerm_postgresql_flexible_server.main: Creating...
module.redis.azurerm_redis_cache.main: Creating...
...
Apply complete! Resources: 15 added, 0 changed, 0 destroyed.
```

---

### **Step 5: Verify Deployment**

1. **View outputs**:

   ```bash
   tofu output
   ```

   **Key outputs**:
   - `backend_app_url` - Backend API URL
   - `frontend_app_url` - Frontend URL
   - `redis_hostname` - Redis cache hostname
   - `postgres_fqdn` - PostgreSQL server FQDN

2. **Test health endpoints**:

   ```bash
   # Backend health
   BACKEND_URL=$(tofu output -raw backend_app_url)
   curl $BACKEND_URL/health

   # Expected: {"status":"ok","timestamp":"..."}
   ```

3. **Check Redis connection**:

   ```bash
   # View backend logs
   az containerapp logs show \
     --name exam-generator-backend \
     --resource-group exam-generator-rg \
     --follow

   # Look for: "✅ Redis connected successfully"
   ```

4. **Test end-to-end**:
   - Open frontend URL in browser
   - Login with Google OAuth
   - Upload a test document
   - Verify it gets processed

---

## 🔄 Deployment Scenarios

### **Scenario A: Fresh Deployment (New Environment)**

Use this when deploying to a new Azure subscription or creating a separate environment (dev/staging).

```bash
# 1. Configure terraform.tfvars with new resource names
# 2. Initialize and apply
tofu init
tofu plan -out=tfplan
tofu apply tfplan

# 3. Deploy application code
# See ../docs/DEPLOYMENT.md for container deployment
```

### **Scenario B: Import Existing Infrastructure**

Use this to bring existing manually-created resources under Terraform management.

```bash
# Example: Import existing resource group
tofu import azurerm_resource_group.main /subscriptions/YOUR-SUB-ID/resourceGroups/exam-generator-rg

# Import other resources as needed
tofu import module.redis.azurerm_redis_cache.main /subscriptions/.../exam-generator-cache
tofu import module.postgres.azurerm_postgresql_flexible_server.main /subscriptions/.../exam-generator-db

# Verify state
tofu plan  # Should show "No changes" if imports match configuration
```

### **Scenario C: Update Existing Resources**

Use this to modify existing infrastructure.

```bash
# 1. Modify variables or modules
# 2. Plan to see what will change
tofu plan

# 3. Review carefully - some changes require recreation
# 4. Apply with auto-approve only if confident
tofu apply
```

### **Scenario D: Disaster Recovery**

If infrastructure is corrupted or deleted:

```bash
# 1. Restore terraform.tfvars from backup
# 2. Initialize Terraform
tofu init

# 3. Recreate everything
tofu apply -auto-approve

# 4. Restore database from backup
# 5. Redeploy application containers
```

---

## 📊 Monitoring & Troubleshooting

### **Check Terraform State**

```bash
# List all managed resources
tofu state list

# Show specific resource details
tofu state show module.redis.azurerm_redis_cache.main

# View full state (JSON)
tofu show -json | jq
```

### **Check Azure Resources**

```bash
# List all resources in resource group
az resource list --resource-group exam-generator-rg -o table

# Check specific resource
az redis show --name exam-generator-cache --resource-group exam-generator-rg
az postgres flexible-server show --name exam-generator-db --resource-group exam-generator-rg
```

### **Common Issues**

#### **Issue: "Resource already exists"**

**Symptom**:

```
Error: A resource with the ID ".../exam-generator-cache" already exists
```

**Solution**:

```bash
# Option 1: Import existing resource
tofu import module.redis.azurerm_redis_cache.main <resource-id>

# Option 2: Use different resource names in terraform.tfvars
```

#### **Issue: "PostgreSQL SKU validation error"**

**Symptom**:

```
Error: "sku_name" is not a valid sku name, got Standard_B1ms
```

**Solution**: The provider expects tier prefix format:

```hcl
# In terraform.tfvars or variables.tf
postgres_sku = "B_Standard_B1ms"  # NOT "Standard_B1ms"
```

#### **Issue: "Redis connection timeout"**

**Causes**:

- ❌ Firewall rules blocking connection
- ❌ Wrong TLS version
- ❌ Incorrect password/hostname

**Solution**:

```bash
# Check Redis connection from backend
az containerapp exec --name exam-generator-backend --resource-group exam-generator-rg \
  --command "redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --tls ping"

# Expected: PONG
```

#### **Issue: "Terraform state locked"**

**Symptom**:

```
Error: Error acquiring the state lock
```

**Solution**:

```bash
# If using local state and you're sure no other process is running:
tofu force-unlock <lock-id>

# If using remote state, check Azure Blob Storage lease
```

---

## 🔒 Security Best Practices

### **Secrets Management**

1. ✅ **NEVER commit `terraform.tfvars`** - Already in `.gitignore`
2. ✅ **Use Azure Key Vault** for sensitive values (configured in modules)
3. ✅ **Rotate secrets regularly**:

   ```bash
   # Rotate Redis keys
   az redis regenerate-key --name exam-generator-cache \
     --resource-group exam-generator-rg --key-type Primary

   # Update Container Apps with new key
   tofu apply -target=module.backend_app
   ```

### **Access Control**

- Use Azure RBAC to limit who can apply Terraform changes
- Require PR approval for infrastructure changes
- Enable audit logging in Azure Policy

### **Network Security**

```hcl
# TODO: Enable private endpoints for production
# Currently using public access for simplicity

# Future improvement in modules:
resource "azurerm_private_endpoint" "redis" {
  # ...
}
```

---

## 🗂️ State Management

### **Current: Local State**

Currently using local state file: `terraform.tfstate`

**⚠️ WARNING**:

- Local state is NOT safe for teams
- Risk of conflicts and data loss
- No locking mechanism

### **Recommended: Remote State (Azure Blob Storage)**

Migrate to remote state for production:

1. **Create storage for Terraform state**:

   ```bash
   # Run setup script
   ./scripts/setup-terraform-backend.sh
   ```

2. **Configure backend in `main.tf`** (uncomment):

   ```hcl
   terraform {
     backend "azurerm" {
       resource_group_name  = "exam-generator-tfstate-rg"
       storage_account_name = "examgentfstate"
       container_name       = "tfstate"
       key                  = "production.terraform.tfstate"
     }
   }
   ```

3. **Migrate state**:

   ```bash
   tofu init -migrate-state
   # Confirm migration when prompted
   ```

---

## 🎯 Terraform Best Practices

### **1. Always Plan Before Apply**

```bash
# GOOD
tofu plan -out=tfplan
tofu apply tfplan

# BAD
tofu apply -auto-approve  # Only use for scripts/CI
```

### **2. Use Modules for Reusability**

```hcl
# GOOD - Reusable module
module "redis" {
  source = "./modules/redis"
  name   = var.redis_name
}

# BAD - Inline resources everywhere
resource "azurerm_redis_cache" "cache1" { ... }
resource "azurerm_redis_cache" "cache2" { ... }
```

### **3. Version Control Everything**

```bash
# Commit to git
git add terraform/ .gitignore
git commit -m "feat(infra): add Terraform configuration"

# NEVER commit
terraform.tfvars       # Contains secrets
.terraform/            # Provider binaries
*.tfstate              # State files (use remote state)
```

### **4. Use Variables for Flexibility**

```hcl
# GOOD
variable "environment" {
  default = "production"
}

# BAD - Hardcoded values
resource "azurerm_resource_group" "main" {
  name = "exam-generator-rg-production"  # Hard to reuse
}
```

---

## 📝 Module Documentation

### **Redis Module** (`modules/redis/`)

Manages Azure Cache for Redis (classic).

**Inputs**:

- `name` - Redis cache name
- `sku_name` - SKU tier (Basic, Standard, Premium)
- `family` - SKU family (C for Basic/Standard, P for Premium)
- `capacity` - Cache size (0-6 for C family)

**Outputs**:

- `hostname` - Redis hostname
- `ssl_port` - TLS port (6380)
- `primary_access_key` - Primary access key (sensitive)

### **PostgreSQL Module** (`modules/postgres/`)

Manages Azure PostgreSQL Flexible Server.

**Inputs**:

- `name` - Server name
- `sku_name` - SKU (must include tier prefix: B*, GP*, MO\_)
- `postgres_version` - PostgreSQL version (default: 16)
- `storage_mb` - Storage size in MB

**Outputs**:

- `fqdn` - Fully qualified domain name
- `connection_string` - PostgreSQL connection string (sensitive)

### **Container App Module** (`modules/container_app/`)

Manages individual Container Apps.

**Inputs**:

- `name` - App name
- `container_image` - Docker image
- `env_vars` - Environment variables (supports secrets)
- `cpu` / `memory` - Resource limits
- `min_replicas` / `max_replicas` - Scaling config

**Outputs**:

- `fqdn` - App URL
- `url` - Full HTTPS URL

---

## 🚀 CI/CD Integration

### **GitHub Actions Example**

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths: ['terraform/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup OpenTofu
        uses: opentofu/setup-opentofu@v1

      - name: Terraform Init
        run: tofu init
        working-directory: terraform

      - name: Terraform Plan
        run: tofu plan
        working-directory: terraform
        env:
          ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
```

---

## 📚 Additional Resources

### **Azure Documentation**

- [Azure Cache for Redis](https://learn.microsoft.com/azure/azure-cache-for-redis/)
- [PostgreSQL Flexible Server](https://learn.microsoft.com/azure/postgresql/flexible-server/)
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)

### **Terraform Documentation**

- [Terraform AzureRM Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [OpenTofu Documentation](https://opentofu.org/docs/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

### **Project Documentation**

- [Architecture Decision Records](../docs/adr/)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)

---

## 🆘 Need Help?

1. **Check Terraform docs**: `tofu --help`
2. **Check Azure CLI**: `az --help`
3. **Review plan output carefully** before applying
4. **Ask before destroying resources** in production
5. **Backup database** before major infrastructure changes

---

## 🎓 Learning Resources

This Terraform configuration demonstrates:

- ✅ Multi-module infrastructure
- ✅ Variable management and secrets handling
- ✅ Azure provider usage
- ✅ Output values for service integration
- ✅ Resource dependencies and ordering
- ✅ Infrastructure versioning with git

---

**Made with 🔥 by an Architect who believes infrastructure should be code, not artisanal crafts.**
