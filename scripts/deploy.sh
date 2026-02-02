#!/bin/bash

# ================================
# Full Stack Deployment Script
# ================================
# Deploys both backend and frontend to Azure Container Apps

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${CYAN}========================================"
echo -e "  🚀 Full Stack Deployment"
echo -e "========================================${NC}"
echo ""

# Parse arguments
BACKEND_TAG="${1:-latest}"
FRONTEND_TAG="${2:-latest}"

echo -e "${BLUE}📦 Deployment Configuration:${NC}"
echo -e "  ${YELLOW}Backend Tag:${NC} $BACKEND_TAG"
echo -e "  ${YELLOW}Frontend Tag:${NC} $FRONTEND_TAG"
echo ""

# Ask for confirmation
echo -e "${YELLOW}This will deploy both backend and frontend to production.${NC}"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi
echo ""

# Deploy Backend
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Step 1/2: Deploying Backend${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if "$SCRIPT_DIR/deploy-backend.sh" "$BACKEND_TAG"; then
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
    BACKEND_SUCCESS=true
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    BACKEND_SUCCESS=false
fi
echo ""

# Wait a bit between deployments
echo -e "${BLUE}⏳ Waiting 5 seconds before deploying frontend...${NC}"
sleep 5
echo ""

# Deploy Frontend
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Step 2/2: Deploying Frontend${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if "$SCRIPT_DIR/deploy-frontend.sh" "$FRONTEND_TAG"; then
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
    FRONTEND_SUCCESS=true
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    FRONTEND_SUCCESS=false
fi
echo ""

# Final Summary
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  📊 Deployment Summary${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$BACKEND_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ Backend:${NC} Deployed successfully (tag: $BACKEND_TAG)"
else
    echo -e "${RED}❌ Backend:${NC} Deployment failed"
fi

if [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ Frontend:${NC} Deployed successfully (tag: $FRONTEND_TAG)"
else
    echo -e "${RED}❌ Frontend:${NC} Deployment failed"
fi

echo ""

if [ "$BACKEND_SUCCESS" = true ] && [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  🎉 Full Stack Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 Your application is live:${NC}"
    echo -e "  ${YELLOW}Frontend:${NC} https://exam-generator-frontend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io"
    echo -e "  ${YELLOW}Backend:${NC} https://exam-generator-backend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ⚠️  Partial Deployment${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Some services failed to deploy.${NC}"
    echo -e "${YELLOW}Please check the logs above for details.${NC}"
    exit 1
fi
