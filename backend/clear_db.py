import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def clear_database():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()

        # Disable triggers to handle foreign keys during DELETE if needed, 
        # but better to delete in correct order.
        print("Cleaning database tables...")
        
        # Order matters because of foreign keys
        tables = [
            "debt_payments",
            "debts",
            "expenses",
            "sales",
            "staff",
            "basket_items", # if exists
            "products",
            "branch_users", # if exists
            "users",
            "branches",
            "collections",
            "sizes"
        ]

        for table in tables:
            try:
                cur.execute(f"DELETE FROM {table};")
                print(f"✓ Table {table} cleared")
            except Exception as e:
                print(f"! Table {table} could not be cleared (it may not exist or has complex FKs): {e}")
                conn.rollback()

        print("\nDatabase cleared successfully!")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        clear_database()
    else:
        confirm = input("WARNING: This will delete ALL data from the database. Are you sure? (yes/no): ")
        if confirm.lower() == "yes":
            clear_database()
        else:
            print("Aborted.")
