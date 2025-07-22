# 키움증권 Open API+ 설정 가이드

## 1. 키움증권 Open API+ 설치

### 1.1 키움증권 계정 생성
- 키움증권 홈페이지 (https://www.kiwoom.com) 접속
- 계정 생성 및 로그인

### 1.2 Open API+ 신청
1. 키움증권 홈페이지 → Open API+ 메뉴
2. "Open API+ 신청" 클릭
3. 약관 동의 및 신청서 작성
4. 신청 완료 후 승인 대기 (보통 1-2일 소요)

### 1.3 Open API+ 설치
1. 승인 완료 후 "Open API+ 다운로드" 클릭
2. 설치 파일 다운로드 및 실행
3. 설치 완료 후 키움 Open API+ 실행

## 2. Python 환경 설정

### 2.1 필요한 패키지 설치
```bash
cd backend
pip install -r requirements.txt
```

### 2.2 추가 패키지 설치
```bash
pip install PyQt5
pip install python-dateutil
```

## 3. 키움증권 로그인 설정

### 3.1 키움 Open API+ 로그인
1. 키움 Open API+ 실행
2. 로그인 (실제 계정으로 로그인)
3. 자동 로그인 설정 (선택사항)

### 3.2 모의투자 설정 (권장)
- 실제 계정 대신 모의투자 계정 사용
- 키움 Open API+ → 모의투자 메뉴에서 설정

## 4. 서버 실행

### 4.1 키움증권 서버 시작
```bash
cd backend
python server.py
```

### 4.2 통합 API 서버 시작
```bash
cd backend
python integrated_server.py
```

## 5. 테스트

### 5.1 API 테스트
```bash
cd backend
python test_integrated_api.py
```

### 5.2 수동 테스트
```python
# Python에서 직접 테스트
import socket
import json

# 종목코드 맵 요청
sock = socket.socket()
sock.connect(("localhost", 9999))
sock.send(b"CODEMAP")
result = sock.recv(4096).decode()
print(json.loads(result))
```

## 6. 문제 해결

### 6.1 로그인 실패
- 키움 Open API+가 실행 중인지 확인
- 실제 계정으로 로그인했는지 확인
- 방화벽 설정 확인

### 6.2 데이터 조회 실패
- 거래 시간인지 확인 (9:00-15:30)
- 종목코드가 정확한지 확인
- API 호출 제한 확인

### 6.3 모듈 오류
```bash
# PyQt5 재설치
pip uninstall PyQt5
pip install PyQt5

# dateutil 설치
pip install python-dateutil
```

## 7. 주의사항

### 7.1 API 사용 제한
- 일일 API 호출 제한 확인
- 과도한 호출 방지
- 모의투자 환경에서 먼저 테스트

### 7.2 보안
- 실제 계정 정보 보호
- API 키 관리
- 로그 파일 정리

## 8. 개발 팁

### 8.1 디버깅
```python
# 로그 레벨 설정
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 8.2 성능 최적화
- 필요한 데이터만 요청
- 캐싱 활용
- 배치 처리 고려 