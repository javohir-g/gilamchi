from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gilamchi"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_and_fix_categories():
    db = SessionLocal()
    try:
        # The DB uses uppercase keys for ENUM values (e.g., 'GILAMLAR', 'JOYNAMOZLAR')
        # We need to map 'Paloslar' and 'Joynamozlar' to 'GILAMLAR'
        
        invalid_mapping = {
            'PALOSLAR': 'GILAMLAR',
            'JOYNAMOZLAR': 'GILAMLAR',
            'Paloslar': 'GILAMLAR',
            'Joynamozlar': 'GILAMLAR',
            'Gilamlar': 'GILAMLAR' # Map lowercase/mixed case to uppercase just in case
        }
        
        for old_val, new_val in invalid_mapping.items():
            result = db.execute(
                text("UPDATE products SET category = :new_val WHERE category::text = :old_val"), 
                {"new_val": new_val, "old_val": old_val}
            )
            if result.rowcount > 0:
                print(f"Moved {result.rowcount} products from {old_val} to {new_val}")
        
        db.commit()
        
        # Verify final state
        result = db.execute(text("SELECT category, COUNT(*) FROM products GROUP BY category")).all()
        print("Final categories in DB:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
            
        print("Database updated successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_and_fix_categories()
