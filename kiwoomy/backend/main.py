import socket
import json
from fastapi import FastAPI, HTTPException, Query, Request, Body
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from pydantic import BaseModel
import httpx
import traceback
import re
import random
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# 설정
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = "gemma3:4b"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def receive_all(sock):
    buffer = b""
    while True:
        part = sock.recv(4096)
        if not part:
            break
        buffer += part
    return buffer.decode()

def format_date(yyyymmdd):
    try:
        return datetime.strptime(yyyymmdd, "%Y%m%d").strftime("%Y-%m-%d")
    except Exception:
        return yyyymmdd

## 주가 일봉 조회
@app.get("/price/{code}")
async def get_price(code: str, period: str = "1개월"):
    try:
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        sock.send(f"{code}|{period}".encode())
        result = receive_all(sock)
        print(f"📥 소켓 응답: {result}")
        data = json.loads(result)

        if "error" in data:
            raise Exception(data["error"])

        # summary 필드: 종목명(한글명)만 표시, 날짜는 YYYY-MM-DD 형식으로 변환
        stock_map = get_stock_name_code_map()
        code_to_name = {v: k for k, v in stock_map.items()}
        stock_name = code_to_name.get(code, code)
        
        if data and isinstance(data, list) and len(data) > 0:
            # 기본 데이터 계산
            oldest = data[0]
            latest = data[-1]
            price_diff = latest['close'] - oldest['close']
            trend = "상승" if price_diff > 0 else ("하락" if price_diff < 0 else "변동 없음")
            percent = round((price_diff / oldest['close']) * 100, 2) if oldest['close'] else 0
            
            # LLM으로 상세 분석 생성
            try:
                prompt = f"""
                다음은 {stock_name}(종목코드: {code})의 주가 데이터입니다. 
                친근하고 자연스러운 한국어로 자세하게 분석해주세요.
                
                ⚠️ 중요: 종목을 언급할 때는 반드시 "{stock_name}"이라는 한글 종목명만 사용하고, 
                종목코드({code})는 절대 사용하지 마세요!
                
                📊 기본 데이터:
                - 기간: {format_date(oldest['date'])} ~ {format_date(latest['date'])}
                - 시작가: {oldest['close']:,}원
                - 최근가: {latest['close']:,}원
                - 변화량: {price_diff:+,}원 ({percent:+.2f}%)
                - 추세: {trend}
                
                📈 전체 데이터: {data}
                
                다음 내용을 포함해서 자연스럽게 설명해주세요:
                1. 전체적인 주가 추세와 특징
                2. 주요 변동점이나 특이사항
                3. 투자자들에게 도움이 되는 인사이트
                4. 향후 주의사항이나 기회요인
                
                친근하고 이해하기 쉽게 설명해주세요. 이모티콘도 적절히 사용하고, 
                실제 투자에 도움이 되는 구체적인 조언을 포함해주세요.
                
                ⚠️ 다시 한 번 강조: 종목을 언급할 때는 반드시 "{stock_name}"이라는 한글 종목명만 사용하고, 
                종목코드({code})는 절대 사용하지 마세요!
                """
                print(f"🤖 LLM 프롬프트 전송 중...")
                response = requests.post("http://localhost:11434/api/generate", 
                                       json={
                                           "model": "gemma3:4b",
                                           "prompt": prompt,
                                           "stream": False
                                       })
                
                print(f"🤖 LLM 응답 상태: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"🤖 LLM 응답: {result}")
                    summary = result.get('response', '').strip()
                    if not summary:
                        print("🤖 LLM 응답이 비어있음, 기본 분석 사용")
                        # 기본 분석 생성
                        start_date = format_date(oldest['date'])
                        end_date = format_date(latest['date'])
                        summary = f"{stock_name}의 주가 데이터를 분석했습니다. {start_date}부터 {end_date}까지 {percent:.2f}% {trend}했습니다."
                    else:
                        print(f"🤖 LLM 분석 완료: {summary[:100]}...")
                else:
                    print(f"🤖 LLM 호출 실패: {response.status_code}")
                    # 기본 분석 생성
                    start_date = format_date(oldest['date'])
                    end_date = format_date(latest['date'])
                    summary = f"{stock_name}의 주가 데이터를 분석했습니다. {start_date}부터 {end_date}까지 {percent:.2f}% {trend}했습니다."
                    
            except Exception as e:
                print(f"LLM 분석 실패: {e}")
                # LLM 실패시 기본 분석 제공
                start_date = format_date(oldest['date'])
                end_date = format_date(latest['date'])
                summary = f"{stock_name}의 주가 데이터를 분석했습니다. {start_date}부터 {end_date}까지 {percent:.2f}% {trend}했습니다."
        else:
            summary = f"{stock_name}의 주가 데이터를 찾을 수 없습니다."

        return JSONResponse(content={"code": code, "period": period, "data": data, "summary": summary})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"수집 실패: {str(e)}")

## 공매도
@app.get("/short/{code}")
def get_short(code: str, start_date: str, end_date: str):
    try:
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        
        # 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
        start_date_formatted = start_date.replace("-", "")
        end_date_formatted = end_date.replace("-", "")
        
        sock.send(f"SHORT|{code}|{start_date_formatted}|{end_date_formatted}".encode())
        result = receive_all(sock)
        print(f"🔍 공매도 원본 응답: {result}")
        data = json.loads(result)
        print(f"🔍 공매도 파싱된 데이터: {data}")
        print(f"🔍 데이터 타입: {type(data)}")
        print(f"🔍 데이터 길이: {len(data) if isinstance(data, list) else 'not list'}")

        if "error" in data:
            raise Exception(data["error"])

        # summary 필드: 종목명(한글명)만 표시, 날짜는 YYYY-MM-DD 형식으로 변환
        stock_map = get_stock_name_code_map()
        code_to_name = {v: k for k, v in stock_map.items()}
        stock_name = code_to_name.get(code, code)
        
        if data and isinstance(data, list) and len(data) > 0:
            oldest = data[0]
            latest = data[-1]
            
            # 공매도 데이터 분석 (실제 데이터 구조에 맞게 수정)
            latest_volume = int(latest.get('공매도량', 0))
            latest_ratio = float(latest.get('매매비중', '0').replace('+', ''))
            oldest_volume = int(oldest.get('공매도량', 0))
            oldest_ratio = float(oldest.get('매매비중', '0').replace('+', ''))
            
            volume_change = latest_volume - oldest_volume
            ratio_change = latest_ratio - oldest_ratio
            
            start_date = format_date(oldest.get('일자', ''))
            end_date = format_date(latest.get('일자', ''))
            
            # LLM을 사용하여 자연스럽고 유동적인 공매도 분석 생성
            try:
                # 기본 통계 계산
                volumes = [int(item.get('공매도량', 0)) for item in data]
                ratios = [float(item.get('매매비중', '0').replace('+', '')) for item in data]
                
                avg_volume = sum(volumes) / len(volumes)
                max_volume = max(volumes)
                min_volume = min(volumes)
                avg_ratio = sum(ratios) / len(ratios)
                
                # LLM 프롬프트 생성
                prompt = f"""
                다음은 {stock_name}(종목코드: {code})의 공매도 데이터입니다. 
                친근하고 자연스러운 한국어로 자세하게 분석해주세요.
                
                ⚠️ 중요: 종목을 언급할 때는 반드시 "{stock_name}"이라는 한글 종목명만 사용하고, 
                종목코드({code})는 절대 사용하지 마세요!
                
                📊 기본 데이터:
                - 기간: {start_date} ~ {end_date}
                - 최근 공매도량: {latest_volume:,}주 (매매비중 {latest_ratio:.2f}%)
                - 시작 공매도량: {oldest_volume:,}주 (매매비중 {oldest_ratio:.2f}%)
                - 변화량: {volume_change:,}주 ({volume_change/oldest_volume*100:.1f}%)
                - 평균 공매도량: {avg_volume:,.0f}주
                - 최대/최소: {max_volume:,}주 / {min_volume:,}주
                - 평균 매매비중: {avg_ratio:.2f}%
                
                📈 전체 데이터: {data}
                
                다음 내용을 포함해서 자연스럽게 설명해주세요:
                1. 전체적인 공매도 추세와 특징
                2. 주요 변화점이나 특이사항
                3. 투자자들에게 도움이 되는 인사이트
                4. 향후 주의사항이나 기회요인
                
                친근하고 이해하기 쉽게 설명해주세요. 이모티콘도 적절히 사용하고, 
                실제 투자에 도움이 되는 구체적인 조언을 포함해주세요.
                
                ⚠️ 다시 한 번 강조: 종목을 언급할 때는 반드시 "{stock_name}"이라는 한글 종목명만 사용하고, 
                종목코드({code})는 절대 사용하지 마세요!
                """
                
                # LLM 호출
                print(f"🤖 LLM 프롬프트 전송 중...")
                response = requests.post("http://localhost:11434/api/generate", 
                                       json={
                                           "model": "gemma3:4b",
                                           "prompt": prompt,
                                           "stream": False
                                       })
                
                print(f"🤖 LLM 응답 상태: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"🤖 LLM 응답: {result}")
                    summary = result.get('response', '').strip()
                    if not summary:
                        print("🤖 LLM 응답이 비어있음, 기본 분석 사용")
                        summary = f"{stock_name}의 공매도 데이터를 분석했습니다. 최근 공매도량은 {latest_volume:,}주(매매비중 {latest_ratio:.2f}%)입니다."
                    else:
                        print(f"🤖 LLM 분석 완료: {summary[:100]}...")
                else:
                    print(f"🤖 LLM 호출 실패: {response.status_code}")
                    summary = f"{stock_name}의 공매도 데이터를 분석했습니다. 최근 공매도량은 {latest_volume:,}주(매매비중 {latest_ratio:.2f}%)입니다."
                    
            except Exception as e:
                print(f"LLM 분석 실패: {e}")
                # LLM 실패시 기본 분석 제공
                summary = f"{stock_name}의 공매도 데이터를 분석했습니다. {start_date}부터 {end_date}까지 공매도량이 {volume_change:,}주 변화했으며, 최근 공매도량은 {latest_volume:,}주(매매비중 {latest_ratio:.2f}%)입니다."
        else:
            summary = f"{stock_name}의 공매도 데이터를 찾을 수 없습니다."

        return JSONResponse(content={"code": code, "start_date": start_date, "end_date": end_date, "data": data, "summary": summary})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"공매도 수집 실패: {str(e)}")

## 테마 구성 종목    
@app.get("/theme/{theme_code}")
def get_theme(theme_code: str, date_type: str = "5"):
    try:
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        sock.send(f"THEME|{theme_code}|{date_type}".encode())
        result = receive_all(sock)
        data = json.loads(result)

        if "error" in data:
            raise Exception(data["error"])

        return JSONResponse(content={"theme_code": theme_code, "date_type": date_type, "data": data})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테마 수집 실패: {str(e)}")
    

## 테마 그룹별 요청
@app.get("/theme-groups")
def get_theme_groups(date_type: str = "5", search_type: str = "0", theme_name: str = "", stock_code: str = "", rank_type: str = "1"):
    try:
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        msg = f"THEMEGROUP|{date_type}|{search_type}|{theme_name}|{stock_code}|{rank_type}"
        print(f"📤 소켓 전송 메시지: {msg}")
        sock.send(msg.encode())
        result = receive_all(sock)
        data = json.loads(result)

        if "error" in data:
            raise Exception(data["error"])

        return JSONResponse(content={"data": data})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테마그룹 수집 실패: {str(e)}")

## 종목별 테마 조회
@app.get("/stock-theme/{code}")
def get_stock_theme(code: str, date_type: str = "5"):
    try:
        # 1단계: 종목코드로 테마 그룹 검색
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        msg = f"THEMEGROUP|{date_type}|1||{code}|1"  # search_type=1 (종목코드 검색)
        print(f"📤 종목 테마 검색 메시지: {msg}")
        sock.send(msg.encode())
        result = receive_all(sock)
        sock.close()
        theme_groups = json.loads(result)
        
        if "error" in theme_groups:
            raise Exception(theme_groups["error"])
        
        print(f"🔍 종목 테마 그룹 응답: {theme_groups}")

        # 종목코드 → 종목명 매핑 준비
        stock_map = get_stock_name_code_map()
        code = code.zfill(6)
        
        # 디버깅: 원본 매핑 데이터 확인
        print(f"🔍 원본 매핑 데이터 샘플: {list(stock_map.items())[:5]}")
        
        # 매핑 방향 확인 및 수정
        if stock_map:
            # 첫 번째 항목으로 데이터 구조 확인
            first_item = list(stock_map.items())[0]
            print(f"🔍 첫 번째 매핑 항목: {first_item}")
            
            # 종목코드가 키인지 값인지 확인
            if len(first_item[0]) == 6 and first_item[0].isdigit():
                # 종목코드가 키인 경우
                code_to_name = stock_map
            else:
                # 종목명이 키인 경우 (기존 로직)
                code_to_name = {v: k for k, v in stock_map.items()}
        else:
            code_to_name = {}
        
        stock_name = code_to_name.get(code, code)
        
        # 디버깅: 종목코드 매핑 상태 확인
        print(f"🔍 종목코드 매핑 상태: {code} -> {stock_name}")
        print(f"🔍 매핑 테이블 크기: {len(stock_map)}")

        # (NEW) 상위 테마 추출 - 기간수익률 기준
        def to_float(x):
            try:
                return float(str(x).replace("+", "").replace("%", ""))
            except:
                return -999

        # 상위 3개 테마만 추림 (혹은 전체 사용하고 싶으면 theme_groups 그대로 사용)
        priority = [g for g in theme_groups if "반도체" in g.get("테마명", "")]
        others   = [g for g in theme_groups if g not in priority]
        top_groups = (priority[:3] + others)[:3]

        theme_stocks = []

        for theme_group in top_groups:
            # 정확한 테마코드 필드 처리
            theme_code = (
                theme_group.get("테마코드")
                or theme_group.get("종목코드")  # 실제로는 여기에 테마코드가 들어옴
                or theme_group.get("code")
                or theme_group.get("CODE")
            )
            theme_code = str(theme_code).strip()
            theme_name = theme_group.get("테마명", "").strip()

            if not theme_code:
                continue

            try:
                sock2 = socket.socket()
                sock2.connect(("localhost", 9999))
                msg2 = f"THEME|{theme_code}|{date_type}"
                sock2.send(msg2.encode())
                result2 = receive_all(sock2)
                sock2.close()

                if result2.strip():
                    theme_detail = json.loads(result2)
                    if isinstance(theme_detail, list) and len(theme_detail) > 0:
                        for stock in theme_detail:
                            stock_code = stock.get("종목코드", "")
                            if stock_code:
                                stock["종목명"] = code_to_name.get(stock_code.zfill(6), stock_code)
                                stock["종목코드"] = stock_code.zfill(6)

                        theme_stocks.append({
                            "테마코드": theme_code,
                            "테마명": theme_name,
                            "종목들": theme_detail,
                            "종목수": len(theme_detail)
                        })

            except Exception as e:
                print(f"❌ 테마 {theme_name} 상세 조회 실패: {e}")
                continue

        # 프롬프트용 테마 요약 생성
        theme_summary = []
        for theme in theme_stocks:
            stock_names = []
            for stock in theme["종목들"][:5]:
                stock_name_detail = stock.get("종목명", "")
                if stock_name_detail:
                    stock_names.append(stock_name_detail)
            
            print(f"🔍 테마 '{theme['테마명']}' 종목들: {stock_names}")
            
            theme_summary.append({
                "테마명": theme["테마명"],
                "종목수": theme["종목수"],
                "주요종목": stock_names
            })

        # LLM 프롬프트 생성
        try:
            prompt = f"""
다음은 {stock_name}(종목코드: {code})이 속한 테마 정보입니다. 
친근하고 자연스러운 한국어로 자세하게 분석해주세요.

⚠️ 중요: 종목을 언급할 때는 반드시 "{stock_name}"이라는 한글 종목명만 사용하고, 
종목코드({code})는 절대 사용하지 마세요!

허용 종목 리스트: {', '.join(stock_names)}

📊 테마 정보 요약:
{theme_summary}

다음 내용을 포함해서 자연스럽게 설명해주세요:
1. {stock_name}이 속한 테마들의 특징과 의미
2. 같은 테마에 속한 주요 종목들과의 연관성
3. 테마 투자 관점에서의 인사이트
4. 투자자들에게 도움이 되는 조언

친근하고 이해하기 쉽게 설명해주세요. 이모티콘도 적절히 사용하고, 
실제 투자에 도움이 되는 구체적인 조언을 포함해주세요.

⚠️ 다시 한 번 강조: 종목을 언급할 때는 반드시 "{stock_name}"이라는 한글 종목명만 사용하고, 
종목코드({code})는 절대 사용하지 마세요!
"""
            response = requests.post("http://localhost:11434/api/generate", 
                                     json={
                                         "model": "gemma3:4b",
                                         "prompt": prompt,
                                         "stream": False
                                     })

            if response.status_code == 200:
                result = response.json()
                summary = result.get('response', '').strip()
                if not summary:
                    summary = f"{stock_name}이 속한 테마 정보를 분석했습니다. 총 {len(theme_stocks)}개의 테마에 속해 있으며, 각 테마별로 다양한 관련 종목들이 있습니다."
            else:
                summary = f"{stock_name}이 속한 테마 정보를 분석했습니다. 총 {len(theme_stocks)}개의 테마에 속해 있으며, 각 테마별로 다양한 관련 종목들이 있습니다."

        except Exception as e:
            print(f"LLM 요약 생성 실패: {e}")
            summary = f"{stock_name}이 속한 테마 정보를 분석했습니다. 총 {len(theme_stocks)}개의 테마에 속해 있으며, 각 테마별로 다양한 관련 종목들이 있습니다."

        response_data = {
            "code": code,
            "stock_name": stock_name,
            "date_type": date_type,
            "theme_groups": top_groups,
            "theme_stocks": theme_stocks,
            "summary": summary
        }

        return JSONResponse(content=response_data)

    except Exception as e:
        print(f"❌ 종목 테마 조회 실패: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"종목 테마 조회 실패: {str(e)}")
        
#############################################################################################

# 철회 LLM URL
LLM_SERVER_URL = "http://localhost:8001/llm/generate"

# 참조자 입력목
class ChatRequest(BaseModel):
    message: str

# 주가 데이터 발출
# CODEMAP 요청
def get_stock_name_code_map() -> dict:
    try:
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        sock.send(b"CODEMAP")
        result = receive_all(sock)
        data = json.loads(result)
        
        # 에러 체크
        if isinstance(data, dict) and 'error' in data:
            print(f"❌ Kiwoom API 에러: {data['error']}")
            return {}
        
        # 데이터 구조 확인
        if not isinstance(data, dict):
            print(f"❌ 예상치 못한 데이터 형식: {type(data)}")
            return {}
            
        return data
    except Exception as e:
        print(f"❌ 종목코드 맵 불러오기 실패: {e}")
        return {}

# 주가 데이터 요청 함수 (이미 존재하는 get_price_data 재사용)
# def get_price_data(code: str, period: str = "1개월") → 있음

# 📌 프롬프트 생성 유틸
def make_price_prompt(stock_name, price_data):
    if not price_data:
        return f"{stock_name}의 주가 데이터를 찾을 수 없습니다."
    
    oldest = price_data[0]
    latest = price_data[-1]
    
    # 기본 통계 계산
    prices = [item['close'] for item in price_data]
    volumes = [item.get('volume', 0) for item in price_data]
    
    price_diff = latest['close'] - oldest['close']
    percent_change = round((price_diff / oldest['close']) * 100, 2) if oldest['close'] else 0
    trend = "상승" if price_diff > 0 else ("하락" if price_diff < 0 else "변동 없음")
    
    max_price = max(prices)
    min_price = min(prices)
    avg_price = sum(prices) / len(prices)
    avg_volume = sum(volumes) / len(volumes) if volumes else 0
    
    start_date = format_date(oldest['date'])
    end_date = format_date(latest['date'])
    
    return f"""
    다음은 {stock_name}의 주가 데이터입니다. 
    친근하고 자연스러운 한국어로 자세하게 분석해주세요.
    
    📊 기본 데이터:
    - 기간: {start_date} ~ {end_date}
    - 시작가: {oldest['close']:,}원
    - 현재가: {latest['close']:,}원
    - 변화: {price_diff:+,}원 ({percent_change:+.2f}%)
    - 추세: {trend}
    - 최고가: {max_price:,}원
    - 최저가: {min_price:,}원
    - 평균가: {avg_price:,.0f}원
    - 평균거래량: {avg_volume:,.0f}주
    
    📈 전체 데이터: {[item for item in price_data if 'code' not in item]}
    
    다음 내용을 포함해서 자연스럽게 설명해주세요:
    1. 전체적인 주가 추세와 특징
    2. 주요 변동점이나 특이사항
    3. 거래량과의 연관성
    4. 투자자들에게 도움이 되는 인사이트
    5. 향후 주의사항이나 기회요인
    
    친근하고 이해하기 쉽게 설명해주세요. 이모티콘도 적절히 사용하고, 
    실제 투자에 도움이 되는 구체적인 조언을 포함해주세요.
    """

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
    
    return (
        f"{stock_name}의 최근 공매도 데이터를 알려줘.\n"
        f"샘플 데이터: {clean_data[:3]}\n"
        f"이 데이터를 바탕으로 공매도 흐름을 요약해서 알려줘."
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
    
    # 데이터 구조 확인 및 요약
    if len(clean_data) > 0:
        latest_data = clean_data[-1]  # 가장 최근 데이터
        oldest_data = clean_data[0]   # 가장 오래된 데이터
        
        # 주요 투자자별 데이터 추출 (실제 데이터 구조에 맞게 조정)
        try:
            # 실제 키움 API 데이터 필드명 사용 (빈 문자열 처리 및 숫자 변환)
            def safe_int(value):
                if not value or value == '':
                    return 0
                return int(str(value).replace(',', ''))
            
            latest_individual = safe_int(latest_data.get('개인', '0'))
            latest_foreign = safe_int(latest_data.get('외국인', '0'))
            latest_institution = safe_int(latest_data.get('기관계', '0'))
            latest_financial = safe_int(latest_data.get('금융투자', '0'))
            latest_insurance = safe_int(latest_data.get('보험', '0'))
            latest_investment = safe_int(latest_data.get('투신', '0'))
            latest_other_financial = safe_int(latest_data.get('기타금융', '0'))
            latest_bank = safe_int(latest_data.get('은행', '0'))
            latest_other_corp = safe_int(latest_data.get('기타법인', '0'))
            
            oldest_individual = safe_int(oldest_data.get('개인', '0'))
            oldest_foreign = safe_int(oldest_data.get('외국인', '0'))
            oldest_institution = safe_int(oldest_data.get('기관계', '0'))
            
            # 최근 3일간의 기관계 동향 분석
            recent_trend = []
            for i in range(min(3, len(clean_data))):
                data = clean_data[-(i+1)]
                trend = safe_int(data.get('기관계', '0'))
                date = data.get('일자', 'N/A')
                recent_trend.append(f"{date}: {trend:+,}주")
            
            return (
                f"{stock_name}의 투자자 기관 동향을 분석해줘.\n"
                f"데이터 기간: {oldest_data.get('일자', 'N/A')} ~ {latest_data.get('일자', 'N/A')}\n"
                f"최근 기관계 순매수: {latest_institution:+,}주\n"
                f"최근 금융투자 순매수: {latest_financial:+,}주\n"
                f"최근 보험 순매수: {latest_insurance:+,}주\n"
                f"최근 투신 순매수: {latest_investment:+,}주\n"
                f"최근 기타금융 순매수: {latest_other_financial:+,}주\n"
                f"최근 은행 순매수: {latest_bank:+,}주\n"
                f"최근 기타법인 순매수: {latest_other_corp:+,}주\n"
                f"최근 3일간 기관계 동향: {', '.join(recent_trend)}\n"
                f"전체 데이터: {clean_data}\n"
                f"이 정보를 바탕으로 {stock_name}의 투자자 동향을 친근하고 이해하기 쉽게 설명해주세요. "
                f"기관계의 매매 패턴과 그 의미를 분석해주세요. "
                f"특히 금융투자, 보험, 투신 등 주요 기관들의 동향도 함께 설명해주세요. "
                f"양수는 매수, 음수는 매도를 의미합니다."
            )
        except:
            # 데이터 구조가 예상과 다를 경우 기본 형태로 처리
            return (
                f"{stock_name}의 투자자 기관 현황을 분석해줘.\n"
                f"데이터 기간: {oldest_data.get('일자', 'N/A')} ~ {latest_data.get('일자', 'N/A')}\n"
                f"전체 데이터: {clean_data}\n"
                f"이 정보를 바탕으로 {stock_name}의 투자자 동향을 친근하고 이해하기 쉽게 설명해주세요."
            )
    
    return (
        f"{stock_name}의 투자자 기관 데이터를 분석해줘.\n"
        f"데이터: {clean_data}\n"
        f"이 정보를 바탕으로 투자자 동향을 요약해서 알려주세요."
    )

def get_price_data(code: str, period: str = "1개월") -> list:
    try:
        sock = socket.socket()
        sock.connect(("localhost", 9999))
        sock.send(f"{code}|{period}".encode())
        result = receive_all(sock)
        print(f"📅 주가 데이터 수신: {result}")
        return json.loads(result)
    except Exception as e:
        print(f"❌ 주가 데이터 수집 실패: {e}")
        return []
    
# 📣 메인 챗 엔드포인트
@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        user_message = req.message.strip()
        stock_map = get_stock_name_code_map()
        matched_name = next((name for name in stock_map if name in user_message), None)

        if not matched_name:
            return {"response": "어떤 종목에 대한 이야기인지 잘 모르겠어요. 종목명을 정확히 입력해 주세요."}

        code = stock_map[matched_name]

        # 분기: 주가 / 공매도 / 수급 / 테마
        if re.search(r"(테마|테마주|관련주|테마별)", user_message):
            # 테마 정보 조회 - 기존 API 활용
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    res = await client.get(f"http://localhost:8000/stock-theme/{code}")
                    if res.status_code == 200:
                        theme_data = res.json()
                        summary = theme_data.get("summary", "")
                        return {"response": summary}
                    else:
                        return {"response": f"{matched_name}의 테마 정보를 조회하는 중 오류가 발생했습니다."}
            except Exception as e:
                print(f"❌ 테마 정보 조회 실패: {e}")
                return {"response": f"{matched_name}의 테마 정보를 조회하는 중 오류가 발생했습니다."}

        elif re.search(r"(주가|가격|차트|그래프)", user_message):
            price_data = get_price_data(code)
            prompt = make_price_prompt(matched_name, price_data)

        elif re.search(r"(공매도|숏)", user_message):
            from_date = (datetime.today() - timedelta(days=10)).strftime("%Y%m%d")
            to_date = datetime.today().strftime("%Y%m%d")
            sock = socket.socket()
            sock.connect(("localhost", 9999))
            sock.send(f"SHORT|{code}|{from_date}|{to_date}".encode())
            result = receive_all(sock)
            short_data = json.loads(result)
            prompt = make_short_prompt(matched_name, short_data)

        elif re.search(r"(수급|기관|외국인|개인)", user_message):
            from_date = (datetime.today() - timedelta(days=10)).strftime("%Y%m%d")
            to_date = datetime.today().strftime("%Y%m%d")
            sock = socket.socket()
            sock.connect(("localhost", 9999))
            sock.send(f"INST|{code}|{from_date}|{to_date}".encode())
            result = receive_all(sock)
            invest_data = json.loads(result)
            prompt = make_invest_prompt(matched_name, invest_data)

        else:
            return {"response": f"{matched_name}에 대해 어떤 정보를 원하시는지 조금 더 구체적으로 말씀해 주세요. 예: 주가, 공매도, 수급, 테마 등"}

        # ✅ LLM 서버 호출
        # 프롬프트에 종목코드 대신 한글명 사용 지시 추가
        enhanced_prompt = f"""
{prompt}

중요: 종목을 언급할 때는 반드시 한글 종목명을 사용하고, 종목코드(숫자)는 사용하지 마세요.
"""
        async with httpx.AsyncClient(timeout=120) as client:
            res = await client.post(LLM_SERVER_URL, json={"prompt": enhanced_prompt})

        try:
            llm_text = res.json().get("response", res.text)
        except Exception:
            llm_text = res.text  # fallback

        return {"response": llm_text}

    except Exception as e:
        print("❌ /chat 처리 중 오류:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"chat 처리 실패: {str(e)}")