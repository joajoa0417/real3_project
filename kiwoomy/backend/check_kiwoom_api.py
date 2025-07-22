#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
키움 API 설치 상태 확인 스크립트
"""

import sys
import os
import winreg

def check_kiwoom_api():
    """키움 API 설치 상태를 확인합니다."""
    print("🔍 키움 API 설치 상태 확인 중...")
    
    # 1. 레지스트리에서 키움 API 확인
    try:
        with winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, "KHOPENAPI.KHOpenAPICtrl.1") as key:
            print("✅ 레지스트리에서 키움 API 발견")
    except FileNotFoundError:
        print("❌ 레지스트리에서 키움 API를 찾을 수 없습니다.")
        return False
    
    # 2. PyQt5 QAxContainer 테스트
    try:
        from PyQt5.QtWidgets import QApplication
        from PyQt5.QAxContainer import QAxWidget
        print("✅ PyQt5 QAxContainer 임포트 성공")
    except ImportError as e:
        print(f"❌ PyQt5 QAxContainer 임포트 실패: {e}")
        return False
    
    # 3. OCX 컨트롤 생성 테스트
    try:
        app = QApplication(sys.argv)
        ocx = QAxWidget()
        ocx.setControl("KHOPENAPI.KHOpenAPICtrl.1")
        print("✅ OCX 컨트롤 생성 성공")
        return True
    except Exception as e:
        print(f"❌ OCX 컨트롤 생성 실패: {e}")
        return False

def install_guide():
    """설치 가이드를 출력합니다."""
    print("\n📋 키움 API 설치 가이드:")
    print("1. 키움증권 Open API+ 다운로드:")
    print("   - 키움증권 홈페이지 → Open API+ → 다운로드")
    print("   - 또는: https://www1.kiwoom.com/h/customer/download/VOpenApiInfoView")
    print("\n2. 설치 후 확인사항:")
    print("   - 키움 Open API+ 로그인 테스트")
    print("   - 자동 로그인 설정 (선택사항)")
    print("\n3. Python 패키지 설치:")
    print("   pip install PyQt5 pywin32")
    print("\n4. 재부팅 후 다시 시도해보세요.")

if __name__ == "__main__":
    print("=" * 50)
    print("키움 API 설치 상태 확인")
    print("=" * 50)
    
    if check_kiwoom_api():
        print("\n🎉 키움 API가 정상적으로 설치되어 있습니다!")
        print("이제 서버를 실행할 수 있습니다.")
    else:
        print("\n⚠️ 키움 API 설치에 문제가 있습니다.")
        install_guide()
    
    print("=" * 50) 