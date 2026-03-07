@echo off
:: clear-artwork-cache.bat -- Clear the artwork cache from the database
title [SOKOUL] Clear Artwork Cache
chcp 65001 >nul

echo.
echo   Clearing artwork cache...
sqlite3 "%~dp0..\..\sokoul-backend\sokoul_desktop.db" "DELETE FROM artwork_cache;"
if errorlevel 1 (
    echo   [KO] Failed to clear artwork cache. Is sqlite3 installed?
    pause
    exit /b 1
)
echo   [OK] Artwork cache cleared.
echo.
pause
