#!/bin/bash

# ================================
# Configure GHCR Credentials in Azure Container Apps
# ================================
# Sets up GitHub Container Registry credentials for Azure Container Apps
# to pull private images

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
RESOURCE_GROUP="exam-generator-rg-v2"
BACKEND_APP_NAME="exam-generator-backend"
FRONTEND_APP_NAME="exam-generator-frontend"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Configure GHCR Credentials${NC}"
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

# Prompt for GitHub Personal Access Token
echo -e "${BLUE}📝 GitHub Personal Access Token Required${NC}"
echo ""
echo -e "${YELLOW}You need a GitHub PAT with 'read:packages' permission.${NC}"
echo -e "${YELLOW}Create one here: ${BLUE}https://github.com/settings/tokens/new${NC}"
echo ""
echo -e "${YELLOW}Required scopes:${NC}"
echo -e "  ✅ read:packages"
echo ""
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Token cannot be empty${NC}"
    exit 1
fi

# Validate token format
if [[ ! "$GITHUB_TOKEN" =~ ^(ghp_|github_pat_)[a-zA-Z0-9]{36,255}$ ]]; then
    echo -e "${YELLOW}⚠️  Token format looks unusual. Are you sure it's correct?${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${BLUE}🔧 Configuring GHCR credentials for backend...${NC}"
az containerapp registry set \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --server $REGISTRY \
    --username $GITHUB_USERNAME \
    --password "$GITHUB_TOKEN" \
    --output none

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend credentials configured${NC}"
else
    echo -e "${RED}❌ Failed to configure backend credentials${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}🔧 Configuring GHCR credentials for frontend...${NC}"
az containerapp registry set \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --server $REGISTRY \
    --username $GITHUB_USERNAME \
    --password "$GITHUB_TOKEN" \
    --output none

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend credentials configured${NC}"
else
    echo -e "${RED}❌ Failed to configure frontend credentials${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Deploy backend:  ${YELLOW}./scripts/deploy-backend.sh${NC}"
echo -e "  2. Deploy frontend: ${YELLOW}./scripts/deploy-frontend.sh${NC}"
echo ""
echo -e "${YELLOW}Note: The token is stored securely in Azure and will be used${NC}"
echo -e "${YELLOW}to pull images from GHCR automatically.${NC}"
