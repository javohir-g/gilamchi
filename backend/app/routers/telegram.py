from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
from typing import Optional
from urllib.parse import parse_qs, unquote
import logging

logger = logging.getLogger(__name__)

from ..database import get_db
from ..models.user import User, UserRole
from ..models.invitation import InvitationLink
from ..schemas.token import Token
from ..schemas.user import UserResponse
from ..utils.security import create_access_token
from ..config import get_settings
from passlib.context import CryptContext
import secrets

router = APIRouter(tags=["telegram"])
settings = get_settings()

ADMIN_IDS = [6867575783, 947732542, "947732542"]

def verify_telegram_data(init_data: str, bot_token: str) -> dict:
    # This is a simplified version, in production you should use the official HMAC verification
    # For this exercise, we'll implement the logic
    try:
        data = dict(qc.split('=') for qc in init_data.split('&'))
        hash_str = data.pop('hash')
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(data.items()))
        
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash != hash_str:
            raise HTTPException(status_code=401, detail="Invalid Telegram data")
        
        user_data = json.loads(data['user'])
        return user_data
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Telegram data format")

@router.post("/auth", response_model=Token)
async def telegram_auth(init_data: str, db: Session = Depends(get_db)):
    logger.info(f"Telegram auth attempt with init_data: {init_data[:50]}...")
    
    try:
        # 1. Parse query string
        params = parse_qs(init_data)
        # parse_qs returns lists for values, take the first one
        data = {k: v[0] for k, v in params.items()}
        
        if 'user' not in data:
            # Maybe it's raw JSON for testing
            try:
                user_data = json.loads(init_data)
            except:
                logger.error("No 'user' field in init_data and not a valid JSON")
                raise HTTPException(status_code=401, detail="Invalid Telegram data: user field missing")
        else:
            user_data = json.loads(data['user'])
            
        logger.info(f"Loaded user_data for telegram_id: {user_data.get('id')}")
    except Exception as e:
        logger.error(f"Failed to parse telegram data: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid Telegram data format: {str(e)}")

    telegram_id = user_data.get('id')
    if not telegram_id:
        raise HTTPException(status_code=401, detail="No Telegram ID found")

    # 1. Check if it's a hardcoded admin
    # Convert telegram_id to string and integer to be absolutely sure
    str_id = str(telegram_id)
    int_id = int(telegram_id) if str_id.isdigit() else None
    
    if int_id in ADMIN_IDS or str_id in ADMIN_IDS:
        user = db.query(User).filter(User.telegram_id == telegram_id).first()
        if not user:
            # Auto-create admin if not exists
            user = User(
                username=f"admin_{telegram_id}",
                telegram_id=telegram_id,
                full_name=user_data.get('first_name', 'Admin'),
                role=UserRole.ADMIN
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

    # 2. Check if user already exists in DB
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if user:
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

    # 3. Not registered
    raise HTTPException(status_code=404, detail="NOT_REGISTERED")

@router.post("/register-invitation", response_model=Token)
async def register_by_invitation(init_data: str, token: str, db: Session = Depends(get_db)):
    logger.info(f"Registration attempt with token: {token}")
    try:
        params = parse_qs(init_data)
        data = {k: v[0] for k, v in params.items()}
        
        if 'user' not in data:
            user_data = json.loads(init_data)
        else:
            user_data = json.loads(data['user'])
    except Exception as e:
        logger.error(f"Failed to parse telegram data in registration: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Telegram data")

    telegram_id = user_data.get('id')
    
    # Verify invitation
    invitation = db.query(InvitationLink).filter(InvitationLink.token == token).first()
    if not invitation or not invitation.is_valid():
        raise HTTPException(status_code=400, detail="Invalid or expired invitation link")

    # Check if user already registered
    existing_user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if existing_user:
         raise HTTPException(status_code=400, detail="User already registered")

    # Create new user
    # Generate a random password hash to satisfy NotNull constraint on password_hash column
    # The user won't know this password, but that's fine as they login via Telegram
    random_password = secrets.token_urlsafe(32)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash(random_password)

    # Use hint if available, otherwise default to tg_ID
    final_username = invitation.username_hint if invitation.username_hint else f"tg_{telegram_id}"
    
    # Check if username already taken (if hint provided)
    if invitation.username_hint:
         existing_username = db.query(User).filter(User.username == final_username).first()
         if existing_username:
             # Use fallback if hint taken
             final_username = f"{final_username}_{telegram_id}"

    new_user = User(
        username=final_username,
        telegram_id=telegram_id,
        full_name=f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
        role=invitation.role,
        branch_id=invitation.branch_id,
        password_hash=password_hash
    )
    db.add(new_user)
    
    # Mark invitation as used
    invitation.is_used = True
    
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}
