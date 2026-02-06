#!/bin/bash

# ================================
# Frontend Deployment Script
# ================================
# Deploys the latest frontend image from GHCR to Azure Container Apps

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
GITHUB_USERNAME="carlosjim83"
IMAGE_NAME="exam-generator-frontend"
CONTAINER_APP_NAME="exam-generator-frontend"
RESOURCE_GROUP="exam-generator-rg-v2"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Frontend Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    echo "Please install it: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo -e "${BLUE}🔐 Checking Azure authentication...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure${NC}"
    echo -e "${BLUE}Logging in...${NC}"
    az login
fi

ACCOUNT=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Logged in as: $ACCOUNT${NC}"
echo ""

# Get image tag (default to latest)
IMAGE_TAG="${1:-latest}"
FULL_IMAGE="${REGISTRY}/${GITHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}📦 Image to deploy: ${YELLOW}${FULL_IMAGE}${NC}"
echo ""

# Note: We skip image verification for GHCR since it requires authentication
echo -e "${BLUE}🔍 Skipping image verification (GHCR requires auth)...${NC}"
echo -e "${GREEN}✅ Proceeding with deployment${NC}"
echo ""

# Get current revision for potential rollback
echo -e "${BLUE}📋 Getting current active revision...${NC}"
CURRENT_REVISION=$(az containerapp revision list \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "[?properties.active].name | [0]" -o tsv)

if [ -n "$CURRENT_REVISION" ]; then
    echo -e "${GREEN}Current revision: ${CURRENT_REVISION}${NC}"
else
    echo -e "${YELLOW}⚠️  No active revision found (first deployment?)${NC}"
fi
echo ""

# Deploy to Container App
echo -e "${BLUE}🚀 Deploying to Azure Container Apps...${NC}"
echo -e "${YELLOW}Container App: ${CONTAINER_APP_NAME}${NC}"
echo -e "${YELLOW}Resource Group: ${RESOURCE_GROUP}${NC}"
echo ""

az containerapp update \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $FULL_IMAGE \
    --output none

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment command successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Wait a bit for the app to start
echo -e "${BLUE}⏳ Waiting for app to start (15 seconds)...${NC}"
sleep 15

# Get app URL
APP_URL=$(az containerapp show \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn -o tsv)

# Health check
echo -e "${BLUE}🏥 Performing health check...${NC}"
echo -e "${YELLOW}URL: https://$APP_URL${NC}"
echo ""

HEALTH_CHECK_PASSED=false
for i in {1..10}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$APP_URL 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "304" ]; then
        echo -e "${GREEN}✅ Health check passed! (attempt $i/10)${NC}"
        HEALTH_CHECK_PASSED=true
        break
    else
        echo -e "${YELLOW}⏳ Attempt $i/10: Health check returned $STATUS. Retrying in 5s...${NC}"
        sleep 5
    fi
done

echo ""

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ Deployment Successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📊 Deployment Summary:${NC}"
    echo -e "  ${YELLOW}Image:${NC} $FULL_IMAGE"
    echo -e "  ${YELLOW}Container App:${NC} $CONTAINER_APP_NAME"
    echo -e "  ${YELLOW}URL:${NC} https://$APP_URL"
    echo ""
    echo -e "${GREEN}🌐 Frontend is live at: ${BLUE}https://$APP_URL${NC}"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ❌ Health Check Failed${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}The deployment completed but the health check failed.${NC}"
    echo -e "${YELLOW}This could mean:${NC}"
    echo -e "  - The app is still starting up (wait a bit longer)"
    echo -e "  - There's an error in the application"
    echo -e "  - Environment variables are not configured correctly"
    echo ""
    
    if [ -n "$CURRENT_REVISION" ]; then
        echo -e "${YELLOW}Would you like to rollback to the previous revision?${NC}"
        echo -e "${BLUE}Previous revision: ${CURRENT_REVISION}${NC}"
        echo ""
        read -p "Rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🔄 Rolling back to previous revision...${NC}"
            az containerapp revision activate \
                --name $CONTAINER_APP_NAME \
                --resource-group $RESOURCE_GROUP \
                --revision $CURRENT_REVISION
            echo -e "${GREEN}✅ Rolled back to: ${CURRENT_REVISION}${NC}"
        else
            echo -e "${YELLOW}⚠️  No rollback performed${NC}"
        fi
    fi
    
    echo ""
    echo -e "${BLUE}📝 Check logs with:${NC}"
    echo -e "  ${YELLOW}az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow${NC}"
    
    exit 1
fi
