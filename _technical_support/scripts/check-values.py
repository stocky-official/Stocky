import openpyxl
import os
import glob

data_dir = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data"
xlsx_files = glob.glob(os.path.join(data_dir, "*.xlsx"))

non_zero_qty = 0
non_zero_bal = 0
total_items = 0

for filepath in xlsx_files:
    if os.path.basename(filepath).lower() == "supplier.xlsx":
        continue
    
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    sheet = wb.active
    header_found = False
    
    for row in sheet.iter_rows(values_only=True):
        if not header_found:
            if row[0] and "store" in str(row[0]).lower():
                header_found = True
            continue
        
        if row[0] is None and row[1] is None and row[2] is None:
            continue
            
        total_items += 1
        bal = row[3]
        qty = row[4]
        
        try:
            if bal and float(bal) > 0:
                non_zero_bal += 1
        except:
            pass
            
        try:
            if qty and float(qty) > 0:
                non_zero_qty += 1
        except:
            pass
            
    wb.close()

print(f"Total items: {total_items}")
print(f"Items with Balance > 0: {non_zero_bal}")
print(f"Items with Quantity > 0: {non_zero_qty}")
