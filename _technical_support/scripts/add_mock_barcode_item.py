import os
import json
import urllib.request
import uuid

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get(endpoint):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{endpoint}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post(endpoint, data):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{endpoint}",
        headers=headers,
        data=json.dumps(data).encode(),
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def main():
    print("1. Fetching active company and branch...")
    companies = get("companies?select=id,name&limit=1")
    if not companies:
        print("No companies found in database!")
        return
    company = companies[0]
    print(f"   Company: {company['name']} ({company['id']})")

    branches = get(f"branches?company_id=eq.{company['id']}&select=id,name&limit=1")
    if not branches:
        branches = get("branches?select=id,name&limit=1")
    branch = branches[0] if branches else None
    if not branch:
        print("No branches found!")
        return
    print(f"   Branch: {branch['name']} ({branch['id']})")

    print("\n2. Checking if barcode 62211826 already exists...")
    existing = get("items?barcode=eq.62211826&select=id,name,barcode")
    if existing:
        print(f"   Item already exists: {existing[0]['name']} (ID: {existing[0]['id']})")
        return

    print("\n3. Inserting mock item 'BARCODE TEST'...")
    new_item = {
        "company_id": company["id"],
        "branch_id": branch["id"],
        "category_name": "Test & QA",
        "name": "BARCODE TEST",
        "barcode": "62211826",
        "quantity": 100,
        "balance": "250.00"
    }

    result = post("items", new_item)
    print("   Inserted successfully!")
    print("   Details:", json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
