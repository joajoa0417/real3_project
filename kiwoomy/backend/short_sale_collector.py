##### 공매도 #####

import time
from PyQt5.QtWidgets import QApplication

class ShortSaleCollector:
    def __init__(self, ocx, app):
        self.ocx = ocx
        self.app = app
        self.received = False
        self.short_data = []

        self.rqname = "opt10014_req"
        self.app.set_tr_handler(self.rqname, self._receive_tr_data)

    def request_short_trend(self, code, start_date, end_date):
        self.short_data = []
        self.received = False

        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", code)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "시간구분", "1")
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "시작일자", start_date)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종료일자", end_date)
        self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", self.rqname, "opt10014", 0, "0102")

        while not self.received:
            QApplication.processEvents()
            time.sleep(0.1)

        return self.short_data[::-1]

    def _receive_tr_data(self, scr_no, rqname, trcode, recordname, prev_next, *args):
        if rqname != self.rqname:
            return

        self.received = True
        count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", trcode, rqname)
        for i in range(count):
            row = {
                "일자": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "일자").strip(),
                "종가": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "종가").strip(),
                "공매도량": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "공매도량").strip(),
                "매매비중": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "매매비중").strip(),
                "공매도거래대금": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "공매도거래대금").strip(),
                "공매도평균가": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "공매도평균가").strip()
            }
            self.short_data.append(row)