from app.database import SessionLocal
from app.routers.products import read_products
from app.models.user import User
from unittest.mock import MagicMock
import traceback

# Mock Current User
mock_user = MagicMock(spec=User)
mock_user.id = "test_user_id"
mock_user.role = "admin"
mock_user.branch_id = None

# DB Session
db = SessionLocal()

try:
    print("Calling read_products directly...")
    products = read_products(
        skip=0, 
        limit=10, 
        branch_id=None, 
        category=None, 
        collection=None, # Added collection arg as per Step 481
        db=db, 
        current_user=mock_user
    )
    print(f"Success! Found {len(products)} products")
    # Verify serialization (this is usually where Pydantic fails if fields missing)
    from app.schemas.product import ProductResponse
    print("Validating schema...")
    for p in products:
        ProductResponse.from_orm(p)
    print("Schema validation passed")

except Exception as e:
    print("CRASH DETECTED:")
    traceback.print_exc()
finally:
    db.close()
