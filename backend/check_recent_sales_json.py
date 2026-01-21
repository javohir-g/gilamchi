import json
from app.database import SessionLocal
from app.models.sale import Sale
from datetime import datetime
import uuid

def check_sales():
    db = SessionLocal()
    try:
        sales = db.query(Sale).order_by(Sale.date.desc()).limit(10).all()
        data = []
        for s in sales:
            data.append({
                "id": str(s.id),
                "date": s.date.isoformat(),
                "amount": float(s.amount),
                "branch_id": str(s.branch_id)
            })
        print(json.dumps(data, indent=2))
        with open("sales_debug.json", "w") as f:
            json.dump(data, f, indent=2)
    finally:
        db.close()

if __name__ == "__main__":
    check_sales()
