@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONUTF8=1

powershell -NoProfile -ExecutionPolicy Bypass -NoLogo -File "%~dp0scripts\import-equip-loop.ps1"
echo.
pause
