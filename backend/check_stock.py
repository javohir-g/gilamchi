import sys
import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/gilamchi"

def check_db():
    engine = create_engine(DATABASE_URL)
    try:
        with engine.connect() as conn:
            print("--- ALL PRODUCTS ---")
            query = text("SELECT id, code, type, quantity, remaining_length, total_length, deleted_at FROM products;")
            result = conn.execute(query)
            count = 0
            for row in result:
                count += 1
                status = "DELETED" if row[6] else "ACTIVE"
                print(f"ID: {row[0]}, Code: {row[1]}, Type: {row[2]}, Qty: {row[3]}, RemLen: {row[4]}, TotLen: {row[5]}, Status: {status}")
            
            print(f"\nTotal products found: {count}")
            
            print("\n--- RECENT SALES (Metered) ---")
            query = text("""
                SELECT s.id, p.code, s.quantity, s.amount, s.date 
                FROM sales s 
                JOIN products p ON s.product_id = p.id 
                WHERE p.type::text = 'meter'
                ORDER BY s.date DESC 
                LIMIT 5;
            """)
            result = conn.execute(query)
            for row in result:
                print(f"ID: {row[0]}, Code: {row[1]}, Qty: {row[2]}, Amount: {row[3]}, Date: {row[4]}")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_db()
