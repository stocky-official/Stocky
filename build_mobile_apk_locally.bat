@echo off
title Stocky - Local Android APK Compiler
echo =======================================================
echo      STOCKY v0.1.0 - LOCAL OFFLINE APK BUILDER
echo =======================================================
echo.
echo  100%% Local Compilation - No Expo Account - No Cloud Upload!
echo.
echo  [1/3] Configuring portable OpenJDK 17 environment...
set "JAVA_HOME=%~dp0_technical_support\tools\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"

echo  [2/3] Checking environment...
call "%JAVA_HOME%\bin\java.exe" -version

echo.
echo  [3/3] Compiling standalone APK with Gradle...
cd "%~dp0apps\mobile\android"
call gradlew.bat assembleDebug

if exist "%~dp0apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo =======================================================
    echo  SUCCESS! Standalone APK compiled successfully!
    echo.
    echo  File Location:
    echo  %~dp0apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo  You can transfer this .apk to your phone and install it!
    echo =======================================================
) else (
    echo.
    echo [NOTE] Check the build output above for details.
)
pause
