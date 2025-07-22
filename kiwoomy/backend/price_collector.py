##### 기간별 주가 추이 #####

import time
import datetime
from PyQt5.QtWidgets import QApplication

class PriceCollector:
    def __init__(self, ocx, app):
        self.ocx = ocx
        self.app = app
        self.received = False
        self.daily_chart_data = []
        self.prev_next = 0

        self.rqname = "opt10081_req"
        self.app.set_tr_handler(self.rqname, self._receive_tr_data)

    def request_daily_chart(self, code, start_date):
        self.daily_chart_data = []
        self.prev_next = 0

        while True:
            self.received = False
            self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
            self.ocx.dynamicCall("SetInputValue(QString, QString)", "기준일자", datetime.datetime.today().strftime("%Y%m%d"))
            self.ocx.dynamicCall("SetInputValue(QString, QString)", "수정주가구분", "1")
            self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", self.rqname, "opt10081", self.prev_next, "0101")

            while not self.received:
                QApplication.processEvents()
                time.sleep(0.1)

            if self.prev_next != 2:
                break

        return [
            {"date": d[0], "close": d[1]}
            for d in self.daily_chart_data[::-1]
            if d[0] >= start_date
        ]

    def _receive_tr_data(self, scr_no, rqname, trcode, recordname, prev_next, *args):
        if rqname != self.rqname:
            return

        self.prev_next = int(prev_next)
        self.received = True

        cnt = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", trcode, rqname)
        for i in range(cnt):
            date = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "일자").strip()
            close = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "현재가").strip()
            if date and close:
                self.daily_chart_data.append((date, int(close)))

    def get_stock_name_code_map(self):
        name_code_map = {}
        for market in ["0", "10"]:  # 0: 코스피, 10: 코스닥
            codes = self.ocx.dynamicCall("GetCodeListByMarket(QString)", market).split(";")
            for code in codes:
                if not code:
                    continue
                name = self.ocx.dynamicCall("GetMasterCodeName(QString)", code)
                name_code_map[name] = code
        return name_code_map
