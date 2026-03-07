@echo off
if defined __SOKOUL_STARTED goto :MAIN
set __SOKOUL_STARTED=1
start "" cmd /k "%~f0"
exit /b 0

:MAIN
chcp 65001 >nul
setlocal enabledelayedexpansion
title [SOKOUL] Verification des Prerequis
color 0B

echo.
echo ==================================================
echo   SOKOUL DESKTOP -- Verification des Prerequis
echo ==================================================
echo.

set PASS=0
set FAIL=0

:: ── Node.js ──────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo   [KO] Node.js     : NON INSTALLE
    echo        Telecharger  : https://nodejs.org
    set /a FAIL+=1
) else (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VER=%%i
    echo   [OK] Node.js     : !NODE_VER!
    set /a PASS+=1
)

:: ── npm ──────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo   [KO] npm         : NON INSTALLE
    set /a FAIL+=1
) else (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VER=%%i
    echo   [OK] npm         : !NPM_VER!
    set /a PASS+=1
)

:: ── Rust / Cargo ──────────────────────────────────────
where rustc >nul 2>&1
if errorlevel 1 (
    echo   [KO] Rust        : NON INSTALLE
    echo        Installer    : https://rustup.rs
    set /a FAIL+=1
) else (
    for /f "tokens=*" %%i in ('rustc --version 2^>nul') do set RUST_VER=%%i
    echo   [OK] Rust        : !RUST_VER!
    set /a PASS+=1
)

:: ── .env Backend ─────────────────────────────────────
if exist "%~dp0..\sokoul-backend\.env" (
    echo   [OK] .env        : present
    set /a PASS+=1
) else (
    echo   [KO] .env        : MANQUANT
    echo        Chemin       : sokoul-backend\.env
    set /a FAIL+=1
)

:: ── sokoul-backend compile ────────────────────────────
if exist "%~dp0..\sokoul-backend\target\debug\sokoul-backend.exe" (
    echo   [OK] Backend exe : sokoul-backend.exe present
    set /a PASS+=1
) else (
    echo   [--] Backend exe : pas encore compile
    echo        Lancer 02_run_backend.bat pour compiler
)

:: ── sokoul-desktop node_modules ───────────────────────
if exist "%~dp0..\sokoul-desktop\node_modules" (
    echo   [OK] node_modules: present ^(sokoul-desktop^)
    set /a PASS+=1
) else (
    echo   [KO] node_modules: MANQUANT dans sokoul-desktop
    echo        Lancer : npm install dans sokoul-desktop\
    set /a FAIL+=1
)

:: ── mpv.exe ───────────────────────────────────────────
if exist "%~dp0..\sokoul-desktop\mpv\mpv.exe" (
    echo   [OK] mpv.exe     : present
    set /a PASS+=1
) else (
    echo   [KO] mpv.exe     : MANQUANT
    echo        Chemin       : sokoul-desktop\mpv\mpv.exe
    echo        Telecharger  : https://github.com/shinchiro/mpv-winbuild-cmake/releases
    set /a FAIL+=1
)

:: ── Prowlarr (optionnel) ──────────────────────────────
curl -s --connect-timeout 3 http://localhost:9696 >nul 2>&1
if errorlevel 1 (
    echo   [--] Prowlarr    : non detecte sur :9696 ^(facultatif^)
) else (
    echo   [OK] Prowlarr    : actif sur :9696
    set /a PASS+=1
)

echo.
echo ==================================================
echo   Resultat : !PASS! OK  /  !FAIL! KO
echo ==================================================

if !FAIL! gtr 0 (
    color 0C
    echo.
    echo   Corriger les erreurs KO avant de continuer.
) else (
    color 0A
    echo.
    echo   Tout est pret -- lancer start-all.bat
)

echo.
pause
