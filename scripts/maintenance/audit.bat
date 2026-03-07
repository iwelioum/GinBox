@echo off
:: audit.bat -- Full quality gate for the entire project
title [SOKOUL] Audit
chcp 65001 >nul

echo.
echo ==================================================
echo   SOKOUL -- Full Project Audit
echo ==================================================
echo.

echo === FRONTEND ===
echo.
cd /d "%~dp0..\..\sokoul-desktop"

echo   [1/4] TypeScript type check...
call npx tsc --noEmit
echo.

echo   [2/4] Checking for unused exports...
call npx ts-prune
echo.

echo   [3/4] Checking for circular dependencies...
call npx madge --circular src
echo.

echo   [4/4] ESLint boundary check...
call npx eslint src
echo.

echo === BACKEND ===
echo.
cd /d "%~dp0..\..\sokoul-backend"

echo   [1/3] cargo check...
cargo check
echo.

echo   [2/3] cargo clippy...
cargo clippy
echo.

echo   [3/3] cargo fmt --check...
cargo fmt --check
echo.

echo === DONE ===
echo.
pause
