@echo off
cd /d "%~dp0"
node test\smoke.mjs
if errorlevel 1 (
  echo SMOKE FAILED
  exit /b 1
)