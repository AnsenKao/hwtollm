@echo off
echo Starting HWTOLLM Docker Services...
echo.


REM 檢查 Docker Desktop 是否啟動，若未啟動則自動啟動
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Docker Desktop is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker Desktop to start...
    :waitloop
    timeout /t 3 >nul
    docker info >nul 2>&1
    if errorlevel 1 goto waitloop
    echo Docker Desktop started.
)

REM 檢查 Docker 是否運行
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please make sure Docker Desktop is installed and running.
    pause
    exit /b 1
)

REM 檢查 docker-compose 是否可用
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose is not available!
    echo Please make sure Docker Compose is installed.
    pause
    exit /b 1
)

REM 檢查 .env.local 文件是否存在
if not exist .env.local (
    echo WARNING: .env.local file not found!
    echo Please create .env.local file with required environment variables.
    echo.
    echo Required variables:
    echo - NEXT_PUBLIC_ANYTHINGLLM_API_URL
    echo - NEXT_PUBLIC_ANYTHINGLLM_API_KEY
    echo - NEXTAUTH_SECRET
    echo - NEXTAUTH_URL
    echo - GOOGLE_CLIENT_ID
    echo - GOOGLE_CLIENT_SECRET
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /i not "%continue%"=="y" (
        echo Cancelled.
        pause
        exit /b 1
    )
)

echo Stopping existing containers...
docker-compose down

echo.
echo Building and starting containers...
docker-compose up --build -d

if errorlevel 1 (
    echo ERROR: Failed to start Docker containers!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Docker containers started successfully!
echo.
echo Services running:
echo - HWTOLLM Web App: http://localhost:3000
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.

pause
