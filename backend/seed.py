from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.branch import Branch
from app.utils.security import get_password_hash
import uuid

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if data exists
    if db.query(User).first():
        print("Data already seeded.")
        return

    # Create Branches
    branches = [
        Branch(name="Chilonzor filiali"),
        Branch(name="Sergeli filiali"),
        Branch(name="Yunusobod filiali")
    ]
    db.add_all(branches)
    db.commit()
    for b in branches: 
        db.refresh(b)
    
    # Create Admin
    admin = User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        can_add_products=True
    )
    db.add(admin)
    
    # Create Sellers
    print(f"Creating seller for branch: {branches[0].name}")
    seller1 = User(
        username="seller1",
        password_hash=get_password_hash("seller123"),
        role=UserRole.SELLER,
        branch_id=branches[0].id,
        can_add_products=False
    )
    db.add(seller1)
    
    db.commit()
    print("Seeding complete.")
    print("Admin: admin / admin123")
    print("Seller: seller1 / seller123")
    db.close()

if __name__ == "__main__":
    seed()
