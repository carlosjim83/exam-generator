#!/bin/bash

# ================================
# Backend Deployment Script
# ================================
# Deploys the latest backend image from ACR to Azure Container Apps

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="examgeneratorcj.azurecr.io"
IMAGE_NAME="exam-generator-backend"
CONTAINER_APP_NAME="exam-generator-backend"
RESOURCE_GROUP="exam-generator-rg"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backend Deployment Script${NC}"
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
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}📦 Image to deploy: ${YELLOW}${FULL_IMAGE}${NC}"
echo ""

# Verify image exists in ACR
echo -e "${BLUE}🔍 Verifying image exists in ACR...${NC}"
if ! az acr repository show --name examgeneratorcj --repository $IMAGE_NAME --query "name" -o tsv &> /dev/null; then
    echo -e "${RED}❌ Repository ${IMAGE_NAME} not found in ACR${NC}"
    exit 1
fi

# Check if the specific tag exists
if ! az acr repository show-tags --name examgeneratorcj --repository $IMAGE_NAME --query "[?@=='${IMAGE_TAG}']" -o tsv | grep -q "${IMAGE_TAG}"; then
    echo -e "${RED}❌ Tag ${IMAGE_TAG} not found in repository${NC}"
    echo -e "${YELLOW}Available tags:${NC}"
    az acr repository show-tags --name examgeneratorcj --repository $IMAGE_NAME --orderby time_desc --output table | head -10
    exit 1
fi

echo -e "${GREEN}✅ Image found in ACR${NC}"
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

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
if az containerapp exec \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --command "cd backend && pnpm prisma migrate deploy" &> /dev/null; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Migration command failed or not available${NC}"
    echo -e "${YELLOW}You may need to run migrations manually${NC}"
fi
echo ""

# Wait a bit for the app to start
echo -e "${BLUE}⏳ Waiting for app to start (10 seconds)...${NC}"
sleep 10

# Get app URL
APP_URL=$(az containerapp show \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn -o tsv)

# Health check
echo -e "${BLUE}🏥 Performing health check...${NC}"
echo -e "${YELLOW}URL: https://$APP_URL/health${NC}"
echo ""

HEALTH_CHECK_PASSED=false
for i in {1..10}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$APP_URL/health 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
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
    echo -e "${GREEN}🌐 Backend is live at: ${BLUE}https://$APP_URL${NC}"
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
