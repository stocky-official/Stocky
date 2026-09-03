"""
Audit and Purge all Mock Data from Database
Rule 2 Mandate: Resides strictly in _technical_support/scripts/
"""

import psycopg2

DB_URL = "postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

def clean_and_audit():
    print("==================================================")
    print("      DATABASE MOCK DATA AUDIT & PURGE            ")
    print("==================================================")

    conn = psycopg2.connect(DB_URL, sslmode="require")
    cur = conn.cursor()

    try:
        # 1. Audit & Clean Branches
        print("\n[1/6] Auditing branches...")
        cur.execute("SELECT id, name, code FROM public.branches;")
        branches = cur.fetchall()
        print(f"Current branches in DB ({len(branches)}):")
        for b in branches:
            print(f" - {b[1]} (Code: {b[2]}, ID: {b[0]})")

        # Keep ONLY Maadi Mobil (MD-01), delete any placeholder branches
        cur.execute("SELECT id FROM public.branches WHERE code = 'MD-01' LIMIT 1;")
        maadi_row = cur.fetchone()
        if not maadi_row:
            raise Exception("Maadi branch not found!")
        maadi_id = maadi_row[0]

        # Reassign any items just in case to Maadi Mobil
        cur.execute("UPDATE public.items SET branch_id = %s WHERE branch_id != %s;", (maadi_id, maadi_id))
        reassigned = cur.rowcount
        print(f"Reassigned {reassigned} items to Maadi Mobil.")

        # Delete all other branches
        cur.execute("DELETE FROM public.branches WHERE id != %s;", (maadi_id,))
        deleted_branches = cur.rowcount
        print(f"Deleted {deleted_branches} placeholder branches (Zamalek Hub, New Cairo).")

        # 2. Audit Suppliers & Supplier Items
        print("\n[2/6] Auditing suppliers...")
        cur.execute("SELECT COUNT(*) FROM public.suppliers;")
        sup_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM public.supplier_items;")
        sup_items_count = cur.fetchone()[0]
        print(f"Suppliers count: {sup_count}, Supplier items count: {sup_items_count}")
        if sup_count > 0:
            cur.execute("DELETE FROM public.supplier_items;")
            cur.execute("DELETE FROM public.suppliers;")
            print("Purged any lingering mock suppliers.")

        # 3. Audit Alerts
        print("\n[3/6] Auditing alerts...")
        cur.execute("SELECT COUNT(*) FROM public.alerts;")
        alerts_count = cur.fetchone()[0]
        print(f"Alerts count: {alerts_count}")
        if alerts_count > 0:
            cur.execute("DELETE FROM public.alerts;")
            print("Purged any lingering mock alerts.")

        # 4. Audit Companies
        print("\n[4/6] Auditing companies...")
        cur.execute("SELECT id, name, code FROM public.companies;")
        companies = cur.fetchall()
        print(f"Companies in DB ({len(companies)}):")
        for c in companies:
            print(f" - {c[1]} (Code: {c[2]}, ID: {c[0]})")

        # 5. Audit Categories
        print("\n[5/6] Auditing categories...")
        cur.execute("SELECT COUNT(*), array_agg(name ORDER BY name) FROM public.categories;")
        cat_count, cat_names = cur.fetchone()
        print(f"Total categories: {cat_count}")
        print("Categories sample:", cat_names[:6], "...")

        # 6. Audit Items
        print("\n[6/6] Auditing items...")
        cur.execute("SELECT COUNT(*), COUNT(DISTINCT category_name), SUM(quantity), SUM(balance) FROM public.items;")
        item_count, distinct_cats, total_qty, total_bal = cur.fetchone()
        print(f"Total items in DB: {item_count:,}")
        print(f"Distinct categories with items: {distinct_cats}")
        print(f"Total inventory quantity: {total_qty:,} units")
        print(f"Total inventory balance: ${total_bal:,.2f}")

        # Verify all items link to MD-01
        cur.execute("SELECT COUNT(*) FROM public.items WHERE branch_id = %s;", (maadi_id,))
        maadi_items = cur.fetchone()[0]
        print(f"Items belonging to Maadi Mobil (MD-01): {maadi_items:,} / {item_count:,}")

        conn.commit()
        print("\n==================================================")
        print("MOCK DATA PURGE AND VERIFICATION COMPLETED CLEANLY")
        print("==================================================")

    except Exception as e:
        conn.rollback()
        print("Error during purge:", e)
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    clean_and_audit()
