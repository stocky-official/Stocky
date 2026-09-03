"""
Data Cleaning Prototype for Supplier.xlsx
Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
"""

import openpyxl
import re

FILEPATH = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data\Supplier.xlsx"

def clean_phone(raw_phone):
    if not raw_phone:
        return ""
    val = str(raw_phone).strip()
    # Replace letter O with digit 0
    val = re.sub(r'[Oo]', '0', val)
    # Remove excessive whitespace
    val = re.sub(r'\s+', ' ', val)
    return val

def clean_email(raw_email):
    if not raw_email:
        return ""
    val = str(raw_email).strip()
    # Remove leading/trailing semicolons, commas
    val = val.strip(';, ')
    # Split by semicolon or comma
    emails = [e.strip().replace(' ', '') for e in re.split(r'[;,]', val) if e.strip()]
    # Validate basic email format
    valid_emails = [e for e in emails if '@' in e and '.' in e]
    return ", ".join(valid_emails) if valid_emails else (emails[0] if emails else "")

def parse_contact_and_phone(raw_person, raw_phone):
    person_str = str(raw_person).strip() if raw_person is not None else ""
    phone_str = str(raw_phone).strip() if raw_phone is not None else ""

    # Replace capital O with 0
    person_str = re.sub(r'\b[Oo](\d{9,10})\b', r'0\1', person_str)
    phone_str = re.sub(r'\b[Oo](\d{9,10})\b', r'0\1', phone_str)

    # Case 1: person is empty, but phone has "Name: Phone"
    if (not person_str or person_str.lower() in ['none', 'nan']) and ":" in phone_str:
        parts = phone_str.split(":", 1)
        return parts[0].strip(), clean_phone(parts[1].strip())

    # Case 2: person has "Name: Phone" and phone has "Name: Phone" or is identical
    if ":" in person_str:
        parts = person_str.split(":", 1)
        name = parts[0].strip()
        phone_cand = clean_phone(parts[1].strip())
        if phone_str and ":" in phone_str:
            phone_str = clean_phone(phone_str.split(":", 1)[1].strip())
        final_phone = phone_str if phone_str else phone_cand
        return name, final_phone

    # Case 3: phone has "Name: Phone"
    if ":" in phone_str:
        parts = phone_str.split(":", 1)
        name = person_str if person_str else parts[0].strip()
        phone = clean_phone(parts[1].strip())
        return name, phone

    name = person_str if person_str else "Procurement Manager"
    phone = clean_phone(phone_str) if phone_str else "—"
    return name, phone

def test_cleaning():
    wb = openpyxl.load_workbook(FILEPATH, read_only=True, data_only=True)
    sheet = wb["Suppler"]

    cleaned_suppliers = {}

    for i, row in enumerate(sheet.iter_rows(values_only=True)):
        if i == 0 or not row[0]:
            continue
        raw_company = str(row[0]).strip()
        raw_cat = str(row[1]).strip() if row[1] else ""
        raw_email = row[2]
        raw_person = row[3]
        raw_phone = row[4]

        name, phone = parse_contact_and_phone(raw_person, raw_phone)
        email = clean_email(raw_email)

        # Standardize company name (normalize spacing)
        comp_name = re.sub(r'\s+', ' ', raw_company)

        if comp_name not in cleaned_suppliers:
            cleaned_suppliers[comp_name] = {
                "name": comp_name,
                "categories": set(),
                "contacts": []
            }

        if raw_cat:
            for c in raw_cat.split(','):
                if c.strip():
                    cleaned_suppliers[comp_name]["categories"].add(c.strip())

        cleaned_suppliers[comp_name]["contacts"].append({
            "contact_name": name,
            "contact_phone": phone,
            "contact_email": email
        })

    wb.close()

    print(f"Total cleaned distinct suppliers: {len(cleaned_suppliers)}")
    print("\nSample 15 Cleaned Suppliers:")
    for comp, data in list(cleaned_suppliers.items())[:15]:
        primary_contact = data["contacts"][0]
        cats = ", ".join(sorted(data["categories"]))
        print(f"\n[Company]: '{comp}'")
        print(f"   Categories: {cats}")
        print(f"   Contact: {primary_contact['contact_name']} | Phone: {primary_contact['contact_phone']} | Email: {primary_contact['contact_email']}")
        if len(data["contacts"]) > 1:
            print(f"   (Additional contacts: {len(data['contacts'])-1})")

if __name__ == "__main__":
    test_cleaning()
