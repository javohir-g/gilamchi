from app.database import engine
from sqlalchemy import text

def fix_history():
    with engine.connect() as conn:
        print("Fixing historical timestamps...")
        try:
            conn.execute(text("UPDATE sales SET date = date + interval '5 hours', created_at = created_at + interval '5 hours', updated_at = updated_at + interval '5 hours'"))
            conn.execute(text("UPDATE products SET created_at = created_at + interval '5 hours', updated_at = updated_at + interval '5 hours'"))
            conn.execute(text("UPDATE users SET created_at = created_at + interval '5 hours', updated_at = updated_at + interval '5 hours'"))
            conn.execute(text("UPDATE branches SET created_at = created_at + interval '5 hours', updated_at = updated_at + interval '5 hours'"))
            conn.commit()
            print("Successfully fixed historical timestamps.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_history()
