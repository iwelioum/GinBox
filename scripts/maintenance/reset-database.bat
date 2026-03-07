@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL] Database Reset
color 0E

echo.
echo ==================================================
echo   SOKOUL -- SQLite Reset (sokoul_desktop.db)
echo ==================================================
echo.
echo   THIS SCRIPT ONLY DELETES :
echo      sokoul-backend\sokoul_desktop.db
echo      sokoul-backend\sokoul_desktop.db-wal
echo      sokoul-backend\sokoul_desktop.db-shm
echo.
echo   DOES NOT TOUCH :
echo      .env, configuration, source files
echo.

set BACKEND_DIR=%~dp0..\..\sokoul-backend

if not exist "%BACKEND_DIR%" (
    echo   [ERROR] sokoul-backend directory not found.
    echo   Expected path : %BACKEND_DIR%
    pause
    exit /b 1
)

set /p CONFIRM="   Confirm reset? Profiles and history will be deleted. (Y/N) : "
if /i not "!CONFIRM!"=="Y" (
    echo   Reset cancelled.
    pause
    exit /b 0
)

echo.
echo   Deleting...

if exist "%BACKEND_DIR%\sokoul_desktop.db"     del /f "%BACKEND_DIR%\sokoul_desktop.db"     && echo   [OK] sokoul_desktop.db deleted
if exist "%BACKEND_DIR%\sokoul_desktop.db-wal" del /f "%BACKEND_DIR%\sokoul_desktop.db-wal" && echo   [OK] sokoul_desktop.db-wal deleted
if exist "%BACKEND_DIR%\sokoul_desktop.db-shm" del /f "%BACKEND_DIR%\sokoul_desktop.db-shm" && echo   [OK] sokoul_desktop.db-shm deleted

echo.
echo ==================================================
echo   Reset complete.
echo   Rust recreates tables on next startup
echo   (migrations 001 to 005).
echo ==================================================
echo.
echo   Next step: start-backend.bat
echo.
pause
