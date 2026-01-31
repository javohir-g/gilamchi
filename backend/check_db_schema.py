from app.database import engine
from sqlalchemy import text

def check_debts_table():
    with engine.connect() as conn:
        try:
            print("Columns in 'debts' table:")
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'debts'
                ORDER BY ordinal_position;
            """))
            for row in result:
                print(f"- {row[0]}: {row[1]}")
        except Exception as e:
            print(f"Error checking table: {e}")

if __name__ == "__main__":
    check_debts_table()
