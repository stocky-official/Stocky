"""
Seed Script: Import 31,488 real inventory items from Excel files into Supabase Postgres
Rule 2 Mandate: Resides strictly inside _technical_support/scripts/
"""

import os
import glob
import uuid
import openpyxl
import psycopg2
from psycopg2.extras import execute_values

DB_URL = "postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
DATA_DIR = r"c:\Users\abdelrahman.mamdouh_\Desktop\Stocky\data"

def run_seed():
    print("==================================================")
    print("      STOCKY REAL DATA SEEDING (Circle K)         ")
    print("==================================================")

    conn = psycopg2.connect(DB_URL, sslmode="require")
    cur = conn.cursor()

    try:
        # 1. Clear old mock data
        print("\n[1/5] Clearing old mock data...")
        cur.execute("DELETE FROM public.alerts;")
        cur.execute("DELETE FROM public.items;")
        cur.execute("DELETE FROM public.categories;")
        cur.execute("DELETE FROM public.branches;")
        cur.execute("DELETE FROM public.company_users;")
        cur.execute("DELETE FROM public.companies;")
        conn.commit()
        print(" -- Cleared successfully.")

        # 2. Create Company: Circle K
        print("\n[2/5] Creating Company entity: Circle K...")
        company_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO public.companies (id, name, code)
            VALUES (%s, %s, %s)
            RETURNING id;
            """,
            (company_id, "Circle K", "CRK")
        )
        conn.commit()
        print(f" -- Company created: Circle K (ID: {company_id})")

        # 3. Create Branches
        print("\n[3/5] Creating Branches...")
        primary_branch_id = str(uuid.uuid4())
        branch_2_id = str(uuid.uuid4())
        branch_3_id = str(uuid.uuid4())

        branches_to_insert = [
            (
                primary_branch_id,
                company_id,
                "Maadi Mobil Branch",
                "MD-01",
                "Mobil Gas Station, Corniche El Maadi, Cairo",
                "+20 2 2525 8801",
                True
            ),
            (
                branch_2_id,
                company_id,
                "Zamalek Hub",
                "ZM-02",
                "26th of July St, Zamalek, Cairo",
                "+20 2 2736 5520",
                True
            ),
            (
                branch_3_id,
                company_id,
                "New Cairo 5th Settlement",
                "NC-03",
                "Road 90 North, Choueifat Zone, New Cairo",
                "+20 2 2810 4400",
                True
            ),
        ]

        execute_values(
            cur,
            """
            INSERT INTO public.branches (id, company_id, name, code, address, phone, is_active)
            VALUES %s;
            """,
            branches_to_insert
        )
        conn.commit()
        print(f" -- 3 Circle K branches registered (Primary: Maadi Mobil).")

        # 4. Parse all Excel product files
        print("\n[4/5] Parsing 42 product files...")
        xlsx_files = sorted(glob.glob(os.path.join(DATA_DIR, "*.xlsx")))
        
        items_batch = []
        categories_set = set()
        
        for filepath in xlsx_files:
            filename = os.path.basename(filepath)
            if filename.lower() == "supplier.xlsx":
                continue

            category_name = os.path.splitext(filename)[0].strip()
            categories_set.add(category_name)

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

                # Barcode
                raw_barcode = row[1]
                barcode_str = str(raw_barcode).strip() if raw_barcode is not None else None
                if barcode_str and barcode_str.endswith(".0"):
                    barcode_str = barcode_str[:-2]

                # ItemName
                raw_name = row[2]
                name_str = str(raw_name).strip() if raw_name is not None else "Unnamed Item"
                if not name_str:
                    continue

                # Balance
                raw_bal = row[3]
                try:
                    balance_val = float(raw_bal) if raw_bal is not None else 0.0
                except (ValueError, TypeError):
                    balance_val = 0.0

                # Quantity
                raw_qty = row[4]
                try:
                    qty_val = int(float(raw_qty)) if raw_qty is not None else 0
                except (ValueError, TypeError):
                    qty_val = 0

                item_id = str(uuid.uuid4())
                items_batch.append((
                    item_id,
                    company_id,
                    primary_branch_id,
                    category_name,
                    name_str[:250],
                    barcode_str[:100] if barcode_str else None,
                    balance_val,
                    qty_val
                ))

            wb.close()
            print(f"  -- Loaded: {category_name.ljust(25)} (Total items so far: {len(items_batch):,})")

        # 5. Insert Categories
        print(f"\n[5/5] Inserting {len(categories_set)} categories...")
        cat_records = [(str(uuid.uuid4()), company_id, cat) for cat in categories_set]
        execute_values(
            cur,
            """
            INSERT INTO public.categories (id, company_id, name)
            VALUES %s;
            """,
            cat_records
        )
        conn.commit()
        print(f" -- Categories inserted.")

        # 6. Bulk Insert Items in chunks of 5000
        print(f"\n[6/6] Inserting {len(items_batch):,} real items into database...")
        chunk_size = 5000
        total_inserted = 0

        for i in range(0, len(items_batch), chunk_size):
            chunk = items_batch[i : i + chunk_size]
            execute_values(
                cur,
                """
                INSERT INTO public.items (
                    id, company_id, branch_id, category_name, name, barcode, balance, quantity
                )
                VALUES %s;
                """,
                chunk
            )
            conn.commit()
            total_inserted += len(chunk)
            print(f"  -- Progress: {total_inserted:,} / {len(items_batch):,} items inserted...")

        print("\n==================================================")
        print(f"🎉 SUCCESS: {total_inserted:,} items successfully seeded!")
        print("==================================================")

    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to seed real data: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_seed()
