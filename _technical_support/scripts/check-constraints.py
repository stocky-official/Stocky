import openpyxl
import os
import glob

data_dir = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data"
xlsx_files = glob.glob(os.path.join(data_dir, "*.xlsx"))

max_name_len = 0
max_barcode_len = 0
max_category_len = 0
longest_name = ""

for filepath in xlsx_files:
    filename = os.path.basename(filepath)
    if filename.lower() == "supplier.xlsx":
        continue
    
    category = os.path.splitext(filename)[0]
    max_category_len = max(max_category_len, len(category))
    
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
            
        barcode = str(row[1]) if row[1] is not None else ""
        name = str(row[2]) if row[2] is not None else ""
        
        if len(name) > max_name_len:
            max_name_len = len(name)
            longest_name = name
            
        if len(barcode) > max_barcode_len:
            max_barcode_len = len(barcode)
            
    wb.close()

print(f"Max category length: {max_category_len}")
print(f"Max barcode length: {max_barcode_len}")
print(f"Max item name length: {max_name_len}")
print(f"Longest name: '{longest_name}'")
