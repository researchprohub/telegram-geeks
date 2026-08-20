@echo off
cd /d "%~dp0"
call npm install
call npm run check
if errorlevel 1 exit /b 1
call npm run dist
echo.
echo Build complete: "%~dp0release\win-unpacked\TelegramGeeks.exe"
pause