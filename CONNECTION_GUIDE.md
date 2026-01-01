# Frontend-Backend Connection Guide

This guide explains how the frontend and backend are connected in the Merit Grid application.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite (Port 8080)
- **Backend**: Express.js (Port 3000)
- **Communication**: REST API with CORS enabled

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend/sandbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Add your Google API key to `.env`:
   ```
   PORT=3000
   GOOGLE_API_KEY=your_actual_google_api_key
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment files are already configured:
   - `.env.development` - for development (uses http://localhost:3000)
   - `.env.production` - for production (update with your production API URL)

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:8080`

## API Endpoints

The backend exposes the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload Excel/CSV files |
| `/files` | GET | Get list of uploaded files |
| `/files/:filename` | DELETE | Delete a specific file |
| `/parse/:filename` | GET | Parse and get data from a file |
| `/generate` | POST | Generate timetable |
| `/api/branches-divisions` | GET | Get available branches and divisions |
| `/api/timetables` | GET | Get stored timetables |

## How It Works

### 1. API Configuration

The frontend uses a centralized API configuration:
- Location: `frontend/src/config/api.ts`
- Uses environment variables for API URL
- Provides helper functions for building API URLs

### 2. Data Import Service

The `DataImportService` class handles all API communication:
- Location: `frontend/src/utils/dataImportService.ts`
- Methods for uploading files, fetching data, generating timetables, etc.

### 3. Vite Proxy (Development)

During development, Vite proxy forwards API requests to the backend:
- Configured in: `frontend/vite.config.ts`
- Proxies requests starting with `/api`, `/upload`, `/files`, `/parse`, `/generate`
- This allows you to use relative URLs or avoid CORS issues

### 4. CORS Configuration

The backend has CORS enabled for multiple origins:
- Localhost ports: 3000, 3001, 4200, 5173, 8080
- Network IPs for testing on other devices
- Configured in: `backend/sandbox/index.js`

## Running Both Servers

### Option 1: Two Terminal Windows

Terminal 1 (Backend):
```bash
cd backend/sandbox
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Option 2: Using VS Code Tasks (Coming Soon)

You can create VS Code tasks to run both servers simultaneously.

## Testing the Connection

1. Start both backend and frontend servers
2. Open browser to `http://localhost:8080`
3. Navigate to the Timetable Generator page
4. Try uploading a file - it should communicate with the backend

## Troubleshooting

### Backend not connecting:

- Check if backend is running on port 3000: `netstat -ano | findstr :3000`
- Verify `.env` file exists in `backend/sandbox/`
- Check backend console for errors

### Frontend API errors:

- Check browser console for error messages
- Verify the API URL in `.env.development`
- Check Network tab in browser DevTools to see API requests
- Ensure backend server is running

### CORS Errors:

- The backend is configured to accept requests from localhost:8080
- If using a different port, update CORS config in `backend/sandbox/index.js`

### File Upload Issues:

- Maximum file size: 10MB
- Allowed formats: .xlsx, .xls, .csv
- Check backend `uploads/` directory permissions

## Environment Variables

### Frontend (.env.development)
```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)
```
PORT=3000
GOOGLE_API_KEY=your_google_api_key
```

## Production Deployment

For production:

1. Update `frontend/.env.production` with your production API URL
2. Build the frontend: `npm run build` in frontend directory
3. Deploy backend to your server
4. Update backend CORS origins to include your production domain
5. Ensure backend `.env` has production Google API key

## API Usage Examples

### Upload a File
```typescript
import { DataImportService } from '@/utils/dataImportService';

const handleFileUpload = async (file: File) => {
  const result = await DataImportService.importFile(file);
  if (result.success) {
    console.log('File uploaded successfully');
  }
};
```

### Generate Timetable
```typescript
const generateTimetable = async () => {
  const result = await DataImportService.generateTimetable({
    branch: 'CS',
    division: '1',
    year: '3',
    theoryDuration: 50,
    labDuration: 120,
    shortBreaks: 2,
    longBreaks: 1
  });
  
  if (result.success) {
    console.log('Timetable generated:', result);
  }
};
```

### Get Branches and Divisions
```typescript
const loadOptions = async () => {
  const result = await DataImportService.getBranchesAndDivisions();
  if (result.success) {
    console.log('Branches:', result.data.branches);
    console.log('Divisions:', result.data.divisions);
  }
};
```

## Additional Notes

- All API calls are asynchronous and return promises
- Error handling is built into the DataImportService
- The backend stores uploaded files in `backend/sandbox/uploads/`
- Generated timetables are saved as JSON files
