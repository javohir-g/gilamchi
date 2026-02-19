import sys
import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/gilamchi"

def check_db():
    engine = create_engine(DATABASE_URL)
    try:
        with engine.connect() as conn:
            print("--- ALL DEBTS (Including Soft-Deleted) ---")
            query = text("SELECT id, debtor_name, total_amount, remaining_amount, deleted_at, deleted_by FROM debts;")
            result = conn.execute(query)
            count = 0
            for row in result:
                count += 1
                status = "DELETED" if row[4] else "ACTIVE"
                print(f"ID: {row[0]}, Debtor: {row[1]}, Total: {row[2]}, Rem: {row[3]}, Status: {status}, DeletedBy: {row[5]}")
            
            print(f"\nTotal debts found: {count}")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_db()
