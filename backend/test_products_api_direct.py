from app.main import app
from fastapi.testclient import TestClient
from app.models.user import User
from app.database import SessionLocal
from app.utils.dependencies import get_current_user
import time

client = TestClient(app)

db = SessionLocal()
user = db.query(User).filter(User.role == "admin").first()
db.close()

if not user:
    print("Admin user not found for testing.")
else:
    print(f"Testing direct API call as user: {user.username}")
    
    # Override auth to use our user
    app.dependency_overrides[get_current_user] = lambda: user
    
    try:
        start = time.time()
        print("Sending GET /api/products/...")
        response = client.get("/api/products/")
        print(f"API Call took {time.time() - start:.4f}s")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Found {len(response.json())} products in response.")
        else:
            print(f"Error Response: {response.text}")
    finally:
        app.dependency_overrides.clear()
