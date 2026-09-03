@echo off
title Stocky - Build Android APK (EAS Cloud)
echo =======================================================
echo          STOCKY v0.1.0 - ANDROID APK BUILDER
echo =======================================================
echo.
echo  Connected Expo Project ID: bf816223-b056-4deb-bfd4-f076db393182
echo.
echo  Starting EAS Android APK build...
echo  If prompted, log in to your Expo account.
echo.
echo =======================================================
cd /d "%~dp0apps\mobile"
call npx --yes eas-cli@latest build --platform android --profile production
echo.
echo =======================================================
echo Build complete. Scan the QR code or click the link above!
echo =======================================================
pause
