from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.getcwd())
from app.main import app
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.branch import Branch
import uuid

import httpx
from httpx import ASGITransport

def test_expense_creation():
    client = TestClient(app)
    
    # Get a real user and branch from DB to ensure valid foreign keys
    db = SessionLocal()
    user = db.query(User).first()
    branch = db.query(Branch).first()
    db.close()
    
    if not user or not branch:
        print("Need at least one user and one branch in DB to test.")
        return

    print(f"Testing with User: {user.username}, Branch: {branch.name}")
    
    # Mock authentication
    from app.utils.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user
    
    payload = {
        "amount": 1000.0,
        "description": "Verification Test Expense",
        "category": "branch",
        "branch_id": str(branch.id),
        "staff_id": None
    }
    
    print(f"Sending payload: {payload}")
    response = client.post("/api/expenses/", json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    app.dependency_overrides.clear()

if __name__ == "__main__":
    test_expense_creation()
