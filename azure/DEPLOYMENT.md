# Azure Deployment Guide for OJTmeter Application

This guide provides comprehensive instructions for deploying the OJTmeter Application to Azure using Azure DevOps pipelines and Azure App Service.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed and configured
- Node.js v18+ installed locally
- Git repository with the OJTmeter code
- Azure DevOps organization (free tier available)

## Quick Start Deployment

### Option 1: Automated Deployment Script

#### Windows (PowerShell)
```powershell
# Run the PowerShell deployment script
.\azure\deploy.ps1 -ResourceGroupName "ojtmeter-rg" -Location "East US"
```

#### Linux/Mac (Bash)
```bash
# Make script executable and run
chmod +x azure/deploy.sh
./azure/deploy.sh --resource-group "ojtmeter-rg" --location "East US"
```

### Option 2: Manual Azure CLI Deployment

```bash
# Create resource group
az group create --name "ojtmeter-rg" --location "East US"

# Deploy infrastructure
az deployment group create \
  --resource-group "ojtmeter-rg" \
  --template-file "azure/azuredeploy.json" \
  --parameters @azure/azuredeploy.parameters.json
```

## Detailed Setup Instructions

### 1. Azure Resource Setup

#### 1.1 Create Resource Group
```bash
az group create --name "ojtmeter-rg" --location "East US"
```

#### 1.2 Deploy Infrastructure
The ARM template (`azure/azuredeploy.json`) creates:
- **App Service Plan** (Free F1 tier)
- **App Service** (Node.js 18 LTS)
- **Cosmos DB Account** (Free tier)
- **Storage Account** (Standard LRS)
- **Blob Container** (for exports)

```bash
az deployment group create \
  --resource-group "ojtmeter-rg" \
  --template-file "azure/azuredeploy.json" \
  --parameters @azure/azuredeploy.parameters.json \
  --parameters jwtSecret="$(openssl rand -base64 48)"
```

### 2. Azure DevOps Pipeline Setup

#### 2.1 Create Service Connection
1. Go to Azure DevOps → Project Settings → Service Connections
2. Create new service connection → Azure Resource Manager
3. Select "Service principal (automatic)"
4. Choose your subscription and resource group
5. Name it "Azure-Subscription-Connection"

#### 2.2 Configure Pipeline Variables
In Azure DevOps → Pipelines → Library → Variable Groups:
- `COSMOS_DB_ENDPOINT`: Your Cosmos DB endpoint
- `COSMOS_DB_KEY`: Your Cosmos DB primary key
- `COSMOS_DB_DATABASE_ID`: `ojtmeter-db`
- `JWT_SECRET`: Secure random string
- `JWT_EXPIRES_IN`: `24h`
- `CORS_ORIGIN`: `https://your-app-name.azurewebsites.net`
- `RATE_LIMIT_WINDOW_MS`: `900000`
- `RATE_LIMIT_MAX_REQUESTS`: `100`
- `AZURE_STORAGE_CONNECTION_STRING`: Your storage connection string
- `AZURE_STORAGE_CONTAINER_NAME`: `exports`

#### 2.3 Create Pipeline
1. Go to Azure DevOps → Pipelines → New Pipeline
2. Select your repository
3. Choose "Existing Azure Pipelines YAML file"
4. Select `azure-pipelines.yml`
5. Save and run

### 3. Application Configuration

#### 3.1 Environment Variables
The application uses these environment variables in production:

```bash
# Server
NODE_ENV=production
PORT=8080

# Database
COSMOS_DB_ENDPOINT=https://your-cosmosdb.documents.azure.com:443/
COSMOS_DB_KEY=your-primary-key
COSMOS_DB_DATABASE_ID=ojtmeter-db

# Security
JWT_SECRET=your-secure-secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-app.azurewebsites.net

# Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=exports
```

#### 3.2 App Service Configuration
Configure these settings in Azure Portal → App Service → Configuration:

- **Application Settings**: All environment variables
- **Connection Strings**: None required (using environment variables)
- **General Settings**: 
  - Platform: 64 Bit
  - Stack: Node.js 18 LTS
  - Always On: Disabled (Free tier)

### 4. Database Setup

#### 4.1 Cosmos DB Collections
The application automatically creates these collections:
- `Users` (partition key: `/id`)
- `TimeLogs` (partition key: `/userId`)
- `Projects` (partition key: `/id`)
- `Roles` (partition key: `/id`)

#### 4.2 Initial Data
Create your first admin user via API:
```bash
curl -X POST https://your-app.azurewebsites.net/api/auth/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### 5. Monitoring and Logging

#### 5.1 Application Insights (Optional)
1. Create Application Insights resource
2. Add connection string to App Service configuration
3. Monitor performance and errors

#### 5.2 Health Checks
- **Endpoint**: `https://your-app.azurewebsites.net/health`
- **Response**: JSON with status and timestamp
- **Use**: Load balancer health checks, monitoring

#### 5.3 Logs
- **App Service Logs**: Azure Portal → App Service → Log stream
- **Application Logs**: Console output in App Service
- **Custom Logs**: Application Insights (if configured)

### 6. Security Configuration

#### 6.1 HTTPS
- **Automatic**: App Service provides HTTPS by default
- **Custom Domain**: Configure in App Service → Custom domains
- **SSL Certificate**: Managed by Azure (free)

#### 6.2 CORS
- **Production**: Set to your App Service URL
- **Development**: `http://localhost:5173`

#### 6.3 Rate Limiting
- **Window**: 15 minutes (900,000ms)
- **Limit**: 100 requests per IP
- **Headers**: Standard rate limit headers

### 7. Performance Optimization

#### 7.1 Free Tier Limitations
- **App Service**: 1 GB RAM, shared CPU, sleeps after 20 min idle
- **Cosmos DB**: 25 GB storage, 1,000 RU/s throughput
- **Storage**: 5 GB free per month

#### 7.2 Optimization Strategies
- **Database Queries**: Optimize for RU consumption
- **Caching**: Implement client-side caching
- **Compression**: Enable gzip compression
- **CDN**: Consider Azure CDN for static assets

### 8. Backup and Recovery

#### 8.1 Cosmos DB Backup
- **Automatic**: Point-in-time restore (7 days free)
- **Manual**: Export data via Azure Portal
- **Retention**: Configure backup policies

#### 8.2 App Service Backup
- **Configuration**: Export app settings
- **Code**: Git repository (source of truth)
- **Logs**: Application Insights retention

### 9. Scaling and Upgrades

#### 9.1 Vertical Scaling
```bash
# Upgrade to Basic tier (B1 - ~$13/month)
az appservice plan update \
  --name "ojtmeter-plan" \
  --resource-group "ojtmeter-rg" \
  --sku B1
```

#### 9.2 Horizontal Scaling
- **App Service**: Multiple instances (Basic tier+)
- **Cosmos DB**: Increase RU/s throughput
- **Storage**: Upgrade to Premium tier

### 10. Troubleshooting

#### 10.1 Common Issues

**App Service won't start:**
- Check Node.js version compatibility
- Verify environment variables
- Check application logs

**Database connection fails:**
- Verify Cosmos DB endpoint and key
- Check firewall rules
- Confirm database exists

**Export functionality not working:**
- Verify storage account connection string
- Check container permissions
- Confirm blob storage service initialization

#### 10.2 Debug Commands
```bash
# Check App Service status
az webapp show --name "your-app" --resource-group "ojtmeter-rg"

# View application logs
az webapp log tail --name "your-app" --resource-group "ojtmeter-rg"

# Test health endpoint
curl https://your-app.azurewebsites.net/health
```

### 11. Cost Management

#### 11.1 Free Tier Usage
- **App Service F1**: $0/month (with limitations)
- **Cosmos DB**: $0/month (25 GB, 1,000 RU/s)
- **Storage**: $0/month (5 GB)
- **Total**: $0/month for small usage

#### 11.2 Cost Monitoring
- **Azure Cost Management**: Track spending
- **Alerts**: Set up cost alerts
- **Budgets**: Create monthly budgets

### 12. Maintenance

#### 12.1 Regular Tasks
- **Security Updates**: Keep dependencies updated
- **Database Cleanup**: Remove old time logs (6+ months)
- **Storage Cleanup**: Remove expired exports
- **Monitoring**: Check application health

#### 12.2 Automated Maintenance
- **Pipeline Updates**: Automatic deployments
- **Dependency Updates**: Dependabot/GitHub Actions
- **Database Cleanup**: Scheduled Azure Functions

## Support and Resources

- **Azure Documentation**: https://docs.microsoft.com/azure/
- **App Service Documentation**: https://docs.microsoft.com/azure/app-service/
- **Cosmos DB Documentation**: https://docs.microsoft.com/azure/cosmos-db/
- **Azure DevOps Documentation**: https://docs.microsoft.com/azure/devops/

## Next Steps

1. **Custom Domain**: Configure your own domain
2. **SSL Certificate**: Add custom SSL certificate
3. **Monitoring**: Set up Application Insights
4. **Backup**: Configure automated backups
5. **Scaling**: Plan for growth and scaling
