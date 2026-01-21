import requests
import jwt
from datetime import datetime, timedelta
from app.config import get_settings

settings = get_settings()
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

# Create Token
expire = datetime.utcnow() + timedelta(minutes=15)
to_encode = {"sub": "seller1", "exp": expire} # Impersonating seller1
# Step 481 code uses `user = db.query(User).filter(User.username == form_data.username).first()`
# Checks `sub` claim.
# I need a valid username. "admin" is likely.
encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

headers = {
    "Authorization": f"Bearer {encoded_jwt}"
}

print(f"Sending request with token: {encoded_jwt[:10]}...")
try:
    response = requests.get("http://localhost:8000/api/products/", headers=headers)
    print(f"Status: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
