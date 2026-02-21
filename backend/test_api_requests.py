import requests
import json
import time

url = "http://localhost:8000/api/products/"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl85NDc3MzI1NDIiLCJleHAiOjE3NzE2NjEyMzh9.P-09mkl2d8PFl1XgNHSXzo_pCAgUKAsXq6o9_8AI5JU"

headers = {
    "Authorization": f"Bearer {token}"
}

print(f"Calling {url}...")
try:
    start = time.time()
    response = requests.get(url, headers=headers, timeout=30)
    duration = time.time() - start
    print(f"Request took {duration:.4f}s")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {json.dumps(dict(response.headers), indent=2)}")
    if response.status_code == 200:
        print(f"Found {len(response.json())} products.")
    else:
        print(f"Error Body: {response.text}")
except requests.exceptions.Timeout:
    print("TIMEOUT error")
except Exception as e:
    print(f"Error: {e}")
