import uuid
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import sys

# Add backend to path to import security utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.utils.security import get_password_hash

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gilamchi"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def manage_filials():
    db = SessionLocal()
    try:
        # 1. Handle Branches
        # Get existing branches ordered by creation or name
        branches = db.execute(text("SELECT id, name FROM branches ORDER BY created_at ASC")).all()
        
        target_names = ["Filial 1", "Filial 2", "Filial 3"]
        branch_ids = []

        for i in range(3):
            name = target_names[i]
            if i < len(branches):
                # Update existing
                branch_id = branches[i][0]
                db.execute(text("UPDATE branches SET name = :name WHERE id = :id"), {"name": name, "id": branch_id})
                print(f"Renamed branch {branches[i][1]} to {name}")
            else:
                # Create new
                branch_id = uuid.uuid4()
                db.execute(text("INSERT INTO branches (id, name, created_at, updated_at) VALUES (:id, :name, NOW(), NOW())"), 
                           {"id": branch_id, "name": name})
                print(f"Created new branch: {name}")
            branch_ids.append(branch_id)
        
        # 2. Handle Users
        for i, branch_id in enumerate(branch_ids):
            username = f"filial{i+1}"
            password = f"filial{i+1}"
            pwd_hash = get_password_hash(password)
            
            # Use 'SELLER' (uppercase) for the DB enum value
            role = "SELLER"
            
            # Check if user exists
            user = db.execute(text("SELECT id FROM users WHERE username = :username"), {"username": username}).first()
            
            if user:
                # Update
                db.execute(text("UPDATE users SET password_hash = :hash, branch_id = :branch_id, role = :role, can_add_products = :cap WHERE username = :username"),
                           {"hash": pwd_hash, "branch_id": branch_id, "role": role, "cap": False, "username": username})
                print(f"Updated user: {username}")
            else:
                # Create
                user_id = uuid.uuid4()
                db.execute(text("INSERT INTO users (id, username, password_hash, role, branch_id, can_add_products, created_at, updated_at) VALUES (:id, :username, :hash, :role, :branch_id, :cap, NOW(), NOW())"),
                           {"id": user_id, "username": username, "hash": pwd_hash, "role": role, "branch_id": branch_id, "cap": False})
                print(f"Created user: {username}")
        
        db.commit()
        print("\nAll changes applied successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    manage_filials()
