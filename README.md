# OJTmeter Application

*Measure What Matters, Helping Every Student Grow, One Hour at a Time.*

A lightweight, web-based time tracking system designed for OJT students and administrators, built with React, Node.js, and Azure Cosmos DB.

## Features

- **Student Features**: Log daily hours, view progress, export reports
- **Admin Features**: Manage users, projects, generate summaries
- **Visualization**: Charts and calendar views for time tracking
- **Azure Integration**: Hosted on Azure App Service with Cosmos DB

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Azure Cosmos DB
- **Authentication**: JWT-based
- **Hosting**: Azure App Service (Free Tier)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Azure account (for deployment)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Configure your Azure Cosmos DB connection string

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start both frontend (http://localhost:5173) and backend (http://localhost:3000) servers.

## Project Structure

```
ojtmeter-application/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── docs/             # Documentation
└── azure/            # Azure deployment configurations
```

## Build and Test

- **Frontend Build**: `npm run build:frontend`
- **Backend Build**: `npm run build:backend`
- **Full Build**: `npm run build`

## 🚀 Azure Deployment

The application includes comprehensive Azure deployment configurations with CI/CD pipelines.

### Quick Deployment

**Windows:**
```powershell
.\azure\deploy.ps1 -ResourceGroupName "ojtmeter-rg" -Location "East US"
```

**Linux/Mac:**
```bash
chmod +x azure/deploy.sh
./azure/deploy.sh --resource-group "ojtmeter-rg" --location "East US"
```

### Azure DevOps Pipeline

1. **Create Service Connection**: Connect Azure DevOps to your Azure subscription
2. **Configure Variables**: Set up environment variables in Azure DevOps
3. **Run Pipeline**: Use `azure-pipelines.yml` for automated CI/CD

### Infrastructure Components

- **App Service Plan** (Free F1 tier)
- **App Service** (Node.js 18 LTS)
- **Cosmos DB** (Free tier - 25 GB, 1,000 RU/s)
- **Storage Account** (for CSV/Excel exports)
- **Blob Container** (temporary file storage)

### Cost

**Free Tier**: $0/month for small usage (up to 10 users)
- App Service F1: Free
- Cosmos DB: Free (25 GB, 1,000 RU/s)
- Storage: Free (5 GB)

**Upgrade**: ~$13/month for Basic tier (dedicated resources)

### Documentation

- **Detailed Guide**: [azure/DEPLOYMENT.md](azure/DEPLOYMENT.md)
- **Quick Reference**: [azure/README.md](azure/README.md)
- **Setup Instructions**: [SETUP.md](SETUP.md)

## Contributing

This is a personal-use application for OJT time tracking. Contributions are welcome for bug fixes and feature enhancements.

## License

MIT License - see LICENSE file for details.