import sys
import os
import uuid
from sqlalchemy import create_engine, text

# Add the current directory to sys.path to import app
sys.path.append(os.getcwd())
from app.config import get_settings

def test_db_insert():
    settings = get_settings()
    print(f"Connecting to: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Get a user and branch
        user = conn.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
        branch = conn.execute(text("SELECT id FROM branches LIMIT 1")).fetchone()
        
        if not user or not branch:
            print("No user or branch found in DB.")
            return
            
        print(f"Using User: {user[0]}, Branch: {branch[0]}")
        
        # Try to insert an expense
        expense_id = uuid.uuid4()
        try:
            conn.execute(text("""
                INSERT INTO expenses (id, amount, description, category, branch_id, seller_id, created_at, updated_at)
                VALUES (:id, 1000.0, 'DB Test Expense', 'branch', :branch_id, :seller_id, NOW(), NOW())
            """), {
                "id": expense_id,
                "branch_id": branch[0],
                "seller_id": user[0]
            })
            conn.commit()
            print("Successfully inserted expense directly into DB.")
            
            # Clean up
            conn.execute(text("DELETE FROM expenses WHERE id = :id"), {"id": expense_id})
            conn.commit()
            print("Cleaned up test expense.")
        except Exception as e:
            print(f"Error inserting expense: {e}")

if __name__ == "__main__":
    test_db_insert()
