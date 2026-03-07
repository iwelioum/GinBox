@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL BACKEND] Rust/Axum -- Port 3000
color 0A

set BACKEND_DIR=%~dp0..\..\sokoul-backend

echo.
echo ==================================================
echo   SOKOUL BACKEND -- Rust/Axum
echo   Port : 3000
echo   DB   : !BACKEND_DIR!\sokoul_desktop.db
echo ==================================================
echo.

:: Check .env
if not exist "%BACKEND_DIR%\.env" (
    color 0C
    echo   [ERROR] .env file missing in sokoul-backend\
    echo   Copy .env.example to .env and fill in the values.
    echo.
    pause
    exit /b 1
)

:: Check port 3000 is free
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    set PID_3000=%%a
    color 0E
    echo   [WARNING] Port 3000 is occupied by PID : !PID_3000!
    set /p KILL_PORT="   Do you want to kill this process? (Y/N) : "
    if /i "!KILL_PORT!"=="Y" (
        taskkill /PID !PID_3000! /F >nul 2>&1
        echo   [OK] Process !PID_3000! stopped.
        timeout /t 2 >nul
    ) else (
        echo   [INFO] Attempting to start despite occupation...
    )
    color 0A
)

:: Loading .env into environment
for /f "usebackq tokens=1,* delims==" %%A in ("%BACKEND_DIR%\.env") do (
    set _ENVKEY=%%A
    if not "!_ENVKEY!"=="" if not "!_ENVKEY:~0,1!"=="#" set "%%A=%%B"
)

echo   Starting cargo run...
echo   Logs will appear below.
echo   --------------------------------------------------
echo.

cd /d "%BACKEND_DIR%"
cargo run

echo.
echo ==================================================
echo   Backend stopped.
echo   Check the logs above to diagnose.
echo ==================================================
echo.
pause
