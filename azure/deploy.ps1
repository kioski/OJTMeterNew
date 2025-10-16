# Azure Deployment Script for OJTmeter Application
# This script deploys the entire infrastructure to Azure

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "ojtmeter-rg",
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServiceName = "ojtmeter-app-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$CosmosDbAccountName = "ojtmeter-cosmosdb-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountName = "ojtmeterstorageprod",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanName = "ojtmeter-plan-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$JwtSecret = "CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-IN-PRODUCTION",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDeploy = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Azure Deployment for OJTmeter Application" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "App Service: $AppServiceName" -ForegroundColor Yellow

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI version $($azVersion.'azure-cli') detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Check if user is logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login'" -ForegroundColor Red
    exit 1
}

# Create resource group if it doesn't exist
Write-Host "📦 Creating resource group..." -ForegroundColor Blue
try {
    az group create --name $ResourceGroupName --location $Location --output none
    Write-Host "✅ Resource group created successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Resource group might already exist" -ForegroundColor Yellow
}

# Generate secure JWT secret if not provided
if ($JwtSecret -eq "CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-IN-PRODUCTION") {
    $JwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
    Write-Host "🔐 Generated secure JWT secret" -ForegroundColor Green
}

# Deploy Azure resources
Write-Host "🏗️ Deploying Azure resources..." -ForegroundColor Blue
try {
    $deploymentResult = az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file "azure/azuredeploy.json" `
        --parameters @azure/azuredeploy.parameters.json `
        --parameters appServiceName=$AppServiceName `
        --parameters resourceGroupName=$ResourceGroupName `
        --parameters location=$Location `
        --parameters cosmosDbAccountName=$CosmosDbAccountName `
        --parameters storageAccountName=$StorageAccountName `
        --parameters appServicePlanName=$AppServicePlanName `
        --parameters jwtSecret=$JwtSecret `
        --output json | ConvertFrom-Json
    
    Write-Host "✅ Azure resources deployed successfully" -ForegroundColor Green
    Write-Host "App Service URL: $($deploymentResult.properties.outputs.appServiceUrl.value)" -ForegroundColor Cyan
    Write-Host "Cosmos DB Endpoint: $($deploymentResult.properties.outputs.cosmosDbEndpoint.value)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to deploy Azure resources: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Build application if not skipped
if (-not $SkipBuild) {
    Write-Host "🔨 Building application..." -ForegroundColor Blue
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js is not installed. Please install Node.js v18 or higher" -ForegroundColor Red
        exit 1
    }
    
    # Install dependencies and build
    try {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
        npm run install:all
        
        Write-Host "🔨 Building frontend..." -ForegroundColor Blue
        npm run build:frontend
        
        Write-Host "🔨 Building backend..." -ForegroundColor Blue
        npm run build:backend
        
        Write-Host "✅ Application built successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Deploy to App Service if not skipped
if (-not $SkipDeploy) {
    Write-Host "🚀 Deploying to Azure App Service..." -ForegroundColor Blue
    
    # Copy frontend build to backend public directory
    Write-Host "📁 Preparing deployment package..." -ForegroundColor Blue
    if (Test-Path "backend/dist/public") {
        Remove-Item "backend/dist/public" -Recurse -Force
    }
    Copy-Item "frontend/dist" "backend/dist/public" -Recurse
    
    # Deploy using Azure CLI
    try {
        az webapp deployment source config-zip `
            --resource-group $ResourceGroupName `
            --name $AppServiceName `
            --src "backend/dist.zip" `
            --output none
        
        Write-Host "✅ Application deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
    # Health check
    Write-Host "🏥 Performing health check..." -ForegroundColor Blue
    $appUrl = "https://$AppServiceName.azurewebsites.net/health"
    
    try {
        $response = Invoke-WebRequest -Uri $appUrl -Method GET -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Application is healthy!" -ForegroundColor Green
            Write-Host "🌐 Application URL: https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Health check failed with status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "⚠️ Application might still be starting up. Please check manually." -ForegroundColor Yellow
    }
}

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  - Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "  - App Service: $AppServiceName" -ForegroundColor White
Write-Host "  - Cosmos DB: $CosmosDbAccountName" -ForegroundColor White
Write-Host "  - Storage Account: $StorageAccountName" -ForegroundColor White
Write-Host "  - Application URL: https://$AppServiceName.azurewebsites.net" -ForegroundColor White

Write-Host "📖 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure your domain (optional)" -ForegroundColor White
Write-Host "  2. Set up monitoring and alerts" -ForegroundColor White
Write-Host "  3. Configure backup policies" -ForegroundColor White
Write-Host "  4. Test all application features" -ForegroundColor White
