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

for /f "delims=" %%i in ("%~dp0..\sokoul-desktop") do set "DESKTOP_DIR=%%~fi"

echo.
echo ==================================================
echo   SOKOUL DESKTOP -- Electron / React / Vite
echo   App : sokoul-desktop
echo ==================================================
echo.

:: Verification dossier
if not exist "!DESKTOP_DIR!" (
    color 0C
    echo   [KO] Dossier sokoul-desktop introuvable.
    echo        Chemin attendu : !DESKTOP_DIR!
    pause & exit /b 1
)

:: Installation deps si absentes
if not exist "!DESKTOP_DIR!\node_modules" (
    echo   [INFO] node_modules absent -- Installation des dependances...
    cd /d "!DESKTOP_DIR!"
    call npm install
    if errorlevel 1 (
        color 0C
        echo   [KO] npm install a echoue.
        pause & exit /b 1
    )
    echo   [OK] Dependances installees.
    echo.
)

:: Verification backend
curl -s --connect-timeout 2 http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    color 0E
    echo   [AVERTISSEMENT] Backend non accessible sur :3000
    echo   Lancer start-backend.bat d abord pour de meilleures perfs.
    echo.
    set /p CONT="   Continuer quand meme ? (O/N) : "
    if /i not "!CONT!"=="O" exit /b 0
    color 0B
    echo.
)

echo   Lancement Electron Desktop (Vite + Electron)...
echo   La fenetre Sokoul s ouvre dans quelques secondes.
echo.

cd /d "!DESKTOP_DIR!"
npm run electron:dev

echo.
echo ==================================================
echo   Electron arrete.
echo ==================================================
echo.
pause
