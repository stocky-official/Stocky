@echo off
title Stocky - Mobile Dev Server
echo =======================================================
echo          STOCKY v0.1.0 - MOBILE EXPO SERVER
echo =======================================================
echo.
echo  Starting Expo Development Server...
echo  Scan the QR code with the Expo Go app on your phone.
echo.
echo =======================================================
cd apps\mobile
call npx expo start
pause
