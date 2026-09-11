"""
Distribute 31,488 items across the 3 Circle K branches
Rule 2 Mandate: Resides strictly in _technical_support/scripts/
"""

import os
import psycopg2

DB_URL = os.environ["DATABASE_URL"]

def distribute_items():
    print("--- Distributing items across Circle K branches ---")
    conn = psycopg2.connect(DB_URL, sslmode="require")
    cur = conn.cursor()

    try:
        # Get branches
        cur.execute("SELECT id, name, code FROM public.branches ORDER BY code;")
        branches = cur.fetchall()
        print("Branches found:", branches)

        if len(branches) < 3:
            print("Not enough branches found.")
            return

        b1_id = branches[0][0] # MD-01 Maadi Mobil
        b2_id = branches[1][0] # NC-03 New Cairo (or ZM-02)
        b3_id = branches[2][0] # ZM-02 Zamalek Hub

        # Branch 2 categories (Tech, Automotive, Tobacco, Hot food)
        b2_categories = [
            'AutoMotive', 'Smoking Acc', 'Other Tobacco', 'cigarettes', 
            'Phone acc', 'Burger', 'Crispy Chicken', 'Hot Meal', 'Crepe', 
            'Corn Dog', 'Buckets', 'Delivery', 'Gold Cut', 'IFIX'
        ]

        # Branch 3 categories (Beverages, Sweets, Cafe)
        b3_categories = [
            'package Beverage', 'package Sweet', 'Juice', 'Fountain', 
            'Food Partner 1', 'French Fries', 'Fresh Furits', 'Kahwetek', 
            'Coffe', 'Cake Cup', 'Tart', 'Triple AAA', 'WareHouse Raw Matrial'
        ]

        # Update Branch 2 items
        cur.execute(
            """
            UPDATE public.items 
            SET branch_id = %s 
            WHERE category_name = ANY(%s);
            """,
            (b2_id, b2_categories)
        )
        b2_count = cur.rowcount
        print(f"Assigned {b2_count:,} items to Branch 2 ({branches[1][1]})")

        # Update Branch 3 items
        cur.execute(
            """
            UPDATE public.items 
            SET branch_id = %s 
            WHERE category_name = ANY(%s);
            """,
            (b3_id, b3_categories)
        )
        b3_count = cur.rowcount
        print(f"Assigned {b3_count:,} items to Branch 3 ({branches[2][1]})")

        # Check Branch 1 remaining items
        cur.execute("SELECT COUNT(*) FROM public.items WHERE branch_id = %s;", (b1_id,))
        b1_count = cur.fetchone()[0]
        print(f"Remaining {b1_count:,} items in Branch 1 ({branches[0][1]})")

        conn.commit()
        print("Multi-branch distribution successfully committed!")

    except Exception as e:
        conn.rollback()
        print("Error distributing items:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    distribute_items()
