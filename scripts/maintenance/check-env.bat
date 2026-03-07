@echo off
:: check-env.bat -- Validate required .env keys
title [SOKOUL] Check Environment
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ==================================================
echo   SOKOUL -- Environment Variables Check
echo ==================================================
echo.

set ENV_FILE=%~dp0..\..\sokoul-backend\.env

if not exist "%ENV_FILE%" (
    echo   [ERROR] .env file not found at: %ENV_FILE%
    echo   Copy .env.example to .env and fill in the values.
    pause
    exit /b 1
)

:: Load .env
for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    set _KEY=%%A
    if not "!_KEY!"=="" if not "!_KEY:~0,1!"=="#" set "%%A=%%B"
)

:: Check required keys
for %%K in (TMDB_API_KEY REALDEBRID_API_TOKEN FANART_API_KEY TRAKT_CLIENT_ID TRAKT_CLIENT_SECRET SOKOUL_ENCRYPTION_KEY DATABASE_URL SERVER_PORT) do (
    if defined %%K (
        echo   %%K .......... OK
    ) else (
        echo   %%K .......... MISSING
    )
)

echo.
echo   -- Optional keys --
for %%K in (PROWLARR_URL PROWLARR_API_KEY FLARESOLVERR_URL) do (
    if defined %%K (
        echo   %%K .......... OK
    ) else (
        echo   %%K .......... NOT SET ^(optional^)
    )
)

echo.
pause
