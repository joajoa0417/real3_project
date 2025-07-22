@echo off
echo ========================================
echo 마이키우Me 백엔드 서버 시작
echo ========================================

echo.
echo 1. 키움증권 서버 시작...
start "키움증권 서버" python server.py

echo.
echo 2. 3초 대기...
timeout /t 3 /nobreak > nul

echo.
echo 3. 통합 API 서버 시작...
start "통합 API 서버" python integrated_server.py

echo.
echo 4. 서버 상태 확인...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo 백엔드 서버 시작 완료!
echo ========================================
echo.
echo 키움증권 서버: localhost:9999
echo 통합 API 서버: localhost:8000
echo.
echo API 엔드포인트:
echo - GET  /health     (서버 상태 확인)
echo - POST /chat       (일반 채팅)
echo - POST /stock-chat (주식 데이터 기반 채팅)
echo - GET  /models     (사용 가능한 모델)
echo.
echo 프론트엔드 앱을 실행하세요!
echo ========================================

pause 