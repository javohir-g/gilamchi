import requests
import json

url = "http://localhost:8000/api/expenses/"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl85NDc3MzI1NDIiLCJleHAiOjE3NzE2NjEyMzh9.P-09mkl2d8PFl1XgNHSXzo_pCAgUKAsXq6o9_8AI5JU"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# We need a real staff_id or None
# The DB has users, staff_id should be a user.id
# For testing we can use None or a known ID.
payload = {
    "amount": 555.0,
    "description": "API Direct Verification Test (Null Staff)",
    "category": "branch",
    "branch_id": "e9a3c7f9-792d-4f3f-9b1c-6158a91d7827",
    "staff_id": None
}

print(f"Calling {url}...")
try:
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"Error: {e}")
