# Ollama 설치 및 설정 가이드

## 1. Ollama 설치

### Windows
```bash
# Windows용 Ollama 다운로드 및 설치
# https://ollama.ai/download 에서 다운로드
```

### macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 2. 모델 다운로드

```bash
# Gemma3:4b 모델 다운로드
ollama pull gemma3:4b

# 모델 목록 확인
ollama list
```

## 3. Ollama 서버 시작

```bash
# Ollama 서버 시작
ollama serve

# 새 터미널에서 모델 테스트
ollama run gemma3:4b "안녕하세요"
```

## 4. 설정 확인

- **기본 URL**: http://localhost:11434
- **모델**: gemma3:4b
- **API 엔드포인트**: /api/chat, /api/generate

## 5. 성능 최적화

### GPU 가속 (권장)
```bash
# CUDA 지원 확인
nvidia-smi

# GPU 메모리 확인
ollama ps
```

### 메모리 설정
```bash
# 모델을 메모리에 로드
ollama run gemma3:4b
```

## 6. 문제 해결

### 모델 다운로드 실패
```bash
# 캐시 정리
ollama rm gemma3:4b
ollama pull gemma3:4b
```

### 메모리 부족
- 더 작은 모델 사용 (gemma3:2b)
- GPU 메모리 확인
- 시스템 메모리 확인 