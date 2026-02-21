from app.models.user import User
from app.database import SessionLocal
from app.config import get_settings
from jose import jwt
from datetime import datetime, timedelta, timezone

settings = get_settings()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

db = SessionLocal()
user = db.query(User).filter(User.username == "admin_947732542").first()
db.close()

if user:
    token = create_access_token({"sub": user.username})
    print(token)
else:
    print("User not found")
