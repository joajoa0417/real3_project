##### 테마 그룹별 #####``

import time
from PyQt5.QtWidgets import QApplication

class ThemeGroupCollector:
    def __init__(self, ocx, app):
        self.ocx = ocx
        self.app = app
        self.received = False
        self.group_data = []

        self.rqname = "opt90001_req"
        self.app.set_tr_handler(self.rqname, self._receive_tr_data)

    def request_theme_groups(self, date_type="5", search_type="0", theme_name="", stock_code="", rank_type="1"):
        """
        - date_type: "5" → 최근 5일 기준
        - search_type: "0" 전체검색, "1" 테마검색, "2" 종목검색
        - theme_name: 특정 테마명을 검색할 경우 사용
        - stock_code: 종목코드 기반 검색할 경우 사용
        - rank_type: 1:상위수익률, 2:하위수익률, 3:상위등락률, 4:하위등락률
        """
        self.group_data = []
        self.received = False

        print(f"📡 테마그룹 요청 → 날짜:{date_type}, 검색:{search_type}, 테마명:'{theme_name}', 종목코드:'{stock_code}', 정렬:{rank_type}")

        self.ocx.dynamicCall("SetInputValue(QString, QString)", "검색구분", search_type)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "날짜구분", date_type)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "테마명", theme_name)
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "등락수익구분", rank_type)

        self.ocx.dynamicCall(
            "CommRqData(QString, QString, int, QString)",
            self.rqname, "opt90001", 0, "0104"
        )

        while not self.received:
            QApplication.processEvents()
            time.sleep(0.1)

        return self.group_data

    def _receive_tr_data(self, scr_no, rqname, trcode, recordname, prev_next, *args):
        if rqname != self.rqname:
            return

        self.received = True
        count = self.ocx.dynamicCall("GetRepeatCnt(QString, QString)", trcode, rqname)

        print(f"📦 수신된 테마그룹 데이터 개수: {count}")
        
        for i in range(count):
            row = {
                "종목코드": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "종목코드").strip(),
                "테마명": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "테마명").strip(),
                "종목수": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "종목수").strip(),
                "등락기호": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "등락기호").strip(),
                "등락율": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "등락율").strip(),
                "상승종목수": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "상승종목수").strip(),
                "하락종목수": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "하락종목수").strip(),
                "기간수익률": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "기간수익률").strip(),
                "주요종목": self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, i, "주요종목").strip(),
            }
            self.group_data.append(row)
