@echo off
echo ========================================
echo   Starting AdaptEd AI Platform
echo ========================================
echo.

echo [1/2] Starting Python Backend (Port 8050)...
start "Python Backend" cmd /k "cd backend && python -m uvicorn tutor_api:app --host 0.0.0.0 --port 8050"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Node.js Frontend Server (Port 5050)...
start "Node.js Server" cmd /k "npm run server"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Python Backend: http://localhost:8050
echo Frontend App:   http://localhost:5050
echo.
echo Open http://localhost:5050/login.html in your browser
echo.
echo Press any key to exit this window...
pause >nul
