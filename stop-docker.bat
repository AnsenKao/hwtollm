@echo off
echo Stopping HWTOLLM Docker Services...
echo.

REM 檢查 Docker 是否運行
docker --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker is not running or not installed!
    echo Containers may already be stopped.
    echo.
)

REM 檢查 docker-compose 是否可用
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose is not available!
    echo Please make sure Docker Compose is installed.
    pause
    exit /b 1
)

echo Stopping containers...
docker-compose down

if errorlevel 1 (
    echo ERROR: Failed to stop Docker containers!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Docker containers stopped successfully!
echo.

pause
