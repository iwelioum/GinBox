@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL] Reset Base de Donnees
color 0E

echo.
echo ==================================================
echo   SOKOUL -- Reset SQLite (sokoul_desktop.db)
echo ==================================================
echo.
echo   CE SCRIPT SUPPRIME UNIQUEMENT :
echo      sokoul-backend\sokoul_desktop.db
echo      sokoul-backend\sokoul_desktop.db-wal
echo      sokoul-backend\sokoul_desktop.db-shm
echo.
echo   NE TOUCHE PAS A :
echo      .env, configuration, fichiers sources
echo.

set BACKEND_DIR=%~dp0..\sokoul-backend

if not exist "%BACKEND_DIR%" (
    echo   [ERREUR] Dossier sokoul-backend introuvable.
    echo   Chemin attendu : %BACKEND_DIR%
    pause
    exit /b 1
)

set /p CONFIRM="   Confirmer le reset ? Profils et historique effaces. (O/N) : "
if /i not "!CONFIRM!"=="O" (
    echo   Reset annule.
    pause
    exit /b 0
)

echo.
echo   Suppression en cours...

if exist "%BACKEND_DIR%\sokoul_desktop.db"     del /f "%BACKEND_DIR%\sokoul_desktop.db"     && echo   [OK] sokoul_desktop.db supprime
if exist "%BACKEND_DIR%\sokoul_desktop.db-wal" del /f "%BACKEND_DIR%\sokoul_desktop.db-wal" && echo   [OK] sokoul_desktop.db-wal supprime
if exist "%BACKEND_DIR%\sokoul_desktop.db-shm" del /f "%BACKEND_DIR%\sokoul_desktop.db-shm" && echo   [OK] sokoul_desktop.db-shm supprime

echo.
echo ==================================================
echo   Reset termine.
echo   Rust recree les tables au prochain demarrage
echo   (migrations 001 a 005).
echo ==================================================
echo.
echo   Prochaine etape : start-backend.bat
echo.
pause
