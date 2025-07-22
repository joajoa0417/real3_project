#!/usr/bin/env python3
"""
Ollama Gemma3:4b Chatbot 서버 실행 스크립트
"""

import uvicorn
import sys
import os
import subprocess
import time
import requests

def check_ollama_running():
    """Ollama 서버가 실행 중인지 확인"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_gemma_model():
    """Gemma3:4b 모델이 설치되어 있는지 확인"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            for model in models:
                if "gemma3:4b" in model.get("name", ""):
                    return True
        return False
    except:
        return False

def install_gemma_model():
    """Gemma3:4b 모델 설치"""
    print("🔧 Gemma3:4b 모델을 설치하고 있습니다...")
    try:
        result = subprocess.run(
            ["ollama", "pull", "gemma3:4b"],
            capture_output=True,
            text=True,
            timeout=300  # 5분 타임아웃
        )
        if result.returncode == 0:
            print("✅ Gemma3:4b 모델 설치 완료!")
            return True
        else:
            print(f"❌ 모델 설치 실패: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ 모델 설치 시간 초과")
        return False
    except FileNotFoundError:
        print("❌ Ollama가 설치되지 않았습니다. https://ollama.ai 에서 설치해주세요.")
        return False

def main():
    print("🚀 Ollama Gemma3:4b Chatbot 서버를 시작합니다...")
    
    # Ollama 서버 확인
    print("📡 Ollama 서버 상태 확인 중...")
    if not check_ollama_running():
        print("❌ Ollama 서버가 실행되지 않았습니다.")
        print("💡 다음 명령어로 Ollama를 시작해주세요:")
        print("   ollama serve")
        return
    
    print("✅ Ollama 서버가 실행 중입니다.")
    
    # Gemma3:4b 모델 확인
    print("🔍 Gemma3:4b 모델 확인 중...")
    if not check_gemma_model():
        print("📦 Gemma3:4b 모델이 설치되지 않았습니다.")
        install_choice = input("모델을 설치하시겠습니까? (y/n): ").lower().strip()
        if install_choice == 'y':
            if not install_gemma_model():
                return
        else:
            print("❌ 모델이 필요합니다. 나중에 다시 시도해주세요.")
            return
    else:
        print("✅ Gemma3:4b 모델이 설치되어 있습니다.")
    
    # FastAPI 서버 시작
    print("🌐 FastAPI 서버를 시작합니다...")
    print("📱 API 문서: http://localhost:8000/docs")
    print("🔗 서버 주소: http://localhost:8000")
    print("⏹️  서버 중지: Ctrl+C")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 서버가 종료되었습니다.")
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")

if __name__ == "__main__":
    main() 