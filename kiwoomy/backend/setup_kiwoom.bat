@echo off
echo ========================================
echo 키움증권 Open API+ 설정 가이드
echo ========================================

echo.
echo 1단계: 키움증권 Open API+ 설치 확인
echo ========================================
echo.
echo 키움증권 Open API+가 설치되어 있나요?
echo 1. 키움증권 홈페이지 (https://www.kiwoom.com) 접속
echo 2. Open API+ 신청 및 설치
echo 3. 키움 Open API+ 실행 및 로그인
echo.
pause

echo.
echo 2단계: Python 패키지 설치
echo ========================================
echo.
echo 필요한 Python 패키지를 설치합니다...
pip install PyQt5==5.15.9
pip install python-dateutil==2.8.2
echo.
echo 패키지 설치 완료!
pause

echo.
echo 3단계: 키움증권 API 연결 테스트
echo ========================================
echo.
echo 키움 Open API+가 실행 중이고 로그인되어 있는지 확인하세요.
echo.
python test_kiwoom_connection.py
echo.
pause

echo.
echo 4단계: 서버 실행
echo ========================================
echo.
echo 키움증권 서버를 시작합니다...
start "키움증권 서버" python server.py
echo.
echo 3초 대기...
timeout /t 3 /nobreak > nul
echo.
echo 통합 API 서버를 시작합니다...
start "통합 API 서버" python integrated_server.py
echo.
echo 5초 대기...
timeout /t 5 /nobreak > nul
echo.
echo API 테스트를 실행합니다...
python test_integrated_api.py
echo.
echo ========================================
echo 설정 완료!
echo ========================================
echo.
echo 서버 정보:
echo - 키움증권 서버: localhost:9999
echo - 통합 API 서버: localhost:8000
echo.
echo 프론트엔드 앱을 실행하세요!
echo ========================================
pause 