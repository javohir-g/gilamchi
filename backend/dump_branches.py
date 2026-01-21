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

def dump_branches():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT id, name FROM branches")).all()
        print("Current branches:")
        for row in result:
            print(f"  ID: {row[0]}, Name: {row[1]}")
    finally:
        db.close()

if __name__ == "__main__":
    dump_branches()
