"""
Inspect Deelara in Sheet1
Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
"""

import openpyxl

FILEPATH = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data\Supplier.xlsx"
wb = openpyxl.load_workbook(FILEPATH, read_only=True, data_only=True)

contacts = set()
for row in wb["Sheet1"].iter_rows(values_only=True):
    if row[2] and "deelara" in str(row[2]).lower():
        email = str(row[4]).strip() if row[4] else ""
        person = str(row[5]).strip() if row[5] else ""
        phone = str(row[6]).strip() if row[6] else ""
        contacts.add((person, phone, email))

wb.close()
print("Deelara contact rows in Sheet1:", contacts)
