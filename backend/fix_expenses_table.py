from sqlalchemy import create_engine, text
import sys
import os

# Add the current directory to sys.path to import app
sys.path.append(os.getcwd())

from app.config import get_settings

def fix_expenses_schema():
    settings = get_settings()
    print(f"Connecting to database at {settings.DATABASE_URL}...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking columns in 'expenses' table...")
        
        # Define columns that might be missing
        potential_columns = [
            ("category", "VARCHAR", "DEFAULT 'branch'"),
            ("staff_id", "UUID", "REFERENCES staff(id)"),
            ("exchange_rate", "DECIMAL(18, 6)", "DEFAULT 12200.0"),
            ("is_usd", "BOOLEAN", "DEFAULT FALSE")
        ]
        
        for col_name, col_type, col_extra in potential_columns:
            try:
                # Catch exception if column already exists
                print(f"Attempting to add column '{col_name}'...")
                conn.execute(text(f"ALTER TABLE expenses ADD COLUMN IF NOT EXISTS {col_name} {col_type} {col_extra};"))
                print(f"Column '{col_name}' checked/added.")
            except Exception as e:
                print(f"Error adding column '{col_name}': {e}")
        
        conn.commit()
        print("Expenses table schema check/fix complete.")

if __name__ == "__main__":
    fix_expenses_schema()
