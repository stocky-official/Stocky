"""
Verify full supplier catalog combining Suppler, Sheet2, and Sheet1
Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
"""

import openpyxl
import re

FILEPATH = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data\Supplier.xlsx"

def build_catalog():
    wb = openpyxl.load_workbook(FILEPATH, read_only=True, data_only=True)

    # 1. Load Sheet2 Name Mappings
    mappings = {} # alias -> canonical
    for row in wb["Sheet2"].iter_rows(values_only=True):
        if row[0] and row[1]:
            alias = str(row[0]).strip()
            canonical = str(row[1]).strip()
            if alias.lower() != "company  name":
                mappings[alias.lower()] = canonical

    # 2. Parse Suppler sheet
    suppliers = {} # canonical_name -> dict
    for i, row in enumerate(wb["Suppler"].iter_rows(values_only=True)):
        if i == 0 or not row[0]:
            continue
        raw_name = str(row[0]).strip()
        norm_key = raw_name.lower()
        canonical_name = mappings.get(norm_key, raw_name)

        if canonical_name not in suppliers:
            suppliers[canonical_name] = {
                "name": canonical_name,
                "categories": set(),
                "contacts": [],
                "items": []
            }

        # Categories
        if row[1]:
            for c in str(row[1]).split(','):
                if c.strip():
                    suppliers[canonical_name]["categories"].add(c.strip())

        # Contact info
        person = str(row[3]).strip() if row[3] is not None else ""
        phone = str(row[4]).strip() if row[4] is not None else ""
        email = str(row[2]).strip() if row[2] is not None else ""

        # Cleaning
        phone = re.sub(r'\b[Oo](\d{9,10})\b', r'0\1', phone)
        if ":" in phone and not person:
            parts = phone.split(":", 1)
            person, phone = parts[0].strip(), parts[1].strip()
        elif ":" in person:
            parts = person.split(":", 1)
            person = parts[0].strip()
            if not phone:
                phone = parts[1].strip()

        suppliers[canonical_name]["contacts"].append({
            "person": person or "Procurement Manager",
            "phone": phone or "—",
            "email": email.strip(';, ') if email else None
        })

    # 3. Parse Sheet1 items
    sheet1_suppliers_count = 0
    items_linked = 0
    items_unlinked = 0

    for i, row in enumerate(wb["Sheet1"].iter_rows(values_only=True)):
        if i == 0 or not row[2]:
            continue
        raw_sup = str(row[2]).strip()
        norm_key = raw_sup.lower()
        canonical_name = mappings.get(norm_key, raw_sup)

        barcode = str(row[0]).strip() if row[0] is not None else None
        dept = str(row[1]).strip() if row[1] is not None else None
        desc = str(row[3]).strip() if row[3] is not None else "Item"

        if canonical_name in suppliers:
            suppliers[canonical_name]["items"].append({
                "name": desc,
                "category": dept,
                "barcode": barcode
            })
            items_linked += 1
        else:
            # Supplier in Sheet1 but not in Directory
            suppliers[canonical_name] = {
                "name": canonical_name,
                "categories": set([dept]) if dept else set(),
                "contacts": [{
                    "person": str(row[5]).strip() if row[5] else "Account Executive",
                    "phone": str(row[6]).strip() if row[6] else "—",
                    "email": str(row[4]).strip() if row[4] else None
                }],
                "items": [{
                    "name": desc,
                    "category": dept,
                    "barcode": barcode
                }]
            }
            items_unlinked += 1

    wb.close()

    print(f"Total Combined Suppliers: {len(suppliers)}")
    print(f"Items linked to existing directory: {items_linked:,}")
    print(f"Items from new suppliers: {items_unlinked:,}")
    print(f"Total supplier items: {items_linked + items_unlinked:,}")

    # Top 10 suppliers by items
    sorted_sups = sorted(suppliers.values(), key=lambda s: len(s["items"]), reverse=True)
    print("\nTop 10 Suppliers with catalog items:")
    for s in sorted_sups[:10]:
        contact = s["contacts"][0]
        print(f" - {s['name']}: {len(s['items']):,} items | Contact: {contact['person']} ({contact['phone']})")

if __name__ == "__main__":
    build_catalog()
