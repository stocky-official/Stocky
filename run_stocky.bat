@echo off
setlocal enabledelayedexpansion
title Stocky Launcher v0.1.0

echo =======================================================
echo          STOCKY v0.1.0 - PLATFORM LAUNCHER
echo =======================================================
echo.

:: Step A: Ensure no zombie servers are running on port 3000
echo [1/2] Checking for running or zombie servers on port 3000...
set FOUND_SERVER=0

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    set PID=%%a
    if defined PID (
        echo  -- Found process PID !PID! using port 3000. Terminating...
        taskkill /F /PID !PID! >nul 2>&1
        set FOUND_SERVER=1
    )
)

if !FOUND_SERVER! EQU 1 (
    ping 127.0.0.1 -n 2 >nul
) else (
    echo  -- Port 3000 is clean. No zombie servers found.
)

echo.
:: Step B: Run the website
echo [2/2] Starting Stocky Web Application...
echo  -- URL: http://localhost:3000
echo  -- Press Ctrl+C anytime to stop the server.
echo =======================================================
echo.

where pnpm.cmd >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call pnpm.cmd --filter web dev
) else (
    call pnpm --filter web dev
)

