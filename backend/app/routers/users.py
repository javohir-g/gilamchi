from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.user import UserCreate, UserResponse, UserUpdate
from ..utils.security import get_password_hash
from ..utils.dependencies import get_current_user, get_admin_user

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_admin_user)):
    users = db.query(User).filter(User.deleted_at == None).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user = Depends(get_admin_user)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        password_hash=hashed_password,
        role=user.role,
        branch_id=user.branch_id,
        can_add_products=user.can_add_products
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
