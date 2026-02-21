from sqlalchemy import create_engine, inspect
import sys
import os

sys.path.append(os.getcwd())
from app.config import get_settings

def check_expenses():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    if "expenses" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("expenses")]
        print(f"Columns in 'expenses' table: {columns}")
    else:
        print("Table 'expenses' not found!")

if __name__ == "__main__":
    check_expenses()
