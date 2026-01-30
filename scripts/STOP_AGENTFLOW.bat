@echo off
title Agent-Flow Shutdown
color 0C

echo ============================================
echo          AGENT-FLOW SHUTDOWN
echo ============================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo All Agent-Flow services have been stopped.
echo.
pause
