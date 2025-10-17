# OJTmeter Application - Render.com Free Hosting Setup

*Zero Code Changes Required - Easy 5-Step Setup*

---

## 🎯 **Why Render.com?**

✅ **Perfect Match**: Works with your existing codebase  
✅ **Zero Changes**: No code modifications needed  
✅ **Free Tier**: 750 hours/month (more than enough)  
✅ **Easy Setup**: 5 simple steps  
✅ **Professional**: Custom domains, HTTPS, auto-deployments  

---

## 🚀 **Step 1: Create Render Account**

### 1.1 Go to Render.com
- Visit: https://render.com
- Click **"Get Started for Free"**

### 1.2 Sign Up
- Click **"Sign up with GitHub"**
- Authorize Render to access your repositories
- Complete account setup

---

## 🚀 **Step 2: Connect Your Repository**

### 2.1 Create New Web Service
- Click **"New +"** button
- Select **"Web Service"**

### 2.2 Connect Repository
- Click **"Connect GitHub"**
- Find your repository: **"OJT Time Tracker and Task Update App"**
- Click **"Connect"**

---

## 🚀 **Step 3: Configure Build Settings**

### 3.1 Basic Settings
```
Name: ojtmeter-app
Environment: Node
Region: Oregon (US West) or Frankfurt (Europe)
Branch: main
```

### 3.2 Build & Deploy Commands
```
Build Command: npm run install:all && npm run build
Start Command: cd backend && npm start
```

### 3.3 Advanced Settings
- **Auto-Deploy**: Yes (deploys on every push)
- **Pull Request Previews**: Yes (optional)

---

## 🚀 **Step 4: Set Environment Variables**

### 4.1 Click "Environment" Tab
Add these variables one by one:

### 4.2 Required Variables
```
NODE_ENV = production
PORT = 3000
JWT_SECRET = ojtmeter-super-secret-jwt-key-2024-production
CORS_ORIGIN = https://ojtmeter-app.onrender.com
```

### 4.3 Database Variables (Choose One Option)

#### Option A: Keep Your Cosmos DB (Recommended)
```
COSMOS_DB_ENDPOINT = https://your-cosmosdb-account.documents.azure.com:443/
COSMOS_DB_KEY = your-cosmosdb-primary-key
COSMOS_DB_DATABASE_ID = ojtmeter-db
```

#### Option B: Use MongoDB Atlas (Free Alternative)
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/ojtmeter
```

### 4.4 Optional Variables
```
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

---

## 🚀 **Step 5: Deploy**

### 5.1 Create Web Service
- Click **"Create Web Service"**
- Render will start building your app
- Wait 5-10 minutes for deployment

### 5.2 Your App is Live!
- **URL**: `https://ojtmeter-app.onrender.com`
- **Frontend**: Same URL (served by Express)
- **API**: `https://ojtmeter-app.onrender.com/api`

---

## 🔧 **Quick Setup Commands**

### If You Want to Test Locally First:
```powershell
# Test production build locally
npm run install:all
npm run build
cd backend
npm start
```

### Check Your App:
- Visit: http://localhost:3000
- Should work exactly like Render deployment

---

## 📱 **Using Your Deployed App**

### 1. Access Your App
- Go to: `https://ojtmeter-app.onrender.com`
- Register a new user
- Login and start logging time

### 2. Admin Features
- Create admin user (first user is usually admin)
- Manage users and projects
- View reports and exports

### 3. API Endpoints
- Health Check: `https://ojtmeter-app.onrender.com/health`
- API Base: `https://ojtmeter-app.onrender.com/api`

---

## 🔄 **Automatic Deployments**

### Every Time You Push to Main:
1. **Push code** to GitHub
2. **Render detects** the change
3. **Automatically builds** your app
4. **Deploys** the new version
5. **Your app updates** live

### No Manual Work Needed!

---

## 🆘 **Troubleshooting**

### Build Fails?
```powershell
# Check build locally first
npm run install:all
npm run build
```

### App Won't Start?
- Check **Environment Variables** are set correctly
- Check **Start Command**: `cd backend && npm start`
- Check **Logs** in Render dashboard

### Database Connection Issues?
- Verify **COSMOS_DB_ENDPOINT** and **COSMOS_DB_KEY**
- Check **CORS_ORIGIN** matches your Render URL
- Test connection in **Logs** section

### Frontend Not Loading?
- Check **CORS_ORIGIN** environment variable
- Should be: `https://your-app-name.onrender.com`

---

## 🎯 **Free Tier Limits**

| Feature | Free Tier | Your Usage |
|---------|-----------|------------|
| **Hours** | 750/month | ~200 hours |
| **Bandwidth** | 100GB/month | ~5GB |
| **Sleep** | After 15min idle | ✅ Acceptable |
| **Custom Domain** | ✅ Supported | ✅ Free |

---

## 🔄 **Migration Back to Azure**

### When Azure Parallelism is Ready:
1. **Keep Render** as backup
2. **Update Azure pipeline** environment variables
3. **Deploy to Azure** App Service
4. **Switch DNS** to Azure URL
5. **Render stays** as backup

---

## ✅ **Benefits Summary**

- ✅ **Zero Code Changes** - Works with existing codebase
- ✅ **5-Minute Setup** - Simple configuration
- ✅ **Free Forever** - No hidden costs
- ✅ **Professional URLs** - Custom domains supported
- ✅ **Auto-Deployments** - Push to deploy
- ✅ **HTTPS Included** - Secure by default
- ✅ **Easy Scaling** - Upgrade when needed

---

## 🚀 **Ready to Deploy?**

**Follow the 5 steps above and your OJTmeter app will be live in minutes!**

**No code changes, no complex setup - just deploy and go!** 🎯

---

**Your app will be available at: `https://ojtmeter-app.onrender.com`**
