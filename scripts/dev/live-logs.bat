@echo off
:: live-logs.bat -- Real-time log monitoring for Sokoul Desktop
title Sokoul - Live Logs
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0live-logs.ps1"
echo.
pause
