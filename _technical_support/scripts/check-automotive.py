import psycopg2
import os

conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode='require')
cur = conn.cursor()

cur.execute("""
  SELECT b.name, b.code, count(i.id) 
  FROM public.items i 
  JOIN public.branches b ON i.branch_id = b.id 
  WHERE i.category_name = 'AutoMotive' 
  GROUP BY b.name, b.code;
""")
print('AutoMotive branch breakdown:', cur.fetchall())

cur.execute("""
  SELECT b.name, b.code, count(i.id) 
  FROM public.items i 
  JOIN public.branches b ON i.branch_id = b.id 
  GROUP BY b.name, b.code;
""")
print('Total items per branch:', cur.fetchall())

cur.close()
conn.close()
