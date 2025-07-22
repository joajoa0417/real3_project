##### 주가 추이 조회 날짜 코드 #####

import datetime
from dateutil.relativedelta import relativedelta

def get_start_date(label: str) -> str:
    today = datetime.datetime.today()
    if label == "1개월":
        return (today - relativedelta(months=1)).strftime("%Y%m%d")
    elif label == "3개월":
        return (today - relativedelta(months=3)).strftime("%Y%m%d")
    elif label == "6개월":
        return (today - relativedelta(months=6)).strftime("%Y%m%d")
    elif label == "1년":
        return (today - relativedelta(years=1)).strftime("%Y%m%d")
    elif label == "3년":
        return (today - relativedelta(years=3)).strftime("%Y%m%d")
    else:
        # 기본: 1개월
        return (today - relativedelta(months=1)).strftime("%Y%m%d")
