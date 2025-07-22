@echo off
echo ========================================
echo 마이키우Me 통합 프로젝트 시작
echo ========================================

echo.
echo 1. 백엔드 서버 시작...
cd backend
start "백엔드 서버" cmd /k "start_server.bat"
cd ..

echo.
echo 2. 5초 대기...
timeout /t 5 /nobreak > nul

echo.
echo 3. 프론트엔드 앱 시작...
cd frontend
start "프론트엔드 앱" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo 프로젝트 시작 완료!
echo ========================================
echo.
echo 서버 정보:
echo - 백엔드: localhost:8000
echo - 키움증권: localhost:9999
echo - Ollama: localhost:11434
echo.
echo 프론트엔드: Expo 개발 서버
echo.
echo 브라우저에서 http://localhost:19006 접속
echo 또는 Expo Go 앱으로 QR코드 스캔
echo ========================================

pause 