##### 테마 구성 종목 #####

import time
from PyQt5.QtWidgets import QApplication

class ThemeStockCollector:
    def __init__(self, ocx, app):  # app: KiwoomApp 인스턴스
        self.ocx = ocx
        self.app = app
        self.received = False
        self.theme_data = []

        self.rqname = "opt90002_req"  # 고유 RQName
        self.app.set_tr_handler(self.rqname, self._receive_tr_data)  # 중앙 dispatcher에 등록

    def request_theme_stocks(self, theme_code, date_type="5"):
        self.theme_data = []
        self.received = False

        print(f"📡 [테마 요청] theme_code: {theme_code}, date_type: {date_type}")
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "날짜구분", date_type)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", theme_code)
        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            self.rqname, 
            "opt90002",
            0,
            "0103"
        )

        while not self.received:
            QApplication.processEvents()
            time.sleep(0.1)

        return self.theme_data

    def _receive_tr_data(self, scr_no, rqname, trcode, recordname, prev_next, *args):
        print(f"📥 [Theme handler 호출됨] RQName: {rqname}")
        if rqname != self.rqname:
            print("❌ RQName 불일치: Theme handler 무시됨")
            return

        self.received = True
        count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", trcode, rqname)
        print(f"🔢 테마 구성 종목 개수: {count}")

        for i in range(count):
            row = {
                "종목코드": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "종목코드").strip(),
                "종목명": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "종목명").strip(),
                "현재가": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "현재가").strip(),
                "등락기호": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "등락기호").strip(),
                "전일대비": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "전일대비").strip(),
                "등락율": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "등락율").strip(),
                "누적거래량": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "누적거래량").strip(),
                "매도호가": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "매도호가").strip(),
                "매도잔량": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "매도잔량").strip(),
                "매수호가": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "매수호가").strip(),
                "매수잔량": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "매수잔량").strip(),
                "기간수익률n": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "기간수익률n").strip(),
            }
            self.theme_data.append(row)

