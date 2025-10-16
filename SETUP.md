# OJTmeter Application Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Azure account (for Cosmos DB)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Setup

#### Frontend Environment
Create `frontend/.env` with:
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=OJTmeter
VITE_APP_VERSION=1.0.0
```

#### Backend Environment
Create `backend/.env` with:
```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
COSMOS_DB_ENDPOINT=https://your-cosmosdb-account.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmosdb-primary-key
COSMOS_DB_DATABASE_ID=ojtmeter-db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Azure Cosmos DB Setup

1. Create a new Cosmos DB account in Azure Portal
2. Create a new database named `ojtmeter-db`
3. Copy the endpoint and primary key to your `.env` file
4. The application will automatically create the required containers:
   - Users
   - TimeLogs
   - Projects
   - Roles

### 4. Run the Application

#### Development Mode (Both Frontend and Backend)
```bash
# From root directory
npm run dev
```

#### Individual Services
```bash
# Backend only
cd backend
npm run dev

# Frontend only (in another terminal)
cd frontend
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/health

## Features Implemented

### ✅ Core MVP Features
- User registration and authentication (JWT)
- Time logging (create, read, update, delete)
- Basic dashboard with total hours
- Responsive design with Tailwind CSS
- Role-based access control

### 🔄 Next Phase Features
- Project management
- Advanced reporting and charts
- Calendar visualization
- CSV/Excel export
- Admin user management

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Time Logs
- `POST /api/time-logs` - Create time log
- `GET /api/time-logs` - Get user's time logs
- `GET /api/time-logs/:id` - Get specific time log
- `PUT /api/time-logs/:id` - Update time log
- `DELETE /api/time-logs/:id` - Delete time log
- `GET /api/time-logs/total-hours` - Get total hours
- `GET /api/time-logs/date-range` - Get hours by date range

## Database Schema

### Users Collection
```json
{
  "id": "string",
  "email": "string",
  "password": "string (hashed)",
  "firstName": "string",
  "lastName": "string",
  "role": "super_admin | admin | user",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date",
  "projectIds": "string[]"
}
```

### TimeLogs Collection
```json
{
  "id": "string",
  "userId": "string",
  "projectId": "string (optional)",
  "date": "Date",
  "hours": "number",
  "description": "string (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## User Roles

- **Super Admin**: Full system access, manage all users and projects
- **Admin**: Manage users and projects, view all logs
- **User**: Log time, view own data, basic dashboard

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection protection (Cosmos DB)

## Development Notes

- Frontend built with React + TypeScript + Vite
- Backend built with Node.js + Express + TypeScript
- Database: Azure Cosmos DB (NoSQL)
- Styling: Tailwind CSS
- State Management: React Context API

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGIN in backend .env matches frontend URL
2. **Database Connection**: Verify Cosmos DB endpoint and key are correct
3. **Port Conflicts**: Change PORT in backend .env if 3000 is occupied
4. **Build Errors**: Run `npm install` in both frontend and backend directories

### Logs

- Backend logs: Console output
- Frontend logs: Browser DevTools Console
- Database logs: Azure Cosmos DB metrics in Azure Portal

## Next Steps

1. Set up Azure DevOps pipeline for CI/CD
2. Deploy to Azure App Service
3. Configure custom domain
4. Add monitoring and logging
5. Implement remaining features from specification
