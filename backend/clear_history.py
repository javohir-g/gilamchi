import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def clear_history():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()

        print("Cleaning history tables (sales, debts, payments, expenses)...")
        
        # Order matters because of foreign keys (payments depend on debts)
        tables = [
            "payments",
            "debts",
            "expenses",
            "sales"
        ]

        for table in tables:
            try:
                cur.execute(f"DELETE FROM {table};")
                print(f"✓ Table {table} cleared")
            except Exception as e:
                print(f"! Table {table} could not be cleared: {e}")
                conn.rollback()

        print("\nSales and debt history cleared successfully!")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    confirm = input("Are you sure you want to clear ALL sales and debt history? (yes/no): ")
    if confirm.lower() == "yes":
        clear_history()
    else:
        print("Aborted.")
