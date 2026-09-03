"""
Inspect Sheet2 mappings in data/Supplier.xlsx
Rule 2 Mandate: Resides strictly in _technical_support/scripts/
"""

import openpyxl

FILEPATH = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data\Supplier.xlsx"

wb = openpyxl.load_workbook(FILEPATH, read_only=True, data_only=True)
sheet = wb["Sheet2"]

mappings = []
for row in sheet.iter_rows(values_only=True):
    if row[0] and row[1]:
        mappings.append((str(row[0]).strip(), str(row[1]).strip()))

wb.close()

print(f"Total mappings in Sheet2: {len(mappings)}")
for m in mappings[:20]:
    print(f" - '{m[0]}' -> '{m[1]}'")
