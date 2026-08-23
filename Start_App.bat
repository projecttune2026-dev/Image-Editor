@echo off
title Image-Editor Pro Server
cd /d "%~dp0"
echo ===================================================
echo   Starting Image-Editor Local Server...
echo   App URL: http://127.0.0.1:54321
echo ===================================================
echo.
"%~dp0venv\Scripts\python.exe" "%~dp0app.py"
pause
