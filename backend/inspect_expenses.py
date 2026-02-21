from sqlalchemy import create_engine, text
import sys
import os

sys.path.append(os.getcwd())
from app.config import get_settings

def inspect_columns():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'expenses'
        """))
        for row in result:
            print(row)

if __name__ == "__main__":
    inspect_columns()
