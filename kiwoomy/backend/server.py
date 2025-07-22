##### 키움 서버 실행 #####

from kiwoom_app import KiwoomApp
from price_collector import PriceCollector
from short_sale_collector import ShortSaleCollector
from theme_collector import ThemeStockCollector
from theme_group_collector import ThemeGroupCollector
from invest_trend_collector import  InvestorTrendCollector
from get_start_date import get_start_date 

import socket
import json

HOST = 'localhost'
PORT = 9999

app = KiwoomApp()
app.connect()

price = PriceCollector(app.ocx, app) ## 주가 추이
short = ShortSaleCollector(app.ocx, app) ## 공매도 현황
theme = ThemeStockCollector(app.ocx, app) ## 테마 구성 종목
theme_group = ThemeGroupCollector(app.ocx, app) ## 테마 그룹별
inst = InvestorTrendCollector(app.ocx, app) ## 종목별 투자자 기관별 요청

# 종목코드 → 종목명 매핑 생성
raw_name_code_map = price.get_stock_name_code_map()
name_code_map = {code: name for name, code in raw_name_code_map.items()}
print(f"🔧 종목코드 매핑 생성 완료: {len(name_code_map)}개 종목")
print(f"🔧 매핑 샘플: {list(name_code_map.items())[:5]}")

print("✅ Kiwoom 서버 실행됨")

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))
server.listen(5)

def receive_all(conn):
    buffer = b""
    while True:
        part = conn.recv(4096)
        if not part:
            break
        buffer += part
    return buffer.decode()

while True:
    conn, addr = server.accept()
    try:
        msg = conn.recv(1024).decode().strip()
        print(f"[수신된 원본 메시지] {repr(msg)}")
        parts = [p.strip() for p in msg.split("|")]
        print(f"[분해된 parts] {parts}")
        print(f"[명령 분석] 구분자: {parts[0].upper()} / 길이: {len(parts)} / 전체: {parts}")

        if len(parts) == 2:
            code_or_name, label = parts
            code = name_code_map.get(code_or_name.strip(), code_or_name.strip())
            data = price.request_daily_chart(code, get_start_date(label))
        
        elif len(parts) == 4 and parts[0].upper() == "SHORT":
            _, code_or_name, start, end = parts
            resolved_code = name_code_map.get(code_or_name.strip(), code_or_name.strip())
            print(f"[공매도 요청] {code_or_name} → {resolved_code}, 기간: {start} ~ {end}")
            data = short.request_short_trend(resolved_code, start, end)
        
        elif len(parts) == 3 and parts[0].upper() == "THEME":
            _, theme_code, date_type = parts
            print(f"[테마 요청] 코드: {theme_code}, 날짜구분: {date_type}")
            data = theme.request_theme_stocks(theme_code, date_type)

        elif len(parts) == 6 and parts[0].upper() == "THEMEGROUP":
            _, date_type, search_type, theme_name, stock_code, rank_type = parts
            print(f"[테마그룹 요청] 날짜: {date_type}, 검색: {search_type}, 테마명: {theme_name}, 종목코드: {stock_code}, 정렬: {rank_type}")
            data = theme_group.request_theme_groups(
                date_type=date_type,
                search_type=search_type,
                theme_name=theme_name,
                stock_code=stock_code,
                rank_type=rank_type
            )

        elif len(parts) == 4 and parts[0].upper() == "INST":
            _, code_or_name, from_date, to_date = parts
            resolved_code = name_code_map.get(code_or_name.strip(), code_or_name.strip())
            print(f"[기관 수급 요청] 종목: {code_or_name} → {resolved_code}, 기간: {from_date} ~ {to_date}")
            data = inst.request_investor_trend(resolved_code, from_date, to_date)

        elif parts[0].upper() == "CODEMAP":
            print(f"[종목코드 맵 요청]")
            data = name_code_map

        else:
            raise ValueError("지원되지 않는 형식")

        conn.send(json.dumps(data).encode())

    except Exception as e:
        conn.sendall(json.dumps({"error": str(e)}, ensure_ascii=False).encode())

    finally:
        conn.close()