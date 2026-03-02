@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL] Lanceur Complet
color 0A

echo.
echo ====================================================
echo    SOKOUL DESKTOP -- LANCEUR COMPLET
echo ====================================================
echo.

:: ── Etape 0 : Nettoyage des ports ────────────────────
echo   [0/2] Nettoyage des ports 3000 et 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 3000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 1 >nul
echo   [OK] Ports liberes.
echo.

set SCRIPT_DIR=%~dp0

:: ── Etape 1 : Backend Rust ───────────────────────────
echo   [1/2] Lancement du Backend Rust (nouvelle fenetre)...
start "SOKOUL BACKEND" cmd /k "%SCRIPT_DIR%start-backend.bat"
echo   [OK] Fenetre backend ouverte.
echo.

:: Attendre backend pret (max 45s)
echo   Attente backend sur :3000 (max 45s)...
set /a TRIES=0

:WAIT_BACKEND
set /a TRIES+=1
curl -s --connect-timeout 1 http://localhost:3000/health >nul 2>&1
if not errorlevel 1 goto BACKEND_READY
if !TRIES! GEQ 45 (
    color 0E
    echo   [AVERTISSEMENT] Backend pas encore pret apres 45s.
    echo   Verifier la fenetre [SOKOUL BACKEND] pour les erreurs.
    set /p CONT="   Continuer quand meme ? (O/N) : "
    if /i not "!CONT!"=="O" exit /b 1
    goto LAUNCH_ELECTRON
)
timeout /t 1 /nobreak >nul
goto WAIT_BACKEND

:BACKEND_READY
echo   [OK] Backend operationnel sur :3000
echo.

:LAUNCH_ELECTRON
color 0A

:: ── Etape 2 : Electron Desktop ───────────────────────
echo   [2/2] Lancement Electron Desktop (nouvelle fenetre)...
start "SOKOUL ELECTRON" cmd /k "%SCRIPT_DIR%start-desktop.bat"
echo   [OK] Fenetre Electron ouverte.
echo.

echo ====================================================
echo   SOKOUL EST EN COURS DE DEMARRAGE
echo.
echo   Fenetre [SOKOUL BACKEND]  -> Logs Rust/Axum
echo   Fenetre [SOKOUL ELECTRON] -> Logs Vite + Electron
echo   Fenetre Sokoul Desktop    -> L app s ouvre...
echo.
echo   En cas d erreur :
echo   -> Lancer diagnose.bat  pour un diagnostic complet
echo   -> Lancer live-logs.bat  pour les logs en temps reel
echo   -> Lancer reset-database.bat pour reinitialiser la DB
echo ====================================================
echo.
pause
