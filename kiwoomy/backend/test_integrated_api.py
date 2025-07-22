import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """서버 상태 확인"""
    print("🔍 서버 상태 확인...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 서버 상태: {data['status']}")
            print(f"   - Ollama: {data.get('ollama', 'unknown')}")
            print(f"   - 키움증권: {data.get('kiwoom', 'unknown')}")
        else:
            print(f"❌ 서버 상태 확인 실패: {response.status_code}")
    except Exception as e:
        print(f"❌ 서버 연결 실패: {e}")

def test_models():
    """사용 가능한 모델 확인"""
    print("\n🔍 사용 가능한 모델 확인...")
    try:
        response = requests.get(f"{BASE_URL}/models")
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            print(f"✅ 사용 가능한 모델: {len(models)}개")
            for model in models:
                print(f"   - {model.get('name', 'unknown')}")
        else:
            print(f"❌ 모델 목록 조회 실패: {response.status_code}")
    except Exception as e:
        print(f"❌ 모델 조회 실패: {e}")

def test_general_chat():
    """일반 채팅 테스트"""
    print("\n💬 일반 채팅 테스트...")
    try:
        response = requests.post(f"{BASE_URL}/chat", json={
            "messages": [
                {"role": "user", "content": "안녕하세요! 주식 투자에 대해 조언해주세요."}
            ],
            "model": "gemma3:4b",
            "stream": False
        })
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 일반 채팅 성공!")
            print(f"응답: {data['response'][:100]}...")
        else:
            print(f"❌ 일반 채팅 실패: {response.status_code}")
            print(f"오류: {response.text}")
    except Exception as e:
        print(f"❌ 일반 채팅 테스트 실패: {e}")

def test_stock_chat():
    """주식 데이터 기반 채팅 테스트"""
    print("\n📈 주식 데이터 기반 채팅 테스트...")
    
    # 삼성전자 주가 조회 테스트
    test_cases = [
        "삼성전자 주가 어때?",
        "삼성전자 공매도 현황 알려줘",
        "삼성전자 수급 정보 보여줘"
    ]
    
    for i, test_message in enumerate(test_cases, 1):
        print(f"\n테스트 {i}: {test_message}")
        try:
            response = requests.post(f"{BASE_URL}/stock-chat", json={
                "message": test_message
            })
            
            if response.status_code == 200:
                data = response.json()
                print("✅ 주식 채팅 성공!")
                print(f"응답: {data['response'][:100]}...")
            else:
                print(f"❌ 주식 채팅 실패: {response.status_code}")
                print(f"오류: {response.text}")
        except Exception as e:
            print(f"❌ 주식 채팅 테스트 실패: {e}")

def main():
    print("=" * 50)
    print("마이키우Me 통합 API 테스트")
    print("=" * 50)
    
    # 1. 서버 상태 확인
    test_health()
    
    # 2. 모델 확인
    test_models()
    
    # 3. 일반 채팅 테스트
    test_general_chat()
    
    # 4. 주식 데이터 기반 채팅 테스트
    test_stock_chat()
    
    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)

if __name__ == "__main__":
    main() 