##### 로그인 #####

import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget

class KiwoomApp:
    def __init__(self):
        self.app = QApplication(sys.argv)
        
        # OCX 컨트롤 생성 및 초기화
        self.ocx = QAxWidget()
        try:
            self.ocx.setControl("KHOPENAPI.KHOpenAPICtrl.1")
            print("✅ 키움 API OCX 초기화 성공")
        except Exception as e:
            print(f"❌ 키움 API OCX 초기화 실패: {e}")
            print("키움 Open API+ 가 설치되어 있는지 확인하세요.")
            sys.exit(1)
        
        self.login_state = False
        self.tr_handlers = {}  # RQName → 콜백함수 저장소

        # 이벤트 연결 (안전한 방식으로)
        try:
            self.ocx.OnEventConnect.connect(self._on_event_connect)
            self.ocx.OnReceiveTrData.connect(self._on_receive_tr_data)
            print("✅ 이벤트 연결 성공")
        except Exception as e:
            print(f"❌ 이벤트 연결 실패: {e}")
            # 대체 방법으로 이벤트 연결
            self._connect_events_alternative()

    def _connect_events_alternative(self):
        """대체 방법으로 이벤트 연결"""
        try:
            # dynamicCall을 사용한 이벤트 연결
            self.ocx.dynamicCall("OnEventConnect(int)", self._on_event_connect)
            self.ocx.dynamicCall("OnReceiveTrData(QString, QString, QString, QString, QString, QString, QString, QString)", 
                                self._on_receive_tr_data)
            print("✅ 대체 방법으로 이벤트 연결 성공")
        except Exception as e:
            print(f"❌ 대체 이벤트 연결도 실패: {e}")

    def connect(self):
        """로그인 연결"""
        try:
            self.ocx.dynamicCall("CommConnect()")
            print("✅ 로그인 요청 전송")
            self.app.exec_()
        except Exception as e:
            print(f"❌ 로그인 요청 실패: {e}")

    def _on_event_connect(self, err_code):
        """로그인 이벤트 핸들러"""
        self.login_state = (err_code == 0)
        if self.login_state:
            print("✅ 로그인 성공")
        else:
            print(f"❌ 로그인 실패 (에러코드: {err_code})")
        self.app.quit()

    def set_tr_handler(self, rqname, handler_func):
        """RQName에 대응하는 핸들러 등록"""
        self.tr_handlers[rqname] = handler_func

    def _on_receive_tr_data(self, scr_no, rqname, trcode, recordname, prev_next, *args):
        """모든 TR 응답을 중앙에서 처리하고 RQName으로 분기"""
        handler = self.tr_handlers.get(rqname)
        if handler:
            handler(scr_no, rqname, trcode, recordname, prev_next, *args)
        else:
            print(f"[⚠️ No handler] {rqname}에 대한 핸들러가 등록되지 않았습니다.")