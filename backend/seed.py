from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.branch import Branch
from app.utils.security import get_password_hash
import uuid
import migration_telegram

def seed():
    # Run Telegram migration first to ensure columns exist
    try:
        print("Running Telegram migration...")
        migration_telegram.migrate()
    except Exception as e:
        print(f"Migration error (might be okay if already migrated): {e}")

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
    
    # Ensure Specific Telegram Admins Exist/Updated
    tg_admins = [
        {"id": 947732542, "username": "admin_947732542"},
        {"id": 6965037980, "username": "admin_6965037980"}
    ]
    
    for tg_admin in tg_admins:
        admin_user = db.query(User).filter(User.telegram_id == tg_admin["id"]).first()
        if not admin_user:
            # Also check by username as fallback
            admin_user = db.query(User).filter(User.username == tg_admin["username"]).first()
            
        if not admin_user:
            print(f"Creating Telegram admin: {tg_admin['username']}")
            admin_user = User(
                username=tg_admin["username"],
                telegram_id=tg_admin["id"],
                password_hash=get_password_hash(uuid.uuid4().hex), # Random password
                role=UserRole.ADMIN,
                can_add_products=True
            )
            db.add(admin_user)
        else:
            print(f"Ensuring Telegram admin is active and admin: {admin_user.username}")
            admin_user.role = UserRole.ADMIN
            admin_user.telegram_id = tg_admin["id"]
            admin_user.deleted_at = None
            admin_user.deleted_by = None
            admin_user.can_add_products = True
    
    db.commit()
    
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
