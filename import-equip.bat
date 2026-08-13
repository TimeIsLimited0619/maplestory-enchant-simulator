@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   裝備建檔（命令列版）
echo   %CD%
echo  ========================================
echo.
echo  1. 把 Character.*.img.xml 拖進此視窗，按 Enter
set /p XML_PATH=

echo.
echo  2. 輸入裝備名稱（例如：命運之劍）
set /p ITEM_NAME=

echo.
echo  3. 把裝備圖 .png 拖進此視窗，按 Enter
set /p ICON_PATH=

echo.
echo  執行中...
node scripts/import-equip-xml.mjs "%XML_PATH%" --name "%ITEM_NAME%" --icon "%ICON_PATH%" --write --inventory

echo.
pause
