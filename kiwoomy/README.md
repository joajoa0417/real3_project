# 마이키우Me 통합 시스템

프론트엔드(React Native), 백엔드(FastAPI), LLM(Ollama), 키움증권 데이터를 통합한 주식 투자 AI 어시스턴트 시스템입니다.

## 📁 프로젝트 구조

```
chatbotttttttt/
├── backend/                    # 백엔드 서버
│   ├── integrated_server.py    # 통합 FastAPI 서버
│   ├── server.py              # 키움증권 소켓 서버
│   ├── start_server.bat       # 백엔드 서버 시작 스크립트
│   ├── requirements.txt       # Python 의존성
│   └── data/                  # 키움증권 데이터
├── frontend/                   # React Native 프론트엔드
│   ├── MyApp copy/            # Expo 앱
│   │   ├── App.tsx
│   │   ├── MainHome.tsx
│   │   └── src/components/
│   │       └── ChatScreen.tsx
│   └── package.json           # 프론트엔드 의존성
├── llm/                       # LLM 관련 설정
│   ├── ollama_config.json     # Ollama 설정
│   └── install_ollama.md      # Ollama 설치 가이드
└── start_project.bat          # 전체 프로젝트 시작 스크립트
```

## 🚀 빠른 시작

### 1. 사전 요구사항

- **Python 3.8+**
- **Node.js 16+**
- **Ollama** (gemma3:4b 모델 설치)
- **키움증권 Open API+** (실시간 주식 데이터용)

### 2. 의존성 설치

```bash
# 백엔드 의존성
cd backend
pip install -r requirements.txt

# 프론트엔드 의존성
cd ../frontend
npm run install-deps
```

### 3. 키움증권 Open API+ 설정

```bash
# 키움증권 API 설정 가이드 실행
cd backend
setup_kiwoom.bat
```

또는 수동 설정:
1. 키움증권 홈페이지에서 Open API+ 신청
2. 키움 Open API+ 설치 및 로그인
3. 연결 테스트: `python test_kiwoom_connection.py`

### 4. Ollama 설정

```bash
# Ollama 설치 (https://ollama.ai/download)
# 모델 다운로드
ollama pull gemma3:4b

# Ollama 서버 시작
ollama serve
```

### 5. 프로젝트 실행

#### 방법 1: 전체 프로젝트 한 번에 시작
```bash
start_project.bat
```

#### 방법 2: 개별 실행
```bash
# 백엔드 서버
cd backend
start_server.bat

# 프론트엔드 앱 (새 터미널)
cd frontend
npm start
```

## 🔌 API 엔드포인트

### 서버 정보
- **통합 API 서버**: `http://localhost:8000`
- **키움증권 서버**: `localhost:9999`
- **Ollama**: `localhost:11434`

### 주요 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/health` | 서버 상태 확인 |
| GET | `/models` | 사용 가능한 모델 조회 |
| POST | `/chat` | 일반 채팅 |
| POST | `/stock-chat` | 주식 데이터 기반 채팅 |

## 💬 사용 예시

### 일반 채팅
```
사용자: "주식 투자 초보자인데 조언해주세요"
AI: "안녕하세요! 주식 투자 초보자를 위한 기본적인 조언을 드릴게요..."
```

### 주식 데이터 기반 채팅
```
사용자: "삼성전자 주가 어때?"
AI: "삼성전자의 최근 1개월 주가 추이를 알려드릴게요..."
```

```
사용자: "삼성전자 공매도 현황 알려줘"
AI: "삼성전자의 최근 공매도 데이터를 확인해보니..."
```

## 🧪 테스트

```bash
cd backend
python test_integrated_api.py
```

## 🔧 설정

### 환경 변수 (.env)
```env
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=gemma3:4b
KIWOOM_HOST=localhost
KIWOOM_PORT=9999
```

## 🐛 문제 해결

### 1. 서버 연결 실패
- Ollama가 실행 중인지 확인
- 키움증권 서버가 실행 중인지 확인
- 방화벽 설정 확인

### 2. 주식 데이터 조회 실패
- 키움증권 Open API+ 로그인 확인
- 종목명이 정확한지 확인
- 거래 시간인지 확인

### 3. 프론트엔드 실행 실패
- Node.js 버전 확인 (16+)
- npm 캐시 정리: `npm cache clean --force`

## 📝 개발 가이드

### 백엔드 개발
```bash
cd backend
# 서버 실행
python integrated_server.py

# 테스트
python test_integrated_api.py
```

### 프론트엔드 개발
```bash
cd frontend
# 의존성 설치
npm run install-deps

# 개발 서버 시작
npm start
```

### LLM 설정
```bash
cd llm
# Ollama 설정 확인
cat ollama_config.json

# 설치 가이드 참조
cat install_ollama.md
```

## 🎯 주요 기능

- ✅ 일반 채팅 (Ollama LLM)
- ✅ 주식 데이터 기반 채팅
- ✅ 실시간 주가 조회
- ✅ 공매도 현황 조회
- ✅ 투자자 동향 조회
- ✅ 채팅 히스토리 저장
- ✅ React Native 모바일 앱
- ✅ 통합 서버 아키텍처

## 🔮 향후 개선 사항

- [ ] 실시간 주가 알림
- [ ] 포트폴리오 분석
- [ ] 뉴스 감정 분석
- [ ] 차트 이미지 생성
- [ ] 음성 채팅 지원
- [ ] 웹 대시보드

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다. 실제 투자에 사용하기 전에 충분한 검증이 필요합니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요. 