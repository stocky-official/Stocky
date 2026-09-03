@echo off
title Stocky - Git Push to GitHub
echo =======================================================
echo          STOCKY - PUSH TO GITHUB REPOSITORY
echo =======================================================
echo.
echo  Target: https://github.com/stocky-official/Stocky.git
echo  Branch: main
echo.
echo  If prompted, authorize Git Credential Manager in your browser.
echo.
echo =======================================================
git push -u origin main
echo.
echo =======================================================
echo Done!
echo =======================================================
pause
