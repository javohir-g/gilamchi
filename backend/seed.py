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
    new_branch_names = ["Yangi Bozor", "Hunarmandlar", "Naymancha"]
    old_names_map = {
        "Filial 1": "Yangi Bozor",
        "Filial 2": "Hunarmandlar",
        "Filial 3": "Naymancha"
    }

    branches = []
    
    # First, handle renames if they are still with old names
    for old_name, new_name in old_names_map.items():
        existing = db.query(Branch).filter(Branch.name == old_name).first()
        if existing:
            existing.name = new_name
            db.commit()

    for name in new_branch_names:
        branch = db.query(Branch).filter(Branch.name == name).first()
        if not branch:
            branch = Branch(name=name)
            db.add(branch)
            db.commit()
            db.refresh(branch)
        branches.append(branch)
    
    # Migration: Move existing collections to the first branch (Yangi Bozor)
    from app.models.collection import Collection, Size
    first_branch = branches[0]
    
    collections_to_migrate = db.query(Collection).filter(Collection.branch_id == None).all()
    for col in collections_to_migrate:
        col.branch_id = first_branch.id
        print(f"Migrated collection '{col.name}' to branch '{first_branch.name}'")
    
    sizes_to_migrate = db.query(Size).filter(Size.branch_id == None).all()
    for size in sizes_to_migrate:
        size.branch_id = first_branch.id
        print(f"Migrated size '{size.size}' to branch '{first_branch.name}'")
    
    db.commit()
    
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
                can_add_products=True
            )
            db.add(seller)
        else:
            seller.password_hash = get_password_hash(password)
            seller.branch_id = branch.id
            seller.role = UserRole.SELLER
            seller.can_add_products = True
    
    db.commit()
    print("Seeding complete.")
    print("Administrators and Sellers have been ensured/updated.")
    print("Sellers: filial1/filial1, filial2/filial2, filial3/filial3")
    db.close()

if __name__ == "__main__":
    seed()
