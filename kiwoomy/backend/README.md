# Ollama Gemma3:4b Chatbot

Ollama의 Gemma3:4b 모델을 사용하는 채팅봇 API 서버입니다.

## 🚀 빠른 시작

### 1. Ollama 설치
먼저 Ollama를 설치해야 합니다:
- Windows: https://ollama.ai 에서 다운로드
- 또는 PowerShell에서: `winget install Ollama.Ollama`

### 2. Ollama 서버 시작
```bash
ollama serve
```

### 3. Gemma3:4b 모델 설치
```bash
ollama pull gemma3:4b
```

### 4. Python 의존성 설치
```bash
cd chatbot
pip install -r requirements.txt
```

### 5. 서버 실행
```bash
python run_server.py
```

## 📋 API 엔드포인트

### 기본 정보
- **서버 주소**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 엔드포인트 목록

#### 1. 헬스 체크
```
GET /health
```
Ollama 서버 연결 상태를 확인합니다.

#### 2. 모델 목록 조회
```
GET /models
```
사용 가능한 Ollama 모델 목록을 반환합니다.

#### 3. 채팅
```
POST /chat
```
Gemma3:4b 모델과 채팅합니다.

**요청 예시:**
```json
{
  "messages": [
    {"role": "user", "content": "안녕하세요!"}
  ],
  "model": "gemma3:4b",
  "stream": false
}
```

#### 4. 텍스트 생성
```
POST /generate
```
프롬프트를 기반으로 텍스트를 생성합니다.

## 🔧 개발 환경 설정

### 환경 변수
`.env` 파일을 생성하여 설정을 커스터마이즈할 수 있습니다:

```env
OLLAMA_BASE_URL=http://localhost:11434
```

### 로컬 개발
```bash
# 개발 모드로 실행 (자동 리로드)
python run_server.py

# 또는 직접 uvicorn 사용
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📱 프론트엔드 연결

React Native 앱에서 이 API를 사용하려면:

```typescript
const chatWithGemma = async (message: string) => {
  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: message }
        ],
        model: 'gemma3:4b'
      })
    });
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('채팅 오류:', error);
    throw error;
  }
};
```

## 🐛 문제 해결

### 1. Ollama 서버 연결 실패
- Ollama가 설치되어 있는지 확인: `ollama --version`
- Ollama 서버가 실행 중인지 확인: `ollama serve`

### 2. 모델 다운로드 실패
- 인터넷 연결 확인
- 충분한 디스크 공간 확보 (약 2.5GB 필요)
- 방화벽 설정 확인

### 3. API 요청 타임아웃
- 모델 로딩 시간이 길 수 있음 (첫 요청 시)
- GPU 메모리 부족 시 CPU 모드로 전환

## 📊 성능 최적화

### 메모리 사용량
- Gemma3:4b는 약 2.5GB RAM 사용
- GPU 사용 시 더 빠른 응답 속도

### 응답 속도 개선
- 첫 요청 후 모델이 메모리에 로드되어 더 빠름
- 배치 요청으로 처리량 향상 가능

## 🔒 보안 고려사항

- 프로덕션 환경에서는 CORS 설정을 제한하세요
- API 키 인증 추가 고려
- 요청 크기 제한 설정

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 