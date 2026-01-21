import requests
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import verify_password

# Test 1: Check if admin exists in database
print("=" * 50)
print("Test 1: Checking if admin exists in database")
print("=" * 50)

db = SessionLocal()
admin = db.query(User).filter(User.username == "admin").first()

if admin:
    print(f"✓ Admin user found!")
    print(f"  Username: {admin.username}")
    print(f"  Role: {admin.role}")
    print(f"  Password hash: {admin.password_hash[:50]}...")
    
    # Test password verification
    print("\n" + "=" * 50)
    print("Test 2: Testing password verification")
    print("=" * 50)
    
    test_password = "admin"
    is_valid = verify_password(test_password, admin.password_hash)
    print(f"Password '{test_password}' verification: {'✓ VALID' if is_valid else '✗ INVALID'}")
else:
    print("✗ Admin user NOT found in database!")

db.close()

# Test 3: Try actual login via API
print("\n" + "=" * 50)
print("Test 3: Testing login via API")
print("=" * 50)

try:
    response = requests.post(
        "http://localhost:8000/api/auth/login",
        data={
            "username": "admin",
            "password": "admin"
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ Login successful!")
        data = response.json()
        print(f"  Access Token: {data.get('access_token', 'N/A')[:50]}...")
        print(f"  Token Type: {data.get('token_type', 'N/A')}")
        
        # Test 4: Get user info with token
        print("\n" + "=" * 50)
        print("Test 4: Getting user info with token")
        print("=" * 50)
        
        token = data.get('access_token')
        me_response = requests.get(
            "http://localhost:8000/api/auth/me",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        print(f"Status Code: {me_response.status_code}")
        if me_response.status_code == 200:
            user_data = me_response.json()
            print("✓ User info retrieved successfully!")
            print(f"  Username: {user_data.get('username')}")
            print(f"  Role: {user_data.get('role')}")
            print(f"  Can Add Products: {user_data.get('can_add_products')}")
        else:
            print(f"✗ Failed to get user info: {me_response.text}")
    else:
        print(f"✗ Login failed!")
        print(f"  Response: {response.text}")
        
except Exception as e:
    print(f"✗ Error during API test: {str(e)}")

print("\n" + "=" * 50)
print("Tests completed!")
print("=" * 50)
