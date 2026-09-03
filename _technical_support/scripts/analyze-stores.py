import openpyxl
import os
import glob

data_dir = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data"
xlsx_files = glob.glob(os.path.join(data_dir, "*.xlsx"))

stores = set()
total_items = 0
companies = set()
files_summary = []

for filepath in xlsx_files:
    filename = os.path.basename(filepath)
    if filename.lower() == "supplier.xlsx":
        continue
    
    category = os.path.splitext(filename)[0]
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    sheet = wb.active
    
    file_rows = 0
    header_found = False
    store_col = 0
    
    for row_idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row_idx == 0 and row[0]:
            companies.add(str(row[0]).strip())
            continue
        
        # Check if row is header
        if not header_found and row[0] and "store" in str(row[0]).lower():
            header_found = True
            continue
        
        if header_found and row[0]:
            stores.add(str(row[0]).strip())
            file_rows += 1
            total_items += 1
            
    wb.close()
    files_summary.append((category, file_rows))

print("Companies found:", companies)
print("Stores found:", stores)
print(f"Total categories/files: {len(files_summary)}")
print(f"Total items across all product files: {total_items}")
print("\nFirst 10 files summary:")
for cat, count in files_summary[:10]:
    print(f" - {cat}: {count} items")
