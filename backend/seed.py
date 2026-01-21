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
    branch_names = ["Filial 1", "Filial 2", "Filial 3"]
    branches = []
    for name in branch_names:
        branch = Branch(name=name)
        db.add(branch)
        branches.append(branch)
    
    db.commit()
    for b in branches: 
        db.refresh(b)
    
    # Create Admin
    admin = User(
        username="admin",
        password_hash=get_password_hash("admin"),
        role=UserRole.ADMIN,
        can_add_products=True
    )
    db.add(admin)
    
    # Create Sellers
    for i, branch in enumerate(branches):
        username = f"filial{i+1}"
        print(f"Creating seller: {username}")
        seller = User(
            username=username,
            password_hash=get_password_hash(username),
            role=UserRole.SELLER,
            branch_id=branch.id,
            can_add_products=False
        )
        db.add(seller)
    
    db.commit()
    print("Seeding complete.")
    print("Admin: admin / admin")
    print("Sellers: filial1/filial1, filial2/filial2, filial3/filial3")
    db.close()

if __name__ == "__main__":
    seed()
