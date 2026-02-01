#!/bin/bash

# ================================
# Configure Environment Variables
# ================================
# Sets environment variables for Container Apps from Key Vault

set -e

# Configuration
RESOURCE_GROUP="exam-generator-rg"
KEYVAULT_NAME="exam-generator-kv"
BACKEND_APP_NAME="exam-generator-backend"
FRONTEND_APP_NAME="exam-generator-frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# ================================
# Retrieve Secrets from Key Vault
# ================================
log_info "Retrieving secrets from Key Vault..."

DATABASE_URL=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "DATABASE-URL" --query value -o tsv)
REDIS_HOST=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "REDIS-HOST" --query value -o tsv)
REDIS_PASSWORD=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "REDIS-PASSWORD" --query value -o tsv)
STORAGE_ACCOUNT_NAME=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "STORAGE-ACCOUNT-NAME" --query value -o tsv)
STORAGE_ACCOUNT_KEY=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "STORAGE-ACCOUNT-KEY" --query value -o tsv)
APPINSIGHTS_CONNECTION_STRING=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "APPINSIGHTS-CONNECTION-STRING" --query value -o tsv)

# Get URLs
BACKEND_URL="https://$(az containerapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"
FRONTEND_URL="https://$(az containerapp show --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"

log_info "Secrets retrieved ✓"

# ================================
# Configure Backend Environment Variables
# ================================
log_info "Configuring Backend environment variables..."

az containerapp update \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars \
        "NODE_ENV=production" \
        "PORT=3001" \
        "DATABASE_URL=secretref:database-url" \
        "REDIS_HOST=secretref:redis-host" \
        "REDIS_PORT=6380" \
        "REDIS_PASSWORD=secretref:redis-password" \
        "REDIS_TLS=true" \
        "FRONTEND_URL=$FRONTEND_URL" \
        "AZURE_STORAGE_ACCOUNT_NAME=secretref:storage-account-name" \
        "AZURE_STORAGE_ACCOUNT_KEY=secretref:storage-account-key" \
        "AZURE_STORAGE_CONTAINER_NAME=documents" \
        "APPLICATIONINSIGHTS_CONNECTION_STRING=secretref:appinsights-connection-string" \
    --secrets \
        "database-url=$DATABASE_URL" \
        "redis-host=$REDIS_HOST" \
        "redis-password=$REDIS_PASSWORD" \
        "storage-account-name=$STORAGE_ACCOUNT_NAME" \
        "storage-account-key=$STORAGE_ACCOUNT_KEY" \
        "appinsights-connection-string=$APPINSIGHTS_CONNECTION_STRING"

log_info "Backend configured ✓"

# ================================
# Configure Frontend Environment Variables
# ================================
log_info "Configuring Frontend environment variables..."

az containerapp update \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars \
        "NODE_ENV=production" \
        "NEXT_PUBLIC_API_URL=$BACKEND_URL"

log_info "Frontend configured ✓"

# ================================
# Summary
# ================================
echo ""
echo "✅ Environment variables configured successfully!"
echo ""
log_info "Backend URL: $BACKEND_URL"
log_info "Frontend URL: $FRONTEND_URL"
echo ""
log_warn "⚠️  Don't forget to set these secrets manually in Azure Portal:"
echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
echo "  - AZURE_OPENAI_API_KEY"
echo "  - AZURE_OPENAI_ENDPOINT"
echo "  - AZURE_OPENAI_DEPLOYMENT_NAME"
echo "  - AZURE_OPENAI_EMBEDDING_DEPLOYMENT"
echo ""
