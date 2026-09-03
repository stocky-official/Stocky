import psycopg2
import os

DATABASE_URL = "postgresql://postgres.qwgpykxjzgqbdzakhchm:50yfVTT4uUxVsY1z@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

def main():
    print("1. Connecting to Supabase Postgres...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    print("2. Adding expiry_date column to items table...")
    cur.execute("""
        ALTER TABLE items 
        ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
    """)
    print("   Column added or already exists.")

    print("3. Adding sample expiry_date for BARCODE TEST...")
    cur.execute("""
        UPDATE items 
        SET expiry_date = '2026-12-31 00:00:00+00' 
        WHERE barcode = '62211826';
    """)
    print(f"   Updated {cur.rowcount} row(s).")

    print("4. Verifying column definition...")
    cur.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'expiry_date';
    """)
    col = cur.fetchone()
    print("   Verification:", col)

    cur.close()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    main()
