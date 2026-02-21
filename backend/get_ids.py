from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    user = conn.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
    branch = conn.execute(text("SELECT id FROM branches LIMIT 1")).fetchone()
    print(f"USER_ID={user[0]}")
    print(f"BRANCH_ID={branch[0]}")
