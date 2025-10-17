# OJTmeter Application - Simple PowerShell Guide

## 🎯 How to Start

### Step 1: Open PowerShell and Navigate to Project
```powershell
cd "D:\Repository\OJT Time Tracker and Task Update App"
```

### Step 2: Start the Application
```powershell
npm run dev
```

**✅ Done!** Your app is now running at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

---

## 🔄 How to Reset

### If Something Goes Wrong:
```powershell
# Stop all processes
taskkill /f /im node.exe

# Reinstall dependencies
npm run install:all

# Start again
npm run dev
```

### If Ports Are Busy:
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Check what's using port 5173
netstat -ano | findstr :5173

# Kill specific process (replace [PID] with actual number)
taskkill /f /pid [PID]
```

---

## 🛑 How to End/Shutdown

### Method 1: Keyboard Shortcut
- Press **Ctrl+C** in the terminal where `npm run dev` is running

### Method 2: Kill All Node Processes
```powershell
taskkill /f /im node.exe
```

### Method 3: Close Terminal
- Simply close the PowerShell window

---

## 🆘 Basic Error Solutions

### Error: "Port 3000 is already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :3000
taskkill /f /pid [PID_NUMBER]
```

### Error: "Port 5173 is already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :5173
taskkill /f /pid [PID_NUMBER]
```

### Error: "Module not found"
```powershell
# Reinstall dependencies
npm run install:all
```

### Error: "Cannot find .env file"
```powershell
# Copy example files
Copy-Item "backend\.env.example" "backend\.env"
Copy-Item "frontend\.env.example" "frontend\.env"
```

### Error: "Build failed"
```powershell
# Clean and rebuild
npm run build
```

---

## 📱 Using the Application

### 1. Register New User
- Go to: http://localhost:5173/register
- Fill form and submit

### 2. Login
- Go to: http://localhost:5173/login
- Enter credentials

### 3. Create Time Logs
- Click "Add Time Log" on dashboard
- Fill in project, task, and time

### 4. View Reports
- Access admin dashboard
- View time tracking data

---

## 🔗 Quick Access URLs

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Frontend Application |
| http://localhost:3000 | Backend API |
| http://localhost:3000/health | Health Check |

---

## 📝 Notes

- **Mock Database**: Uses in-memory storage (no external database needed)
- **Auto-Reload**: Changes update automatically when you save files
- **Data Reset**: All data resets when you restart the server
- **Development Mode**: Both frontend and backend run in development mode with hot reload

---

**That's it! Just 2 commands to start: `cd` and `npm run dev`**
