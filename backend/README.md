# Merit Grid - Backend Server

This is the Express.js backend server for the Merit Grid timetable generation application.

## Features

- File upload (Excel/CSV) for college data
- AI-powered timetable generation using Google Gemini
- RESTful API for frontend integration
- CORS enabled for cross-origin requests
- File storage and management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Google API key to `.env`:
```
PORT=3000
GOOGLE_API_KEY=your_google_api_key_here
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000` with hot reload enabled.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload Excel/CSV files |
| `/files` | GET | Get list of uploaded files |
| `/files/:filename` | DELETE | Delete a specific file |
| `/parse/:filename` | GET | Parse and get data from a file |
| `/generate` | POST | Generate timetable using AI |
| `/api/branches-divisions` | GET | Get available branches and divisions |
| `/api/timetables` | GET | Get stored timetables |

## Technologies

- Express.js - Web framework
- Multer - File upload handling
- XLSX - Excel file parsing
- Google Generative AI - Timetable generation
- CORS - Cross-origin resource sharing
- EJS - Template engine

## Resources

- [Connection Guide](../../CONNECTION_GUIDE.md) - Frontend-Backend integration guide
- [CodeSandbox — Docs](https://codesandbox.io/docs/learn)
- [CodeSandbox — Discord](https://discord.gg/Ggarp3pX5H)

