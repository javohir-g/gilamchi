import httpx
import json

def test_endpoints():
    base_url = "http://localhost:8000/api"
    
    # 1. Login to get token
    login_url = f"{base_url}/auth/login"
    login_data = {"username": "admin", "password": "admin123"}
    
    try:
        r = httpx.post(login_url, data=login_data)
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}")
            return
        
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
        
        endpoints = [
            "auth/me",
            "branches/",
            "products/",
            "sales/",
            "debts/"
        ]
        
        for ep in endpoints:
            try:
                r = httpx.get(f"{base_url}/{ep}", headers=headers)
                print(f"Endpoint {ep}: {r.status_code}")
                if r.status_code != 200:
                    print(f"  Error: {r.text}")
            except Exception as e:
                print(f"Endpoint {ep} reached exception: {e}")
                
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_endpoints()
