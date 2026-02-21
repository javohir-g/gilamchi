from app.database import SessionLocal
from sqlalchemy import text
import time

db = SessionLocal()
try:
    start = time.time()
    print("Executing simple SELECT 1...")
    db.execute(text("SELECT 1"))
    print(f"SELECT 1 took {time.time() - start:.4f}s")
    
    start = time.time()
    print("Executing SELECT COUNT(*) FROM products...")
    count = db.execute(text("SELECT COUNT(*) FROM products")).scalar()
    print(f"COUNT(*) took {time.time() - start:.4f}s. Total products: {count}")
    
except Exception as e:
    print(f"DB Error: {e}")
finally:
    db.close()
