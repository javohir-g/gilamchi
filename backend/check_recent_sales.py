from app.database import SessionLocal
from app.models.sale import Sale
from datetime import datetime

def check_sales():
    db = SessionLocal()
    try:
        sales = db.query(Sale).order_by(Sale.date.desc()).limit(5).all()
        print(f"Found {len(sales)} sales.")
        for s in sales:
            print(f"Sale ID: {s.id}, Date: {s.date}, Amount: {s.amount}, Branch: {s.branch_id}")
    finally:
        db.close()

if __name__ == "__main__":
    check_sales()
