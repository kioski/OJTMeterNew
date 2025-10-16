@echo off
echo 🚀 Starting OJTmeter Application Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
npm install
cd ..

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
cd ..

REM Check for environment files
echo 🔍 Checking environment configuration...

if not exist "frontend\.env" (
    echo ⚠️  Frontend .env file not found. Creating from template...
    copy frontend\env.example frontend\.env
    echo 📝 Please edit frontend\.env with your configuration
)

if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found. Creating from template...
    copy backend\env.example backend\.env
    echo 📝 Please edit backend\.env with your Azure Cosmos DB configuration
)

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Configure your Azure Cosmos DB credentials in backend\.env
echo 2. Run 'npm run dev' to start both frontend and backend
echo 3. Open http://localhost:5173 in your browser
echo.
echo 📖 For detailed setup instructions, see SETUP.md
pause
