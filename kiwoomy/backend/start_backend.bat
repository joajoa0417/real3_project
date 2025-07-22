@echo off
echo 🚀 Ollama Gemma3:4b Chatbot 백엔드 서버를 시작합니다...
echo.

REM Python 환경 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python이 설치되지 않았습니다.
    echo https://python.org 에서 Python을 설치해주세요.
    pause
    exit /b 1
)

REM 의존성 설치 확인
echo 📦 Python 의존성을 확인하고 설치합니다...
pip install -r requirements.txt

echo.
echo 🌐 서버를 시작합니다...
echo 📱 API 문서: http://localhost:8000/docs
echo 🔗 서버 주소: http://localhost:8000
echo ⏹️  서버 중지: Ctrl+C
echo.

python run_server.py

pause 