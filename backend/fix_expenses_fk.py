from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Fixing expenses foreign key constraints...")
    
    # 1. Drop existing constraints if they exist
    conn.execute(text("ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_staff_id_fkey;"))
    conn.execute(text("ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_staff_id;"))
    
    # 2. Add correct constraint referencing users table
    # staff_id refers to a user with role=seller (staff)
    conn.execute(text("""
        ALTER TABLE expenses 
        ADD CONSTRAINT expenses_staff_id_fkey 
        FOREIGN KEY (staff_id) REFERENCES users(id) 
        ON DELETE SET NULL;
    """))
    
    conn.commit()
    print("Constraints updated successfully.")
    
    # Verify
    print("\nVerified constraints:")
    result = conn.execute(text("""
        SELECT tc.constraint_name, kcu.column_name, ccu.table_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
        WHERE tc.table_name='expenses' AND tc.constraint_type='FOREIGN KEY';
    """))
    for row in result:
        print(row)
