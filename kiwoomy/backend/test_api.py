#!/usr/bin/env python3
"""
Ollama Gemma3:4b API 테스트 스크립트
"""

import requests
import json
import time

def test_health():
    """헬스 체크 테스트"""
    print("🏥 헬스 체크 테스트...")
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 서버 상태: {data}")
            return True
        else:
            print(f"❌ 헬스 체크 실패: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 실패: {e}")
        return False

def test_models():
    """모델 목록 테스트"""
    print("\n📋 모델 목록 테스트...")
    try:
        response = requests.get("http://localhost:8000/models")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 사용 가능한 모델: {data}")
            return True
        else:
            print(f"❌ 모델 목록 조회 실패: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 모델 목록 조회 실패: {e}")
        return False

def test_chat():
    """채팅 테스트"""
    print("\n💬 채팅 테스트...")
    try:
        chat_data = {
            "messages": [
                {"role": "user", "content": "안녕하세요! 간단한 인사말을 해주세요."}
            ],
            "model": "gemma3:4b",
            "stream": False
        }
        
        print("📤 요청 전송 중...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8000/chat",
            json=chat_data,
            timeout=60
        )
        
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 응답 수신 (소요시간: {end_time - start_time:.2f}초)")
            print(f"🤖 AI 응답: {data['response']}")
            return True
        else:
            print(f"❌ 채팅 요청 실패: {response.status_code}")
            print(f"오류 내용: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 채팅 테스트 실패: {e}")
        return False

def main():
    print("🧪 Ollama Gemma3:4b API 테스트를 시작합니다...")
    print("=" * 50)
    
    # 서버가 실행 중인지 확인
    if not test_health():
        print("\n❌ 서버가 실행되지 않았습니다.")
        print("💡 다음 명령어로 서버를 시작해주세요:")
        print("   python run_server.py")
        return
    
    # 모델 확인
    if not test_models():
        print("\n❌ 모델 정보를 가져올 수 없습니다.")
        return
    
    # 채팅 테스트
    if test_chat():
        print("\n🎉 모든 테스트가 성공했습니다!")
        print("✅ API가 정상적으로 작동하고 있습니다.")
    else:
        print("\n❌ 채팅 테스트에 실패했습니다.")
        print("💡 Ollama 서버와 모델이 제대로 설치되어 있는지 확인해주세요.")

if __name__ == "__main__":
    main() 