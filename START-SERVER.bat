@echo off
title Porte Prestige - 3D Showroom Server
cd /d "%~dp0"

echo.
echo  =============================================
echo    Porte Prestige - 3D Showroom
echo  =============================================
echo.
echo  Starting local server on port 8080...
echo.
echo  Site :   http://localhost:8080
echo  Admin:   http://localhost:8080/admin.html
echo.
echo  Chrome will open automatically in 2 seconds.
echo  Press Ctrl+C to stop the server.
echo.

timeout /t 2 /nobreak >nul

start "" "http://localhost:8080"

npx --yes http-server . -p 8080 --cors -c-1 -o

pause
