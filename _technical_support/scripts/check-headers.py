import openpyxl
import os
import glob

data_dir = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data"
xlsx_files = glob.glob(os.path.join(data_dir, "*.xlsx"))

headers_map = {}

for filepath in xlsx_files:
    filename = os.path.basename(filepath)
    if filename.lower() == "supplier.xlsx":
        continue
    
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    sheet = wb.active
    
    for row_idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row[0] and "store" in str(row[0]).lower():
            # Found header
            clean_headers = tuple(str(c).split()[0].strip() if c else "" for c in row[:5])
            headers_map[clean_headers] = headers_map.get(clean_headers, 0) + 1
            break
    wb.close()

print("Distinct header signatures:", headers_map)
