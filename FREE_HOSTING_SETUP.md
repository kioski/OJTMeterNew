# OJTmeter Application - Free Hosting Alternative Setup

*Measure What Matters, Helping Every Student Grow, One Hour at a Time.*

## 🎯 **Alternative Free Hosting Strategy**

While waiting for Azure DevOps parallelism grant, this guide provides a **100% free hosting solution** using multiple free platforms that meet your project criteria.

---

## 🏗️ **Architecture Overview**

### **Frontend Hosting**
- **Platform**: Vercel (Free Tier)
- **Features**: 
  - ✅ Automatic HTTPS
  - ✅ Global CDN
  - ✅ Custom domain support
  - ✅ Automatic deployments from Git
  - ✅ Unlimited bandwidth
  - ✅ No cold starts

### **Backend Hosting**
- **Platform**: Railway (Free Tier)
- **Features**:
  - ✅ Always-on hosting (no sleep)
  - ✅ Automatic HTTPS
  - ✅ Environment variables
  - ✅ Git-based deployments
  - ✅ Built-in monitoring

### **Database**
- **Platform**: MongoDB Atlas (Free Tier)
- **Features**:
  - ✅ 512 MB storage
  - ✅ Shared clusters
  - ✅ Automatic backups
  - ✅ Built-in security

### **File Storage**
- **Platform**: Cloudinary (Free Tier)
- **Features**:
  - ✅ 25 GB storage
  - ✅ Image optimization
  - ✅ File upload API
  - ✅ CDN delivery

---

## 🚀 **Step-by-Step Setup Guide**

### **Phase 1: Frontend Deployment (Vercel)**

#### Step 1: Prepare Frontend for Production
```powershell
# Navigate to frontend directory
cd frontend

# Install Vercel CLI
npm install -g vercel

# Build the frontend
npm run build
```

#### Step 2: Deploy to Vercel
```powershell
# Login to Vercel
vercel login

# Deploy from frontend directory
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: ojtmeter-frontend
# - Directory: ./
# - Override settings? No
```

#### Step 3: Configure Environment Variables
```powershell
# Set API URL for production
vercel env add VITE_API_URL
# Enter: https://your-backend-url.railway.app/api
```

### **Phase 2: Backend Deployment (Railway)**

#### Step 1: Prepare Backend
```powershell
# Navigate to backend directory
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

#### Step 2: Create Railway Project
```powershell
# Initialize Railway project
railway init

# Deploy to Railway
railway up
```

#### Step 3: Configure Environment Variables
```powershell
# Set production environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=your-super-secret-jwt-key-production
railway variables set CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### **Phase 3: Database Setup (MongoDB Atlas)**

#### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for free account
3. Create new cluster (Free M0 tier)
4. Create database user
5. Whitelist IP addresses (0.0.0.0/0 for Railway)

#### Step 2: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your user password

#### Step 3: Configure Backend for MongoDB
```powershell
# Set MongoDB connection
railway variables set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ojtmeter?retryWrites=true&w=majority
```

### **Phase 4: File Storage (Cloudinary)**

#### Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com
2. Sign up for free account
3. Get API credentials from dashboard

#### Step 2: Configure Cloudinary
```powershell
# Set Cloudinary credentials
railway variables set CLOUDINARY_CLOUD_NAME=your-cloud-name
railway variables set CLOUDINARY_API_KEY=your-api-key
railway variables set CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🔧 **Code Modifications Required**

### **Backend Changes**

#### 1. Update Database Connection (`backend/src/utils/database.ts`)
```typescript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ojtmeter';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
```

#### 2. Update Models for MongoDB (`backend/src/models/`)
```typescript
// Example: UserModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
```

#### 3. Update Package.json Dependencies
```json
{
  "dependencies": {
    "mongoose": "^7.0.0",
    "cloudinary": "^1.40.0",
    "multer": "^1.4.5"
  }
}
```

### **Frontend Changes**

#### 1. Update API Configuration (`frontend/src/services/api.ts`)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## 📊 **Free Tier Limits & Optimization**

### **Vercel (Frontend)**
| Feature | Free Tier | Optimization |
|---------|-----------|--------------|
| Bandwidth | Unlimited | ✅ No limits |
| Builds | 100/month | ✅ Sufficient for development |
| Functions | 100GB-hours | ✅ More than enough |
| Storage | 100GB | ✅ Plenty for static files |

### **Railway (Backend)**
| Feature | Free Tier | Optimization |
|---------|-----------|--------------|
| Usage | $5 credit/month | ✅ ~500 hours runtime |
| Storage | 1GB | ✅ Optimize with cleanup |
| Bandwidth | Unlimited | ✅ No limits |
| Sleep | After 30min idle | ✅ Use uptime monitoring |

### **MongoDB Atlas (Database)**
| Feature | Free Tier | Optimization |
|---------|-----------|--------------|
| Storage | 512MB | ✅ Auto-cleanup old logs |
| Connections | 100 | ✅ Connection pooling |
| Backup | Daily | ✅ Automatic |

### **Cloudinary (Storage)**
| Feature | Free Tier | Optimization |
|---------|-----------|--------------|
| Storage | 25GB | ✅ Auto-delete exports |
| Bandwidth | 25GB/month | ✅ Optimize images |
| Transformations | 25k/month | ✅ Cache transformations |

---

## 🚀 **Deployment Commands**

### **Quick Deploy Script**
```powershell
# Create deployment script
@"
# Deploy Frontend to Vercel
cd frontend
vercel --prod

# Deploy Backend to Railway
cd ../backend
railway up

# Check deployments
echo "Frontend: https://your-app.vercel.app"
echo "Backend: https://your-app.railway.app"
"@ | Out-File -FilePath "deploy-free.ps1" -Encoding UTF8
```

### **Environment Setup**
```powershell
# Set all environment variables at once
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=ojtmeter-super-secret-2024
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
railway variables set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ojtmeter
railway variables set CLOUDINARY_CLOUD_NAME=your-cloud-name
railway variables set CLOUDINARY_API_KEY=your-api-key
railway variables set CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🔄 **CI/CD Alternative**

### **GitHub Actions (Free)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Free Hosting

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - uses: bervProject/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

---

## 🎯 **Cost Comparison**

| Platform | Free Tier | Monthly Cost | Notes |
|----------|-----------|--------------|-------|
| **Vercel** | Unlimited | $0 | Frontend hosting |
| **Railway** | $5 credit | $0 | Backend hosting |
| **MongoDB Atlas** | 512MB | $0 | Database |
| **Cloudinary** | 25GB | $0 | File storage |
| **GitHub Actions** | 2000 min | $0 | CI/CD |
| **Total** | — | **$0.00** | 100% Free |

---

## 🛠️ **Migration from Azure**

### **When Azure Parallelism is Approved**
1. **Keep free hosting** as backup
2. **Migrate database** from MongoDB to Cosmos DB
3. **Update environment variables** for Azure
4. **Switch DNS** to Azure App Service
5. **Maintain both** for redundancy

### **Hybrid Approach**
- **Development**: Use free hosting
- **Production**: Use Azure when ready
- **Backup**: Keep free hosting active

---

## 📱 **Application URLs**

After deployment, your application will be available at:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.railway.app`
- **Health Check**: `https://your-app.railway.app/health`

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### Frontend Not Loading
```powershell
# Check Vercel deployment
vercel logs

# Check environment variables
vercel env ls
```

#### Backend Connection Issues
```powershell
# Check Railway logs
railway logs

# Check environment variables
railway variables
```

#### Database Connection Failed
```powershell
# Test MongoDB connection
railway run node -e "console.log(process.env.MONGODB_URI)"
```

---

## ✅ **Benefits of This Approach**

- ✅ **100% Free** - No costs whatsoever
- ✅ **No Cold Starts** - Always-on hosting
- ✅ **Global CDN** - Fast worldwide access
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Easy Scaling** - Upgrade when needed
- ✅ **Backup Solution** - Keep when Azure is ready

---

**This free hosting solution provides the same functionality as Azure while you wait for the parallelism grant!** 🚀
