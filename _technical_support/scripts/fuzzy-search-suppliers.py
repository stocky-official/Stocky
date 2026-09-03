"""
Fuzzy match suppliers with empty contacts against directory
Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
"""

import openpyxl

FILEPATH = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data\Supplier.xlsx"
wb = openpyxl.load_workbook(FILEPATH, read_only=True, data_only=True)

sups = []
for row in wb["Suppler"].iter_rows(values_only=True):
    if row[0]:
        sups.append(str(row[0]).strip())

wb.close()

# Look for 'deelara', 'azzam', 'trans'
targets = ['deelara', 'delara', 'azzam', 'trans']
for t in targets:
    matches = [s for s in sups if t in s.lower()]
    print(f"Matches for '{t}': {matches}")
