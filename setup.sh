#!/bin/bash

echo "🚀 Starting OJTmeter Application Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Check for environment files
echo "🔍 Checking environment configuration..."

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found. Creating from template..."
    cp frontend/env.example frontend/.env
    echo "📝 Please edit frontend/.env with your configuration"
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from template..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env with your Azure Cosmos DB configuration"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your Azure Cosmos DB credentials in backend/.env"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "📖 For detailed setup instructions, see SETUP.md"
