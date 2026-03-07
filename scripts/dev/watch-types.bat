@echo off
:: watch-types.bat -- Continuous TypeScript type checking
title [SOKOUL] TypeScript Watch
cd /d "%~dp0..\..\sokoul-desktop"
npx tsc --noEmit --watch
