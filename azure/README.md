# OJTmeter Application - Azure Deployment & DevOps

This directory contains all the necessary files and configurations for deploying the OJTmeter Application to Azure using Azure DevOps pipelines and Azure App Service.

## 📁 File Structure

```
azure/
├── azuredeploy.json              # ARM template for infrastructure
├── azuredeploy.parameters.json   # Parameters for ARM template
├── deploy.ps1                    # PowerShell deployment script
├── deploy.sh                     # Bash deployment script
└── DEPLOYMENT.md                 # Comprehensive deployment guide
```

## 🚀 Quick Start

### Prerequisites
- Azure account with active subscription
- Azure CLI installed and configured
- Node.js v18+ installed locally

### Option 1: Automated Script (Recommended)

**Windows:**
```powershell
.\azure\deploy.ps1 -ResourceGroupName "ojtmeter-rg" -Location "East US"
```

**Linux/Mac:**
```bash
chmod +x azure/deploy.sh
./azure/deploy.sh --resource-group "ojtmeter-rg" --location "East US"
```

### Option 2: Manual Azure CLI

```bash
# Create resource group
az group create --name "ojtmeter-rg" --location "East US"

# Deploy infrastructure
az deployment group create \
  --resource-group "ojtmeter-rg" \
  --template-file "azure/azuredeploy.json" \
  --parameters @azure/azuredeploy.parameters.json
```

## 🏗️ Infrastructure Components

The ARM template creates:

- **App Service Plan** (Free F1 tier)
- **App Service** (Node.js 18 LTS)
- **Cosmos DB Account** (Free tier - 25 GB, 1,000 RU/s)
- **Storage Account** (Standard LRS for exports)
- **Blob Container** (for CSV/Excel exports)

## 🔧 Configuration

### Environment Variables
- `NODE_ENV=production`
- `PORT=8080`
- `COSMOS_DB_ENDPOINT` - Your Cosmos DB endpoint
- `COSMOS_DB_KEY` - Your Cosmos DB primary key
- `JWT_SECRET` - Secure random string
- `AZURE_STORAGE_CONNECTION_STRING` - Storage account connection string

### Azure DevOps Pipeline
1. Create service connection to Azure
2. Configure pipeline variables
3. Use `azure-pipelines.yml` for CI/CD

## 📊 Monitoring & Logging

- **Health Check**: `/health` endpoint
- **Application Logs**: Azure Portal → App Service → Log stream
- **Custom Metrics**: Built-in monitoring service
- **Export Statistics**: Blob storage usage tracking

## 🔒 Security Features

- **HTTPS**: Automatic SSL certificate
- **CORS**: Configurable origins
- **Rate Limiting**: 100 requests per 15 minutes
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Express-validator middleware

## 💰 Cost Management

**Free Tier Usage:**
- App Service F1: $0/month
- Cosmos DB: $0/month (25 GB, 1,000 RU/s)
- Storage: $0/month (5 GB)
- **Total**: $0/month for small usage

**Upgrade Options:**
- App Service B1: ~$13/month (dedicated resources)
- Cosmos DB: Pay-per-use beyond free tier
- Storage: Pay-per-use beyond 5 GB

## 🛠️ Troubleshooting

### Common Issues

**App won't start:**
- Check Node.js version compatibility
- Verify environment variables
- Check application logs

**Database connection fails:**
- Verify Cosmos DB credentials
- Check firewall rules
- Confirm database exists

**Export not working:**
- Verify storage connection string
- Check container permissions
- Confirm blob service initialization

### Debug Commands
```bash
# Check App Service status
az webapp show --name "your-app" --resource-group "ojtmeter-rg"

# View logs
az webapp log tail --name "your-app" --resource-group "ojtmeter-rg"

# Test health
curl https://your-app.azurewebsites.net/health
```

## 📈 Scaling

### Vertical Scaling
```bash
# Upgrade to Basic tier
az appservice plan update \
  --name "ojtmeter-plan" \
  --resource-group "ojtmeter-rg" \
  --sku B1
```

### Horizontal Scaling
- Multiple App Service instances (Basic tier+)
- Increase Cosmos DB RU/s throughput
- Upgrade storage tier

## 🔄 CI/CD Pipeline

The `azure-pipelines.yml` provides:

- **Build Stage**: Install dependencies, build frontend/backend
- **Test Stage**: Run unit tests
- **Deploy Stage**: Deploy to Azure App Service
- **Health Check**: Verify deployment success

## 📚 Documentation

- **Detailed Guide**: See `DEPLOYMENT.md`
- **Azure Docs**: https://docs.microsoft.com/azure/
- **App Service**: https://docs.microsoft.com/azure/app-service/
- **Cosmos DB**: https://docs.microsoft.com/azure/cosmos-db/

## 🎯 Next Steps

1. **Custom Domain**: Configure your own domain
2. **SSL Certificate**: Add custom SSL certificate
3. **Monitoring**: Set up Application Insights
4. **Backup**: Configure automated backups
5. **Scaling**: Plan for growth and scaling

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Azure documentation
- Create GitHub issues for bugs
- Contact Azure support for infrastructure issues
