@echo off
echo Starting Merit Grid Application...
echo.

echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "cd backend\sandbox && npm start"

timeout /t 2 /nobreak > nul

echo Starting Frontend Server (Port 8080)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8080
echo.
pause
