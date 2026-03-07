@echo off
:: diagnose.bat -- Full diagnostic for Sokoul Desktop
title Sokoul - Diagnostic
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0diagnose.ps1"
echo.
pause
