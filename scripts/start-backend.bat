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

set BACKEND_DIR=%~dp0..\sokoul-backend

echo.
echo ==================================================
echo   SOKOUL BACKEND -- Rust/Axum
echo   Port : 3000
echo   DB   : !BACKEND_DIR!\sokoul_desktop.db
echo ==================================================
echo.

:: Verification .env
if not exist "%BACKEND_DIR%\.env" (
    color 0C
    echo   [ERREUR] Fichier .env manquant dans sokoul-backend\
    echo   Copier .env.example vers .env et remplir les valeurs.
    echo.
    pause
    exit /b 1
)

:: Verification port 3000 libre
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    set PID_3000=%%a
    color 0E
    echo   [AVERTISSEMENT] Le port 3000 est occupe par le PID : !PID_3000!
    set /p KILL_PORT="   Voulez-vous fermer ce processus ? (O/N) : "
    if /i "!KILL_PORT!"=="O" (
        taskkill /PID !PID_3000! /F >nul 2>&1
        echo   [OK] Processus !PID_3000! arrete.
        timeout /t 2 >nul
    ) else (
        echo   [INFO] Tentative de lancement malgre l'occupation...
    )
    color 0A
)

:: Chargement .env dans l'environnement
for /f "usebackq tokens=1,* delims==" %%A in ("%BACKEND_DIR%\.env") do (
    set _ENVKEY=%%A
    if not "!_ENVKEY!"=="" if not "!_ENVKEY:~0,1!"=="#" set "%%A=%%B"
)

echo   Lancement cargo run...
echo   Les logs apparaissent ci-dessous.
echo   --------------------------------------------------
echo.

cd /d "%BACKEND_DIR%"
cargo run

echo.
echo ==================================================
echo   Backend arrete.
echo   Consulter les logs ci-dessus pour diagnostiquer.
echo ==================================================
echo.
pause
