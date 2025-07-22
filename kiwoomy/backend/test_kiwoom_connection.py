#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
키움증권 Open API+ 연결 테스트 스크립트
"""

import sys
import time
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget

class KiwoomConnectionTest:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.login_state = False
        
        # 이벤트 연결
        self.ocx.OnEventConnect.connect(self._on_event_connect)
        
    def test_connection(self):
        """키움증권 API 연결 테스트"""
        print("🔍 키움증권 Open API+ 연결 테스트 시작...")
        
        try:
            # API 버전 확인
            version = self.ocx.dynamicCall("GetAPIModulePath()")
            print(f"✅ API 모듈 경로: {version}")
            
            # 로그인 시도
            print("📡 로그인 시도 중...")
            self.ocx.dynamicCall("CommConnect()")
            
            # 로그인 완료 대기
            self.app.exec_()
            
            if self.login_state:
                print("✅ 로그인 성공!")
                self._test_basic_functions()
            else:
                print("❌ 로그인 실패!")
                print("키움 Open API+가 실행 중이고 로그인되어 있는지 확인하세요.")
                
        except Exception as e:
            print(f"❌ 연결 테스트 실패: {e}")
            print("키움 Open API+가 설치되어 있는지 확인하세요.")
    
    def _on_event_connect(self, err_code):
        """로그인 이벤트 처리"""
        if err_code == 0:
            self.login_state = True
            print("✅ 로그인 이벤트 성공")
        else:
            self.login_state = False
            print(f"❌ 로그인 이벤트 실패 (에러코드: {err_code})")
        self.app.quit()
    
    def _test_basic_functions(self):
        """기본 기능 테스트"""
        print("\n🔧 기본 기능 테스트...")
        
        try:
            # 사용자 정보 조회
            user_id = self.ocx.dynamicCall("GetLoginInfo(QString)", ["USER_ID"])
            user_name = self.ocx.dynamicCall("GetLoginInfo(QString)", ["USER_NAME"])
            account_count = self.ocx.dynamicCall("GetLoginInfo(QString)", ["ACCOUNT_CNT"])
            
            print(f"✅ 사용자 ID: {user_id}")
            print(f"✅ 사용자명: {user_name}")
            print(f"✅ 계좌 개수: {account_count}")
            
            # 계좌 정보 조회
            accounts = self.ocx.dynamicCall("GetLoginInfo(QString)", ["ACCNO"]).split(';')
            print(f"✅ 계좌 목록: {accounts}")
            
            # 서버 정보
            server_gubun = self.ocx.dynamicCall("GetLoginInfo(QString)", ["GetServerGubun"])
            print(f"✅ 서버 구분: {server_gubun}")
            
            print("\n🎉 키움증권 API 연결 테스트 완료!")
            print("이제 서버를 실행할 수 있습니다.")
            
        except Exception as e:
            print(f"❌ 기본 기능 테스트 실패: {e}")

def main():
    """메인 함수"""
    print("=" * 50)
    print("키움증권 Open API+ 연결 테스트")
    print("=" * 50)
    
    # 키움 Open API+ 실행 확인
    print("⚠️  키움 Open API+가 실행 중이고 로그인되어 있는지 확인하세요.")
    input("계속하려면 Enter를 누르세요...")
    
    # 연결 테스트 실행
    test = KiwoomConnectionTest()
    test.test_connection()

if __name__ == "__main__":
    main() 