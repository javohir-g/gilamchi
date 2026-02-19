import sys
import os
from sqlalchemy import create_engine, text
from datetime import datetime, timezone

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/gilamchi"

def run_test():
    engine = create_engine(DATABASE_URL)
    debt_id = "8ab28b3d-3d40-4ec0-8e5d-7b57ecb18426"
    
    try:
        with engine.connect() as conn:
            print(f"--- ATTEMPTING TO DELETE DEBT {debt_id} ---")
            
            # 1. Check if it exists
            res = conn.execute(text("SELECT id, debtor_name, deleted_at FROM debts WHERE id = :id"), {"id": debt_id}).fetchone()
            if not res:
                print("Debt not found in DB.")
                return
            
            print(f"Original state: ID={res[0]}, Name={res[1]}, DeletedAt={res[2]}")
            
            # 2. Perform soft delete similar to backend logic
            now = datetime.now(timezone.utc)
            # We don't have a current_user.id here, so we'll just set deleted_at
            conn.execute(
                text("UPDATE debts SET deleted_at = :now WHERE id = :id"),
                {"now": now, "id": debt_id}
            )
            conn.commit()
            print(f"Update executed at {now}")
            
            # 3. Verify
            res_after = conn.execute(text("SELECT id, deleted_at FROM debts WHERE id = :id"), {"id": debt_id}).fetchone()
            print(f"State after update: ID={res_after[0]}, DeletedAt={res_after[1]}")
            
            if res_after[1]:
                print("SUCCESS: Soft delete worked in direct SQL.")
            else:
                print("FAILED: deleted_at is still None.")
                
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    run_test()
