import csv
import json

csv_path = '상장법인목록.csv'
ts_path = 'stockList.ts'

stock_list = []

with open(csv_path, encoding='utf-8-sig', newline='') as f:  # utf-8-sig로 변경!
    reader = csv.DictReader(f)
    print("헤더:", reader.fieldnames)  # 실제 헤더 확인용
    for row in reader:
        name = row['회사명'].strip()
        code = row['종목코드'].strip().zfill(6)
        stock_list.append({'name': name, 'code': code})

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write('export const stockList = ')
    json.dump(stock_list, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f"총 {len(stock_list)}개 종목 변환 완료!")