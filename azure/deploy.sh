#!/bin/bash

# Azure Deployment Script for OJTmeter Application
# This script deploys the entire infrastructure to Azure

set -e

# Default values
RESOURCE_GROUP_NAME="ojtmeter-rg"
LOCATION="East US"
APP_SERVICE_NAME="ojtmeter-app-prod"
COSMOS_DB_ACCOUNT_NAME="ojtmeter-cosmosdb-prod"
STORAGE_ACCOUNT_NAME="ojtmeterstorageprod"
APP_SERVICE_PLAN_NAME="ojtmeter-plan-prod"
JWT_SECRET="CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-IN-PRODUCTION"
SKIP_BUILD=false
SKIP_DEPLOY=false

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -g, --resource-group    Resource group name (default: $RESOURCE_GROUP_NAME)"
    echo "  -l, --location         Azure location (default: $LOCATION)"
    echo "  -a, --app-service      App Service name (default: $APP_SERVICE_NAME)"
    echo "  -c, --cosmos-db        Cosmos DB account name (default: $COSMOS_DB_ACCOUNT_NAME)"
    echo "  -s, --storage          Storage account name (default: $STORAGE_ACCOUNT_NAME)"
    echo "  -p, --plan             App Service plan name (default: $APP_SERVICE_PLAN_NAME)"
    echo "  -j, --jwt-secret       JWT secret (default: auto-generated)"
    echo "  --skip-build           Skip building the application"
    echo "  --skip-deploy          Skip deploying to App Service"
    echo "  -h, --help             Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP_NAME="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -a|--app-service)
            APP_SERVICE_NAME="$2"
            shift 2
            ;;
        -c|--cosmos-db)
            COSMOS_DB_ACCOUNT_NAME="$2"
            shift 2
            ;;
        -s|--storage)
            STORAGE_ACCOUNT_NAME="$2"
            shift 2
            ;;
        -p|--plan)
            APP_SERVICE_PLAN_NAME="$2"
            shift 2
            ;;
        -j|--jwt-secret)
            JWT_SECRET="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option $1"
            usage
            ;;
    esac
done

echo "🚀 Starting Azure Deployment for OJTmeter Application"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Location: $LOCATION"
echo "App Service: $APP_SERVICE_NAME"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check Azure CLI version
AZ_VERSION=$(az version --output json | jq -r '."azure-cli"')
echo "✅ Azure CLI version $AZ_VERSION detected"

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login'"
    exit 1
fi

ACCOUNT=$(az account show --output json | jq -r '.user.name')
echo "✅ Logged in as: $ACCOUNT"

# Create resource group if it doesn't exist
echo "📦 Creating resource group..."
if az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "⚠️ Resource group already exists"
else
    az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION" --output none
    echo "✅ Resource group created successfully"
fi

# Generate secure JWT secret if not provided
if [ "$JWT_SECRET" = "CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-IN-PRODUCTION" ]; then
    JWT_SECRET=$(openssl rand -base64 48)
    echo "🔐 Generated secure JWT secret"
fi

# Deploy Azure resources
echo "🏗️ Deploying Azure resources..."
DEPLOYMENT_RESULT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --template-file "azure/azuredeploy.json" \
    --parameters @azure/azuredeploy.parameters.json \
    --parameters appServiceName="$APP_SERVICE_NAME" \
    --parameters resourceGroupName="$RESOURCE_GROUP_NAME" \
    --parameters location="$LOCATION" \
    --parameters cosmosDbAccountName="$COSMOS_DB_ACCOUNT_NAME" \
    --parameters storageAccountName="$STORAGE_ACCOUNT_NAME" \
    --parameters appServicePlanName="$APP_SERVICE_PLAN_NAME" \
    --parameters jwtSecret="$JWT_SECRET" \
    --output json)

echo "✅ Azure resources deployed successfully"

# Extract outputs
APP_SERVICE_URL=$(echo "$DEPLOYMENT_RESULT" | jq -r '.properties.outputs.appServiceUrl.value')
COSMOS_DB_ENDPOINT=$(echo "$DEPLOYMENT_RESULT" | jq -r '.properties.outputs.cosmosDbEndpoint.value')

echo "App Service URL: $APP_SERVICE_URL"
echo "Cosmos DB Endpoint: $COSMOS_DB_ENDPOINT"

# Build application if not skipped
if [ "$SKIP_BUILD" = false ]; then
    echo "🔨 Building application..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js v18 or higher"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION detected"
    
    # Install dependencies and build
    echo "📦 Installing dependencies..."
    npm run install:all
    
    echo "🔨 Building frontend..."
    npm run build:frontend
    
    echo "🔨 Building backend..."
    npm run build:backend
    
    echo "✅ Application built successfully"
fi

# Deploy to App Service if not skipped
if [ "$SKIP_DEPLOY" = false ]; then
    echo "🚀 Deploying to Azure App Service..."
    
    # Copy frontend build to backend public directory
    echo "📁 Preparing deployment package..."
    if [ -d "backend/dist/public" ]; then
        rm -rf "backend/dist/public"
    fi
    cp -r "frontend/dist" "backend/dist/public"
    
    # Create deployment package
    cd backend/dist
    zip -r "../dist.zip" .
    cd ../..
    
    # Deploy using Azure CLI
    az webapp deployment source config-zip \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$APP_SERVICE_NAME" \
        --src "backend/dist.zip" \
        --output none
    
    echo "✅ Application deployed successfully"
    
    # Health check
    echo "🏥 Performing health check..."
    APP_URL="https://$APP_SERVICE_NAME.azurewebsites.net/health"
    
    # Wait a bit for the app to start
    echo "⏳ Waiting for application to start..."
    sleep 30
    
    if curl -f -s "$APP_URL" > /dev/null; then
        echo "✅ Application is healthy!"
        echo "🌐 Application URL: https://$APP_SERVICE_NAME.azurewebsites.net"
    else
        echo "❌ Health check failed"
        echo "⚠️ Application might still be starting up. Please check manually."
    fi
fi

echo "🎉 Deployment completed!"
echo "📋 Summary:"
echo "  - Resource Group: $RESOURCE_GROUP_NAME"
echo "  - App Service: $APP_SERVICE_NAME"
echo "  - Cosmos DB: $COSMOS_DB_ACCOUNT_NAME"
echo "  - Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  - Application URL: https://$APP_SERVICE_NAME.azurewebsites.net"

echo "📖 Next steps:"
echo "  1. Configure your domain (optional)"
echo "  2. Set up monitoring and alerts"
echo "  3. Configure backup policies"
echo "  4. Test all application features"
