import json
from app.database import SessionLocal
from app.models.sale import Sale
from app.schemas.sale import SaleResponse
from datetime import datetime
import uuid

def test_serialization():
    db = SessionLocal()
    try:
        sale = db.query(Sale).order_by(Sale.date.desc()).first()
        if not sale:
            print("No sales found.")
            return
            
        # Use Pydantic to serialize
        response = SaleResponse.from_orm(sale)
        json_data = response.model_dump_json() # Pydantic v2
        print("Serialized Sale:")
        print(json_data)
        
        with open("sales_serialization_test.json", "w") as f:
            f.write(json_data)
            
    finally:
        db.close()

if __name__ == "__main__":
    test_serialization()
