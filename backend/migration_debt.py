"""
Migration script for Debt table:
- Renames customer_name -> debtor_name
- Renames customer_phone -> phone_number
- Adds order_details column
"""
from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            print("Checking debts table...")
            
            # 1. Rename customer_name to debtor_name
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='debts' AND column_name='customer_name'
            """))
            if result.fetchone():
                print("Renaming debts.customer_name to debts.debtor_name...")
                conn.execute(text("ALTER TABLE debts RENAME COLUMN customer_name TO debtor_name"))
                print("✓ Renamed customer_name to debtor_name")
            else:
                print("ℹ debts.debtor_name already exists or customer_name missing")

            # 2. Rename customer_phone to phone_number
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='debts' AND column_name='customer_phone'
            """))
            if result.fetchone():
                print("Renaming debts.customer_phone to debts.phone_number...")
                conn.execute(text("ALTER TABLE debts RENAME COLUMN customer_phone TO phone_number"))
                print("✓ Renamed customer_phone to phone_number")
            else:
                print("ℹ debts.phone_number already exists or customer_phone missing")

            # 3. Add order_details
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='debts' AND column_name='order_details'
            """))
            if not result.fetchone():
                print("Adding debts.order_details...")
                conn.execute(text("ALTER TABLE debts ADD COLUMN order_details TEXT DEFAULT ''"))
                conn.execute(text("ALTER TABLE debts ALTER COLUMN order_details SET NOT NULL"))
                print("✓ Added order_details column")
            else:
                print("ℹ debts.order_details already exists")

            # 4. Ensure payment_deadline is DATE type (not TIMESTAMP)
            print("Ensuring debts.payment_deadline is DATE type...")
            try:
                conn.execute(text("ALTER TABLE debts ALTER COLUMN payment_deadline TYPE DATE USING payment_deadline::DATE"))
                print("✓ payment_deadline converted to DATE type")
            except Exception as e:
                print(f"ℹ Could not convert payment_deadline (it might already be DATE): {e}")

            conn.commit()
            print("\n✓ Debt migration applied successfully!")
            
            # Final verification
            print("\nCurrent columns in 'debts' table:")
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='debts'
            """))
            for row in result:
                print(f"- {row[0]}")
            
        except Exception as e:
            print(f"✗ Migration error: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("RUNNING DEBT SCHEMA MIGRATION")
    print("=" * 60 + "\n")
    run_migration()
