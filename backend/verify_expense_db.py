from app.database import SessionLocal
from app.models.user import User
from app.models.branch import Branch
from app.models.expense import Expense
import uuid
from decimal import Decimal

db = SessionLocal()
try:
    user = db.query(User).first()
    branch = db.query(Branch).first()
    
    if not user or not branch:
        print("Need user and branch in DB.")
    else:
        print(f"Using User: {user.id}, Branch: {branch.id}")
        
        # This mirrors what the API does
        expense = Expense(
            amount=Decimal("123.45"),
            description="DB Verification Test",
            category="branch",
            branch_id=branch.id,
            seller_id=user.id,
            staff_id=user.id # Pointing to user.id as staff_id!
        )
        
        db.add(expense)
        print("Committing...")
        db.commit()
        print("SUCCESS: Expense saved to DB with user.id as staff_id!")
        
except Exception as e:
    db.rollback()
    print(f"FAILED: {e}")
finally:
    db.close()
