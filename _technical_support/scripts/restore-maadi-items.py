import os
import psycopg2

conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode='require')
cur = conn.cursor()

# Find Maadi Mobil Branch
cur.execute("SELECT id, name FROM public.branches WHERE code = 'MD-01';")
branch = cur.fetchone()
print("Found branch:", branch)

if branch:
    maadi_id = branch[0]
    cur.execute("UPDATE public.items SET branch_id = %s;", (maadi_id,))
    print(f"Updated {cur.rowcount:,} items to branch {branch[1]} (MD-01)")
    conn.commit()

# Verify AutoMotive in Maadi Mobil Branch
cur.execute("""
  SELECT b.name, i.category_name, COUNT(i.id), SUM(i.quantity)
  FROM public.items i
  JOIN public.branches b ON i.branch_id = b.id
  WHERE i.category_name = 'AutoMotive'
  GROUP BY b.name, i.category_name;
""")
print("AutoMotive in Maadi:", cur.fetchall())

cur.close()
conn.close()
