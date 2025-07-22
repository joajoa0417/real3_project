## 종목별 투자자 기관별

import time
from PyQt5.QtWidgets import QApplication

class InvestorTrendCollector:
    def __init__(self, ocx, app):
        self.ocx = ocx
        self.app = app
        self.received = False
        self.tr_data = []
        self.rqname = "rq_opt10059"

        self.app.set_tr_handler(self.rqname, self._receive_tr_data)

    def request_investor_trend(self, code, from_date, to_date):
        self.received = False
        self.tr_data = []

        self.ocx.dynamicCall("SetInputValue(QString, QString)", "일자", to_date)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "금액수량구분", "1")  # 1: 금액
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "매매구분", "0")      # 0: 순매수
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "단위구분", "1")      # 1: 단주

        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            self.rqname, "opt10059", 0, "0107"
        )

        while not self.received:
            QApplication.processEvents()
            time.sleep(0.1)

        filtered_data = [
        row for row in self.tr_data
        if from_date <= row["일자"] <= to_date
        ]
        print(f"[필터링 전]: {len(self.tr_data)}개 / [필터링 후]: {len(filtered_data)}개")
        if len(filtered_data) < len(self.tr_data):
            print("⚠️ 기간 외 데이터가 있었으나 제거됨")
        return filtered_data

    def _receive_tr_data(self, scr_no, rqname, trcode, recordname, prev_next, *args):
        if rqname != self.rqname:
            return

        count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", trcode, rqname)
        print(f"📥 수신된 데이터 개수: {count}")
        for i in range(count):
            row = {
                "일자": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "일자").strip(),
                "개인": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "개인").strip(),
                "외국인": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "외국인").strip(),
                "기관계": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "기관계").strip(),
                "금융투자": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "금융투자").strip(),
                "보험": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "보험").strip(),
                "투신": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "투신").strip(),
                "기타금융": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "기타금융").strip(),
                "은행": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "은행").strip(),
                "기타법인": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "기타법인").strip()
            }
            print(f"📅 수신: {row['일자']}")
            self.tr_data.append(row)

        self.received = True
