@echo off
echo ============================================
echo QUICK TEST - Courier Partner Configuration
echo ============================================
echo.

cd /d "%~dp0"

echo Running quick validation test...
echo.

node testQuick.js

echo.
echo ============================================
echo Test Complete!
echo ============================================
pause
