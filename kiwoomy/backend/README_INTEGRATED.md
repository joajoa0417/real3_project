# 마이키우Me 통합 시스템

프론트엔드(React Native), 백엔드(FastAPI), LLM(Ollama), 키움증권 데이터를 통합한 주식 투자 AI 어시스턴트 시스템입니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   FastAPI       │    │   Ollama        │
│   (프론트엔드)   │◄──►│   (통합 백엔드)  │◄──►│   (LLM)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   키움증권      │
                       │   (데이터)      │
                       └─────────────────┘
```

## 📁 프로젝트 구조

```
chatbotttttttt/
├── chatbot/                    # 통합 백엔드 서버
│   ├── integrated_server.py    # 통합 FastAPI 서버
│   ├── start_integrated_server.bat  # 서버 시작 스크립트
│   └── test_integrated_api.py  # API 테스트 스크립트
├── kda_project2-main/          # React Native 프론트엔드
│   └── MyApp copy/
│       ├── App.tsx
│       ├── MainHome.tsx
│       └── src/components/
│           └── ChatScreen.tsx  # 채팅 인터페이스
└── kiwoom/                     # 키움증권 데이터 서버
    └── server.py               # 소켓 서버
```

## 🚀 시작하기

### 1. 사전 요구사항

- Python 3.8+
- Node.js 16+
- Ollama (gemma3:4b 모델 설치)
- 키움증권 Open API+ (실시간 데이터용)

### 2. 의존성 설치

```bash
# 백엔드 의존성
cd chatbot
pip install -r requirements.txt

# 프론트엔드 의존성
cd ../kda_project2-main
npm install
```

### 3. 서버 실행

#### 방법 1: 배치 파일 사용 (Windows)
```bash
cd chatbot
start_integrated_server.bat
```

#### 방법 2: 수동 실행
```bash
# 1. 키움증권 서버 시작
cd kiwoom
python server.py

# 2. 통합 API 서버 시작 (새 터미널)
cd chatbot
python integrated_server.py
```

### 4. 프론트엔드 실행

```bash
cd kda_project2-main
npx expo start
```

## 🔌 API 엔드포인트

### 기본 정보
- **서버 주소**: `http://localhost:8000`
- **키움증권 서버**: `localhost:9999`

### 엔드포인트 목록

#### 1. 서버 상태 확인
```http
GET /health
```
**응답 예시:**
```json
{
  "status": "healthy",
  "ollama": "connected",
  "kiwoom": "connected"
}
```

#### 2. 사용 가능한 모델 조회
```http
GET /models
```

#### 3. 일반 채팅
```http
POST /chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "주식 투자에 대해 조언해주세요"}
  ],
  "model": "gemma3:4b",
  "stream": false
}
```

#### 4. 주식 데이터 기반 채팅
```http
POST /stock-chat
Content-Type: application/json

{
  "message": "삼성전자 주가 어때?"
}
```

## 💬 사용 예시

### 일반 채팅
```
사용자: "주식 투자 초보자인데 조언해주세요"
AI: "안녕하세요! 주식 투자 초보자를 위한 기본적인 조언을 드릴게요..."
```

### 주식 데이터 기반 채팅
```
사용자: "삼성전자 주가 어때?"
AI: "삼성전자의 최근 1개월 주가 추이를 알려드릴게요. 
     처음 날짜는 2024-01-01일에 75,000원이었고, 
     가장 최근은 2024-02-01일에 78,500원이에요..."
```

```
사용자: "삼성전자 공매도 현황 알려줘"
AI: "삼성전자의 최근 공매도 데이터를 확인해보니..."
```

## 🧪 테스트

API 테스트를 실행하려면:

```bash
cd chatbot
python test_integrated_api.py
```

## 🔧 설정

### 환경 변수
`.env` 파일을 생성하여 설정을 변경할 수 있습니다:

```env
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=gemma3:4b
KIWOOM_HOST=localhost
KIWOOM_PORT=9999
```

### 포트 설정
- **통합 API 서버**: 8000
- **키움증권 서버**: 9999
- **Ollama**: 11434 (기본값)

## 🐛 문제 해결

### 1. 서버 연결 실패
- Ollama가 실행 중인지 확인
- 키움증권 서버가 실행 중인지 확인
- 방화벽 설정 확인

### 2. 주식 데이터 조회 실패
- 키움증권 Open API+ 로그인 확인
- 종목명이 정확한지 확인
- 거래 시간인지 확인

### 3. LLM 응답 느림
- Ollama 모델이 메모리에 로드되었는지 확인
- GPU 가속 사용 권장

## 📝 개발 노트

### 주요 기능
- ✅ 일반 채팅 (Ollama LLM)
- ✅ 주식 데이터 기반 채팅
- ✅ 실시간 주가 조회
- ✅ 공매도 현황 조회
- ✅ 투자자 동향 조회
- ✅ 채팅 히스토리 저장
- ✅ React Native 모바일 앱

### 향후 개선 사항
- [ ] 실시간 주가 알림
- [ ] 포트폴리오 분석
- [ ] 뉴스 감정 분석
- [ ] 차트 이미지 생성
- [ ] 음성 채팅 지원

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다. 실제 투자에 사용하기 전에 충분한 검증이 필요합니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요. 