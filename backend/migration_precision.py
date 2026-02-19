import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def migrate_precision():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()

        print("Updating column precision to DECIMAL(18, 6)...")
        
        commands = [
            # sales
            "ALTER TABLE sales ALTER COLUMN amount TYPE DECIMAL(18, 6);",
            "ALTER TABLE sales ALTER COLUMN profit TYPE DECIMAL(18, 6);",
            "ALTER TABLE sales ALTER COLUMN admin_profit TYPE DECIMAL(18, 6);",
            "ALTER TABLE sales ALTER COLUMN seller_profit TYPE DECIMAL(18, 6);",
            "ALTER TABLE sales ALTER COLUMN exchange_rate TYPE DECIMAL(18, 6);",
            
            # debts
            "ALTER TABLE debts ALTER COLUMN total_amount TYPE DECIMAL(18, 6);",
            "ALTER TABLE debts ALTER COLUMN initial_payment TYPE DECIMAL(18, 6);",
            "ALTER TABLE debts ALTER COLUMN remaining_amount TYPE DECIMAL(18, 6);",
            "ALTER TABLE debts ALTER COLUMN paid_amount TYPE DECIMAL(18, 6);",
            "ALTER TABLE debts ALTER COLUMN exchange_rate TYPE DECIMAL(18, 6);",
            
            # payments
            "ALTER TABLE payments ALTER COLUMN amount TYPE DECIMAL(18, 6);",
            "ALTER TABLE payments ALTER COLUMN exchange_rate TYPE DECIMAL(18, 6);",
            
            # products
            "ALTER TABLE products ALTER COLUMN buy_price TYPE DECIMAL(18, 6);",
            "ALTER TABLE products ALTER COLUMN buy_price_usd TYPE DECIMAL(18, 6);",
            "ALTER TABLE products ALTER COLUMN sell_price TYPE DECIMAL(18, 6);",
            "ALTER TABLE products ALTER COLUMN sell_price_per_meter TYPE DECIMAL(18, 6);",
            
            # expenses
            "ALTER TABLE expenses ALTER COLUMN amount TYPE DECIMAL(18, 6);",
            "ALTER TABLE expenses ALTER COLUMN exchange_rate TYPE DECIMAL(18, 6);"
        ]

        for cmd in commands:
            try:
                cur.execute(cmd)
                print(f"✓ Executed: {cmd[:50]}...")
            except Exception as e:
                print(f"! Failed: {cmd[:50]}... Error: {e}")

        print("\nMigration completed successfully!")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    migrate_precision()
