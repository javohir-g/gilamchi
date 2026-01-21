from app.database import SessionLocal
from app.models.branch import Branch

try:
    db = SessionLocal()
    branches = db.query(Branch).all()
    print(f"Found {len(branches)} branches:")
    for b in branches:
        print(f"Branch: {b.name}, ID: {b.id}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
