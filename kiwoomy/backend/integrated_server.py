from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import socket
from typing import List, Optional
import os
from dotenv import load_dotenv
import re
from datetime import datetime, timedelta

load_dotenv()

app = FastAPI(title="마이키우Me 통합 API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 설정
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = "gemma3:4b"
KIWOOM_HOST = "localhost"
KIWOOM_PORT = 9999

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = MODEL_NAME
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    model: str
    usage: Optional[dict] = None

class StockDataRequest(BaseModel):
    message: str

# 키움증권 소켓 통신 함수
def receive_all(sock):
    buffer = b""
    while True:
        part = sock.recv(4096)
        if not part:
            break
        buffer += part
    return buffer.decode()

def get_stock_name_code_map() -> dict:
    try:
        sock = socket.socket()
        sock.connect((KIWOOM_HOST, KIWOOM_PORT))
        sock.send(b"CODEMAP")
        result = receive_all(sock)
        return json.loads(result)
    except Exception as e:
        print(f"❌ 종목코드 맵 불러오기 실패: {e}")
        return {}

def get_price_data(code: str, period: str = "1개월") -> list:
    try:
        sock = socket.socket()
        sock.connect((KIWOOM_HOST, KIWOOM_PORT))
        sock.send(f"{code}|{period}".encode())
        result = receive_all(sock)
        print(f"📅 주가 데이터 수신: {result}")
        return json.loads(result)
    except Exception as e:
        print(f"❌ 주가 데이터 수집 실패: {e}")
        return []

def get_short_data(code: str, start: str, end: str) -> list:
    try:
        sock = socket.socket()
        sock.connect((KIWOOM_HOST, KIWOOM_PORT))
        sock.send(f"SHORT|{code}|{start}|{end}".encode())
        result = receive_all(sock)
        return json.loads(result)
    except Exception as e:
        print(f"❌ 공매도 데이터 수집 실패: {e}")
        return []

def get_invest_data(code: str, from_date: str, to_date: str) -> list:
    try:
        sock = socket.socket()
        sock.connect((KIWOOM_HOST, KIWOOM_PORT))
        sock.send(f"INST|{code}|{from_date}|{to_date}".encode())
        result = receive_all(sock)
        return json.loads(result)
    except Exception as e:
        print(f"❌ 투자자 동향 데이터 수집 실패: {e}")
        return []

# 프롬프트 생성 함수들
def make_price_prompt(stock_name, price_data):
    if not price_data:
        return f"{stock_name}의 주가 데이터를 찾을 수 없습니다."
    
    # 데이터에서 종목코드 제거
    clean_data = []
    for item in price_data:
        clean_item = item.copy()
        if 'code' in clean_item:
            del clean_item['code']
        clean_data.append(clean_item)
    
    oldest = clean_data[0]
    latest = clean_data[-1]
    return (
        f"{stock_name}의 최근 1개월 주가 추이를 알려줘.\n"
        f"처음 날짜는 {oldest['date']}일에 {oldest['close']}원이었고, "
        f"가장 최근은 {latest['date']}일에 {latest['close']}원이야.\n"
        f"전체 데이터: {clean_data}\n"
        f"이 데이터를 바탕으로 간단하고 친절하게 추이를 설명해줘."
    )

def make_short_prompt(stock_name, short_data):
    if not short_data:
        return f"{stock_name}의 공매도 데이터를 찾을 수 없습니다."
    
    # 데이터에서 종목코드 제거
    clean_data = []
    for item in short_data:
        clean_item = item.copy()
        if 'code' in clean_item:
            del clean_item['code']
        clean_data.append(clean_item)
    
    # 데이터 구조 확인 및 요약
    if len(clean_data) > 0:
        latest_data = clean_data[-1]  # 가장 최근 데이터
        oldest_data = clean_data[0]   # 가장 오래된 데이터
        
        return (
            f"{stock_name}의 공매도 현황을 분석해줘.\n"
            f"데이터 기간: {oldest_data.get('date', 'N/A')} ~ {latest_data.get('date', 'N/A')}\n"
            f"최근 공매도 잔고: {latest_data.get('balance', 'N/A')}주\n"
            f"최근 공매도 비율: {latest_data.get('ratio', 'N/A')}%\n"
            f"전체 데이터: {clean_data}\n"
            f"이 정보를 바탕으로 {stock_name}의 공매도 동향을 친근하고 이해하기 쉽게 설명해주세요."
        )
    
    return (
        f"{stock_name}의 공매도 데이터를 분석해줘.\n"
        f"데이터: {clean_data}\n"
        f"이 정보를 바탕으로 공매도 동향을 요약해서 알려주세요."
    )

def make_invest_prompt(stock_name, invest_data):
    if not invest_data:
        return f"{stock_name}의 투자자 기관 데이터를 찾을 수 없습니다."
    
    # 데이터에서 종목코드 제거
    clean_data = []
    for item in invest_data:
        clean_item = item.copy()
        if 'code' in clean_item:
            del clean_item['code']
        clean_data.append(clean_item)
    
    return (
        f"{stock_name}의 투자자 기관 동향을 분석해줘.\n"
        f"전체 데이터: {clean_data}\n"
        f"이 정보를 바탕으로 {stock_name}의 투자자 동향을 친근하고 이해하기 쉽게 설명해주세요. "
        f"기관계의 매매 패턴과 그 의미를 분석해주세요. "
        f"양수는 매수, 음수는 매도를 의미합니다."
    )

@app.get("/")
async def root():
    return {"message": "마이키우Me 통합 API가 실행 중입니다!"}

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    try:
        # Ollama 연결 확인
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_status = "connected" if response.status_code == 200 else "disconnected"
        
        # 키움증권 서버 연결 확인
        try:
            sock = socket.socket()
            sock.connect((KIWOOM_HOST, KIWOOM_PORT))
            sock.close()
            kiwoom_status = "connected"
        except:
            kiwoom_status = "disconnected"
        
        return {
            "status": "healthy" if ollama_status == "connected" and kiwoom_status == "connected" else "unhealthy",
            "ollama": ollama_status,
            "kiwoom": kiwoom_status
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/price/{code}")
async def get_price_data_endpoint(code: str, period: str = "1개월"):
    """주가 데이터 조회"""
    try:
        stock_map = get_stock_name_code_map()
        # 종목코드를 정규화 (6자리로 패딩)
        normalized_code = code.zfill(6)
        
        # 종목명 찾기
        stock_name = None
        for name, stock_code in stock_map.items():
            if stock_code == normalized_code:
                stock_name = name
                break
        
        if not stock_name:
            return {"error": "종목을 찾을 수 없습니다."}
        
        price_data = get_price_data(normalized_code, period)
        
        if not price_data:
            return {"error": "주가 데이터를 가져올 수 없습니다."}
        
        # LLM으로 요약 생성
        prompt = make_price_prompt(stock_name, price_data)
        
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            try:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": MODEL_NAME,
                        "messages": [
                            {"role": "system", "content": "당신은 한국의 증권앱 '마이키우Me'의 금융 전문 AI 어시스턴트입니다. 친근하고 이해하기 쉬운 한국어로 답변해주세요. 종목을 언급할 때는 반드시 한글 종목명을 사용하고, 종목코드(숫자)는 사용하지 마세요."},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        summary = result.get("message", {}).get("content", response.text)
                    except Exception:
                        summary = f"{stock_name}의 주가 데이터를 분석했습니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                else:
                    summary = f"{stock_name}의 주가 데이터를 분석했습니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                    
            except httpx.TimeoutException:
                summary = f"{stock_name}의 주가 데이터를 분석했습니다. 응답 시간이 초과되어 상세 분석을 제공할 수 없습니다."
            except httpx.ConnectError:
                summary = f"{stock_name}의 주가 데이터를 분석했습니다. AI 서버에 연결할 수 없어 상세 분석을 제공할 수 없습니다."
            except Exception as e:
                summary = f"{stock_name}의 주가 데이터를 분석했습니다. 오류가 발생하여 상세 분석을 제공할 수 없습니다: {str(e)}"
        
        return {"summary": summary, "data": price_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"주가 데이터 조회 실패: {str(e)}")

@app.get("/short/{code}")
async def get_short_sale_data_endpoint(code: str, start_date: str = None, end_date: str = None):
    """공매도 데이터 조회"""
    try:
        stock_map = get_stock_name_code_map()
        # 종목코드를 정규화 (6자리로 패딩)
        normalized_code = code.zfill(6)
        
        # 종목명 찾기
        stock_name = None
        for name, stock_code in stock_map.items():
            if stock_code == normalized_code:
                stock_name = name
                break
        
        if not stock_name:
            return {"error": "종목을 찾을 수 없습니다."}
        
        # 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
        start_date_formatted = start_date.replace("-", "")
        end_date_formatted = end_date.replace("-", "")
        
        short_data = get_short_data(normalized_code, start_date_formatted, end_date_formatted)
        
        if not short_data:
            return {"error": "공매도 데이터를 가져올 수 없습니다."}
        
        # LLM으로 요약 생성
        prompt = make_short_prompt(stock_name, short_data)
        
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            try:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": MODEL_NAME,
                        "messages": [
                            {"role": "system", "content": "당신은 한국의 증권앱 '마이키우Me'의 금융 전문 AI 어시스턴트입니다. 친근하고 이해하기 쉬운 한국어로 답변해주세요. 종목을 언급할 때는 반드시 한글 종목명을 사용하고, 종목코드(숫자)는 사용하지 마세요."},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        summary = result.get("message", {}).get("content", response.text)
                    except Exception:
                        summary = f"{stock_name}의 공매도 데이터를 분석했습니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                else:
                    summary = f"{stock_name}의 공매도 데이터를 분석했습니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                    
            except httpx.TimeoutException:
                summary = f"{stock_name}의 공매도 데이터를 분석했습니다. 응답 시간이 초과되어 상세 분석을 제공할 수 없습니다."
            except httpx.ConnectError:
                summary = f"{stock_name}의 공매도 데이터를 분석했습니다. AI 서버에 연결할 수 없어 상세 분석을 제공할 수 없습니다."
            except Exception as e:
                summary = f"{stock_name}의 공매도 데이터를 분석했습니다. 오류가 발생하여 상세 분석을 제공할 수 없습니다: {str(e)}"
        
        return {"summary": summary, "data": short_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"공매도 데이터 조회 실패: {str(e)}")

@app.get("/invest/{code}")
async def get_invest_data_endpoint(code: str, from_date: str = None, to_date: str = None):
    """투자자 기관 데이터 조회"""
    try:
        stock_map = get_stock_name_code_map()
        # 종목코드를 정규화 (6자리로 패딩)
        normalized_code = code.zfill(6)
        
        # 종목명 찾기
        stock_name = None
        for name, stock_code in stock_map.items():
            if stock_code == normalized_code:
                stock_name = name
                break
        
        if not stock_name:
            return {"error": "종목을 찾을 수 없습니다."}
        
        # 날짜가 없으면 기본값 설정 (최근 10일)
        if not from_date or not to_date:
            from_date = (datetime.today() - timedelta(days=10)).strftime("%Y%m%d")
            to_date = datetime.today().strftime("%Y%m%d")
        else:
            # 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
            from_date = from_date.replace("-", "")
            to_date = to_date.replace("-", "")
        
        invest_data = get_invest_data(normalized_code, from_date, to_date)
        
        if not invest_data:
            return {"error": "투자자 기관 데이터를 가져올 수 없습니다."}
        
        # LLM으로 요약 생성
        prompt = make_invest_prompt(stock_name, invest_data)
        
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            try:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": MODEL_NAME,
                        "messages": [
                            {"role": "system", "content": "당신은 한국의 증권앱 '마이키우Me'의 금융 전문 AI 어시스턴트입니다. 친근하고 이해하기 쉬운 한국어로 답변해주세요. 종목을 언급할 때는 반드시 한글 종목명을 사용하고, 종목코드(숫자)는 사용하지 마세요."},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        summary = result.get("message", {}).get("content", response.text)
                    except Exception:
                        summary = f"{stock_name}의 투자자 기관 데이터를 분석했습니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                else:
                    summary = f"{stock_name}의 투자자 기관 데이터를 분석했습니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                    
            except httpx.TimeoutException:
                summary = f"{stock_name}의 투자자 기관 데이터를 분석했습니다. 응답 시간이 초과되어 상세 분석을 제공할 수 없습니다."
            except httpx.ConnectError:
                summary = f"{stock_name}의 투자자 기관 데이터를 분석했습니다. AI 서버에 연결할 수 없어 상세 분석을 제공할 수 없습니다."
            except Exception as e:
                summary = f"{stock_name}의 투자자 기관 데이터를 분석했습니다. 오류가 발생하여 상세 분석을 제공할 수 없습니다: {str(e)}"
        
        return {"summary": summary, "data": invest_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"투자자 기관 데이터 조회 실패: {str(e)}")

@app.get("/models")
async def get_models():
    """사용 가능한 모델 목록 조회"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return {"models": data.get("models", [])}
            else:
                raise HTTPException(status_code=500, detail="Ollama 서버에 연결할 수 없습니다")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 목록 조회 실패: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_with_gemma(request: ChatRequest):
    """Gemma3:4b 모델과 채팅"""
    try:
        # 증권앱용 시스템 프롬프트
        system_prompt = """당신은 한국의 증권앱 '마이키우Me'의 금융 전문 AI 어시스턴트 "키우마이"입니다.

주요 역할:
- 주식 투자 상담 및 정보 제공
- 시장 동향 분석 및 해석
- 투자자 교육 및 가이드
- 리스크 관리 조언

답변 스타일:
- 친근하고 이해하기 쉬운 한국어 사용
- 전문적이면서도 일반인이 이해할 수 있는 설명
- 마지막에 답변내용과 관련하여 추가 질문할만한 프롬프트를 추천

주의사항:
- 개인 투자 결정의 책임은 투자자에게 있음을 명시
- 너무 길지 않게 답변하고, 대신 추가 질문을 유도할 것"""

        # 시스템 프롬프트를 포함한 메시지 구성
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend([{"role": msg.role, "content": msg.content} for msg in request.messages])
        
        # Ollama API 요청 데이터 준비
        ollama_request = {
            "model": request.model,
            "messages": messages,
            "stream": request.stream
        }
        
        # 타임아웃을 30초로 줄이고 연결 타임아웃도 설정
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            try:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json=ollama_request
                )
                
                if response.status_code != 200:
                    # Ollama 서버 오류 시 기본 응답 반환
                    return ChatResponse(
                        response="죄송합니다. AI 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
                        model=request.model,
                        usage=None
                    )
                
                result = response.json()
                
                return ChatResponse(
                    response=result.get("message", {}).get("content", ""),
                    model=result.get("model", request.model),
                    usage=result.get("usage")
                )
                
            except httpx.TimeoutException:
                # 타임아웃 시 기본 응답 반환
                return ChatResponse(
                    response="죄송합니다. 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
                    model=request.model,
                    usage=None
                )
            except httpx.ConnectError:
                # 연결 오류 시 기본 응답 반환
                return ChatResponse(
                    response="죄송합니다. AI 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.",
                    model=request.model,
                    usage=None
                )
            
    except Exception as e:
        # 기타 예외 시 기본 응답 반환
        return ChatResponse(
            response=f"죄송합니다. 오류가 발생했습니다: {str(e)}",
            model=request.model,
            usage=None
        )

@app.post("/stock-chat")
async def stock_chat(request: StockDataRequest):
    """주식 데이터 기반 채팅"""
    try:
        user_message = request.message.strip()
        stock_map = get_stock_name_code_map()
        matched_name = next((name for name in stock_map if name in user_message), None)

        if not matched_name:
            return {"response": "어떤 종목에 대한 이야기인지 잘 모르겠어요. 종목명을 정확히 입력해 주세요."}

        code = stock_map[matched_name]

        # 분기: 주가 / 공매도 / 수급
        if re.search(r"(주가|가격|차트|그래프)", user_message):
            price_data = get_price_data(code)
            prompt = make_price_prompt(matched_name, price_data)

        elif re.search(r"(공매도|숏)", user_message):
            from_date = (datetime.today() - timedelta(days=10)).strftime("%Y%m%d")
            to_date = datetime.today().strftime("%Y%m%d")
            short_data = get_short_data(code, from_date, to_date)
            prompt = make_short_prompt(matched_name, short_data)

        elif re.search(r"(수급|기관|외국인|개인)", user_message):
            from_date = (datetime.today() - timedelta(days=10)).strftime("%Y%m%d")
            to_date = datetime.today().strftime("%Y%m%d")
            invest_data = get_invest_data(code, from_date, to_date)
            prompt = make_invest_prompt(matched_name, invest_data)

        else:
            return {"response": f"{matched_name}에 대해 어떤 정보를 원하시는지 조금 더 구체적으로 말씀해 주세요. 예: 주가, 공매도, 수급 등"}

        # LLM 서버 호출
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            try:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": MODEL_NAME,
                        "messages": [
                            {"role": "system", "content": "당신은 한국의 증권앱 '마이키우Me'의 금융 전문 AI 어시스턴트입니다. 친근하고 이해하기 쉬운 한국어로 답변해주세요. 종목을 언급할 때는 반드시 한글 종목명을 사용하고, 종목코드(숫자)는 사용하지 마세요."},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False
                    }
                )

                if response.status_code == 200:
                    try:
                        result = response.json()
                        llm_text = result.get("message", {}).get("content", response.text)
                    except Exception:
                        llm_text = response.text  # fallback
                else:
                    llm_text = f"{matched_name}에 대한 기본 정보를 제공합니다. AI 서버에 일시적인 문제가 있어 상세 분석을 제공할 수 없습니다."
                    
            except httpx.TimeoutException:
                llm_text = f"{matched_name}에 대한 기본 정보를 제공합니다. 응답 시간이 초과되어 상세 분석을 제공할 수 없습니다."
            except httpx.ConnectError:
                llm_text = f"{matched_name}에 대한 기본 정보를 제공합니다. AI 서버에 연결할 수 없어 상세 분석을 제공할 수 없습니다."
            except Exception as e:
                llm_text = f"{matched_name}에 대한 기본 정보를 제공합니다. 오류가 발생하여 상세 분석을 제공할 수 없습니다: {str(e)}"

        return {"response": llm_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"주식 채팅 처리 실패: {str(e)}")

@app.post("/generate")
async def generate_text(prompt: str, model: str = MODEL_NAME):
    """텍스트 생성 엔드포인트"""
    try:
        ollama_request = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=ollama_request
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Ollama API 오류: {response.text}"
                )
            
            result = response.json()
            return {
                "response": result.get("response", ""),
                "model": result.get("model", model)
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텍스트 생성 실패: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 