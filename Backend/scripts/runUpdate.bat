@echo off
REM Quick batch script to update all courier partner charges
REM For Windows PowerShell users

echo =============================================
echo Updating All Courier Partner Charges
echo =============================================
echo.

cd /d "%~dp0"

node updateAllCouriers.js

echo.
echo =============================================
echo Process Complete!
echo =============================================
pause
