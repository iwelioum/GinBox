@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL] Electron Desktop -- Vite + Electron
color 0B

for /f "delims=" %%i in ("%~dp0..\..\sokoul-desktop") do set "DESKTOP_DIR=%%~fi"

echo.
echo ==================================================
echo   SOKOUL DESKTOP -- Electron / React / Vite
echo   App : sokoul-desktop
echo ==================================================
echo.

:: Check directory
if not exist "!DESKTOP_DIR!" (
    color 0C
    echo   [KO] sokoul-desktop directory not found.
    echo        Expected path : !DESKTOP_DIR!
    pause & exit /b 1
)

:: Install deps if missing
if not exist "!DESKTOP_DIR!\node_modules" (
    echo   [INFO] node_modules missing -- Installing dependencies...
    cd /d "!DESKTOP_DIR!"
    call npm install
    if errorlevel 1 (
        color 0C
        echo   [KO] npm install failed.
        pause & exit /b 1
    )
    echo   [OK] Dependencies installed.
    echo.
)

:: Check backend
curl -s --connect-timeout 2 http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    color 0E
    echo   [WARNING] Backend not reachable on :3000
    echo   Run start-backend.bat first for better performance.
    echo.
    set /p CONT="   Continue anyway? (Y/N) : "
    if /i not "!CONT!"=="Y" exit /b 0
    color 0B
    echo.
)

echo   Starting Electron Desktop (Vite + Electron)...
echo   The Sokoul window will open in a few seconds.
echo.

cd /d "!DESKTOP_DIR!"
npm run electron:dev

echo.
echo ==================================================
echo   Electron stopped.
echo ==================================================
echo.
pause
