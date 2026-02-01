#!/bin/bash

# ================================
# Azure Infrastructure Setup - Continuation
# ================================
# Continues from step 3 (Key Vault) onwards
# ACR and Resource Group already created

set -e  # Exit on error

# ================================
# Configuration
# ================================
RESOURCE_GROUP="exam-generator-rg"
LOCATION="swedencentral"  # Changed from westeurope
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Container Apps
CONTAINER_APP_ENV="exam-generator-env"
BACKEND_APP_NAME="exam-generator-backend"
FRONTEND_APP_NAME="exam-generator-frontend"

# Container Registry (already exists)
ACR_NAME="examgeneratorcj"

# Database
POSTGRES_SERVER_NAME="exam-generator-db"
POSTGRES_ADMIN_USER="examgenadmin"
POSTGRES_DB_NAME="exam_generator"

# Redis
REDIS_NAME="exam-generator-cache"

# Storage
STORAGE_ACCOUNT_NAME="examgenstoragecj"  # Added suffix to ensure uniqueness

# Key Vault
KEYVAULT_NAME="exam-gen-kv-cj"  # Shortened and added suffix

# Application Insights
APPINSIGHTS_NAME="exam-generator-insights"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================
# Helper Functions
# ================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ================================
# Check Prerequisites
# ================================
log_info "Checking prerequisites..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Please install: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Run: az login"
    exit 1
fi

log_info "Prerequisites check passed ✓"

# ================================
# Get ACR Credentials (already exists)
# ================================
log_info "Retrieving ACR credentials..."
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query passwords[0].value -o tsv)
log_info "ACR credentials retrieved ✓"

# ================================
# 3. Create Key Vault
# ================================
log_info "Creating Azure Key Vault: $KEYVAULT_NAME"

az keyvault create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$KEYVAULT_NAME" \
    --location "$LOCATION" \
    --enable-rbac-authorization false \
    --tags Environment=Production Project=ExamGenerator

# Store ACR credentials
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "ACR-USERNAME" --value "$ACR_USERNAME"
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "ACR-PASSWORD" --value "$ACR_PASSWORD"

log_info "Key Vault created ✓"

# ================================
# 4. Create PostgreSQL Database
# ================================
log_info "Creating Azure Database for PostgreSQL: $POSTGRES_SERVER_NAME"
log_warn "This may take 5-10 minutes..."

# Generate random password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER_NAME" \
    --location "$LOCATION" \
    --admin-user "$POSTGRES_ADMIN_USER" \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 16 \
    --public-access 0.0.0.0 \
    --yes

# Create database
az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$POSTGRES_SERVER_NAME" \
    --database-name "$POSTGRES_DB_NAME"

# Enable pgvector extension
log_info "Enabling pgvector extension..."
az postgres flexible-server parameter set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$POSTGRES_SERVER_NAME" \
    --name azure.extensions \
    --value "VECTOR,PGCRYPTO"

# Store credentials in Key Vault
DATABASE_URL="postgresql://${POSTGRES_ADMIN_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER_NAME}.postgres.database.azure.com:5432/${POSTGRES_DB_NAME}?sslmode=require"
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "DATABASE-URL" --value "$DATABASE_URL"

log_info "PostgreSQL Database created ✓"

# ================================
# 5. Create Redis Cache
# ================================
log_info "Creating Azure Cache for Redis: $REDIS_NAME"
log_warn "This may take 10-15 minutes..."

az redis create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REDIS_NAME" \
    --location "$LOCATION" \
    --sku Basic \
    --vm-size c0 \
    --enable-non-ssl-port false

# Get Redis credentials
REDIS_KEY=$(az redis list-keys --resource-group "$RESOURCE_GROUP" --name "$REDIS_NAME" --query primaryKey -o tsv)
REDIS_HOST="${REDIS_NAME}.redis.cache.windows.net"

# Store in Key Vault
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "REDIS-HOST" --value "$REDIS_HOST"
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "REDIS-PASSWORD" --value "$REDIS_KEY"

log_info "Redis Cache created ✓"

# ================================
# 6. Create Storage Account
# ================================
log_info "Creating Storage Account: $STORAGE_ACCOUNT_NAME"

az storage account create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$STORAGE_ACCOUNT_NAME" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot \
    --https-only true \
    --min-tls-version TLS1_2 \
    --allow-blob-public-access false

# Get storage key
STORAGE_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT_NAME" --query [0].value -o tsv)

# Create container
az storage container create \
    --name "documents" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_KEY" \
    --public-access off

# Store in Key Vault
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "STORAGE-ACCOUNT-NAME" --value "$STORAGE_ACCOUNT_NAME"
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "STORAGE-ACCOUNT-KEY" --value "$STORAGE_KEY"

log_info "Storage Account created ✓"

# ================================
# 7. Create Application Insights
# ================================
log_info "Creating Application Insights: $APPINSIGHTS_NAME"

az monitor app-insights component create \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APPINSIGHTS_NAME" \
    --location "$LOCATION" \
    --kind web \
    --application-type web

# Get connection string
APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APPINSIGHTS_NAME" \
    --query connectionString -o tsv)

APPINSIGHTS_INSTRUMENTATION_KEY=$(az monitor app-insights component show \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APPINSIGHTS_NAME" \
    --query instrumentationKey -o tsv)

# Store in Key Vault
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "APPINSIGHTS-CONNECTION-STRING" --value "$APPINSIGHTS_CONNECTION_STRING"

log_info "Application Insights created ✓"

# ================================
# 8. Create Container Apps Environment
# ================================
log_info "Creating Container Apps Environment: $CONTAINER_APP_ENV"

az containerapp env create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CONTAINER_APP_ENV" \
    --location "$LOCATION" \
    --logs-destination azure-monitor \
    --instrumentation-key "$APPINSIGHTS_INSTRUMENTATION_KEY"

log_info "Container Apps Environment created ✓"

# ================================
# 9. Create Backend Container App
# ================================
log_info "Creating Backend Container App: $BACKEND_APP_NAME"

az containerapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$BACKEND_APP_NAME" \
    --environment "$CONTAINER_APP_ENV" \
    --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
    --target-port 3001 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 10 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --registry-server "${ACR_NAME}.azurecr.io" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD"

BACKEND_URL="https://$(az containerapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"

log_info "Backend Container App created ✓"
log_info "Backend URL: $BACKEND_URL"

# ================================
# 10. Create Frontend Container App
# ================================
log_info "Creating Frontend Container App: $FRONTEND_APP_NAME"

az containerapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FRONTEND_APP_NAME" \
    --environment "$CONTAINER_APP_ENV" \
    --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
    --target-port 3000 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 10 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --registry-server "${ACR_NAME}.azurecr.io" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD"

FRONTEND_URL="https://$(az containerapp show --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"

log_info "Frontend Container App created ✓"
log_info "Frontend URL: $FRONTEND_URL"

# ================================
# Summary
# ================================
echo ""
echo "================================"
echo "🎉 Infrastructure Setup Complete!"
echo "================================"
echo ""
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Location: $LOCATION"
echo ""
log_info "📦 Container Registry: ${ACR_NAME}.azurecr.io"
log_info "🗄️  PostgreSQL: ${POSTGRES_SERVER_NAME}.postgres.database.azure.com"
log_info "🔴 Redis: ${REDIS_HOST}"
log_info "💾 Storage: ${STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
log_info "🔐 Key Vault: ${KEYVAULT_NAME}.vault.azure.net"
log_info "📊 App Insights: $APPINSIGHTS_NAME"
echo ""
log_info "🚀 Backend URL: $BACKEND_URL"
log_info "🌐 Frontend URL: $FRONTEND_URL"
echo ""
log_warn "⚠️  Next Steps:"
echo "  1. Add GitHub Secrets (see docs/DEPLOYMENT.md)"
echo "  2. Configure environment variables: ./infrastructure/azure/configure-env.sh"
echo "  3. Push code to trigger GitHub Actions deployment"
echo "  4. Database migrations will run automatically on first deploy"
echo ""
log_info "💾 Saving configuration to .env.azure..."

# Save configuration for reference
cat > .env.azure << EOF
# Azure Infrastructure Configuration
# Generated: $(date)

RESOURCE_GROUP=$RESOURCE_GROUP
LOCATION=$LOCATION

ACR_NAME=$ACR_NAME
ACR_USERNAME=$ACR_USERNAME
BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL

POSTGRES_SERVER_NAME=$POSTGRES_SERVER_NAME
POSTGRES_ADMIN_USER=$POSTGRES_ADMIN_USER
POSTGRES_DB_NAME=$POSTGRES_DB_NAME

REDIS_NAME=$REDIS_NAME
REDIS_HOST=$REDIS_HOST

STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME
KEYVAULT_NAME=$KEYVAULT_NAME
APPINSIGHTS_NAME=$APPINSIGHTS_NAME

# Secrets stored in Azure Key Vault: $KEYVAULT_NAME
# - ACR-USERNAME
# - ACR-PASSWORD
# - DATABASE-URL
# - REDIS-HOST
# - REDIS-PASSWORD
# - STORAGE-ACCOUNT-NAME
# - STORAGE-ACCOUNT-KEY
# - APPINSIGHTS-CONNECTION-STRING
EOF

log_info "Configuration saved to .env.azure ✓"
echo ""
