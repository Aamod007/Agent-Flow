@echo off
title Agent-Flow Startup
color 0A

echo ============================================
echo          AGENT-FLOW STARTUP SCRIPT
echo ============================================
echo.

:: Set the project path (update this to your actual path)
set PROJECT_PATH=%~dp0..

:: Kill any existing node processes (optional - comment out if not desired)
echo [1/5] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Workflow Service
echo [2/5] Starting Workflow Service (port 3001)...
start "Workflow Service" cmd /k "cd /d %PROJECT_PATH%\backend\workflow && npm run dev"
timeout /t 3 /nobreak >nul

:: Start Execution Service
echo [3/5] Starting Execution Service (port 3002)...
start "Execution Service" cmd /k "cd /d %PROJECT_PATH%\backend\execution && npm run dev"
timeout /t 3 /nobreak >nul

:: Start Gateway Service
echo [4/5] Starting Gateway Service (port 3000)...
start "Gateway Service" cmd /k "cd /d %PROJECT_PATH%\backend\gateway && npm run dev"
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [5/5] Starting Frontend (port 5173)...
start "Frontend" cmd /k "cd /d %PROJECT_PATH%\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo           ALL SERVICES STARTED!
echo ============================================
echo.
echo Services running:
echo   - Workflow:   http://localhost:3001
echo   - Execution:  http://localhost:3002
echo   - Gateway:    http://localhost:3000
echo   - Frontend:   http://localhost:5173
echo.
echo Open http://localhost:5173 in your browser
echo.
echo Press any key to open the app in browser...
pause >nul

start http://localhost:5173
