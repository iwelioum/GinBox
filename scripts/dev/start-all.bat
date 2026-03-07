@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL] Full Launcher
color 0A

echo.
echo ====================================================
echo    SOKOUL DESKTOP -- FULL LAUNCHER
echo ====================================================
echo.

:: ── Step 0 : Port cleanup ────────────────────────────
echo   [0/2] Port cleanup 3000 and 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 3000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 1 >nul
echo   [OK] Ports freed.
echo.

set SCRIPT_DIR=%~dp0

:: ── Step 1 : Rust Backend ────────────────────────────
echo   [1/2] Starting Rust Backend (new window)...
start "SOKOUL BACKEND" cmd /k "%SCRIPT_DIR%start-backend.bat"
echo   [OK] Backend window opened.
echo.

:: Wait for backend ready (max 45s)
echo   Waiting for backend on :3000 (max 45s)...
set /a TRIES=0

:WAIT_BACKEND
set /a TRIES+=1
curl -s --connect-timeout 1 http://localhost:3000/health >nul 2>&1
if not errorlevel 1 goto BACKEND_READY
if !TRIES! GEQ 45 (
    color 0E
    echo   [WARNING] Backend not ready after 45s.
    echo   Check the [SOKOUL BACKEND] window for errors.
    set /p CONT="   Continue anyway? (Y/N) : "
    if /i not "!CONT!"=="Y" exit /b 1
    goto LAUNCH_ELECTRON
)
timeout /t 1 /nobreak >nul
goto WAIT_BACKEND

:BACKEND_READY
echo   [OK] Backend operational on :3000
echo.

:LAUNCH_ELECTRON
color 0A

:: ── Step 2 : Electron Desktop ────────────────────────
echo   [2/2] Starting Electron Desktop (new window)...
start "SOKOUL ELECTRON" cmd /k "%SCRIPT_DIR%start-desktop.bat"
echo   [OK] Electron window opened.
echo.

echo ====================================================
echo   SOKOUL IS STARTING
echo.
echo   Window [SOKOUL BACKEND]  -> Rust/Axum logs
echo   Window [SOKOUL ELECTRON] -> Vite + Electron logs
echo   Sokoul Desktop window    -> The app is opening...
echo.
echo   In case of error:
echo   -> Run diagnose.bat for a full diagnostic
echo   -> Run live-logs.bat for real-time logs
echo   -> Run reset-database.bat to reset the DB
echo ====================================================
echo.
pause
