from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.branch import Branch
from app.utils.security import get_password_hash
import uuid

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Ensure Branches Exist
    branch_names = ["Filial 1", "Filial 2", "Filial 3"]
    branches = []
    for name in branch_names:
        branch = db.query(Branch).filter(Branch.name == name).first()
        if not branch:
            branch = Branch(name=name)
            db.add(branch)
            db.commit()
            db.refresh(branch)
        branches.append(branch)
    
    # Ensure Admin Exists/Updated
    admin_username = "admin"
    admin_password = "admin"
    admin = db.query(User).filter(User.username == admin_username).first()
    if not admin:
        print(f"Creating admin: {admin_username}")
        admin = User(
            username=admin_username,
            password_hash=get_password_hash(admin_password),
            role=UserRole.ADMIN,
            can_add_products=True
        )
        db.add(admin)
    else:
        print(f"Updating admin password: {admin_username}")
        admin.password_hash = get_password_hash(admin_password)
        admin.role = UserRole.ADMIN
        admin.can_add_products = True
    
    # Ensure Sellers Exist/Updated
    for i, branch in enumerate(branches):
        username = f"filial{i+1}"
        password = username
        print(f"Ensuring seller: {username} for {branch.name}")
        seller = db.query(User).filter(User.username == username).first()
        if not seller:
            seller = User(
                username=username,
                password_hash=get_password_hash(password),
                role=UserRole.SELLER,
                branch_id=branch.id,
                can_add_products=False
            )
            db.add(seller)
        else:
            seller.password_hash = get_password_hash(password)
            seller.branch_id = branch.id
            seller.role = UserRole.SELLER
    
    db.commit()
    print("Seeding complete.")
    print(f"Admin: {admin_username} / {admin_password}")
    print("Sellers: filial1/filial1, filial2/filial2, filial3/filial3")
    db.close()

if __name__ == "__main__":
    seed()
