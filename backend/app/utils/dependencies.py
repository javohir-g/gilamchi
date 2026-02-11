from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.token import TokenData
from ..config import get_settings

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger(__name__)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("Token payload missing 'sub' (username)")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        logger.warning(f"JWT decode error: {str(e)}")
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        logger.warning(f"User not found in DB: {token_data.username}")
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.deleted_at:
        import logging
        logger = logging.getLogger(__name__)
        
        # Proactive reactivation for hardcoded admins
        if current_user.telegram_id and str(current_user.telegram_id) in settings.ADMIN_IDS:
            logger.info(f"Proactively reactivating hardcoded admin: {current_user.username}")
            from ..database import SessionLocal
            db = SessionLocal()
            try:
                # Need to refresh the instance from DB to avoid session issues, 
                # but we can also just update it here if it's attached.
                # Since get_current_user provides an attached instance, let's use it.
                current_user.deleted_at = None
                current_user.deleted_by = None
                # current_user is already in a session from get_current_user
                import sqlalchemy
                from sqlalchemy.orm import object_session
                session = object_session(current_user)
                if session:
                    session.commit()
                    session.refresh(current_user)
                    return current_user
            except Exception as e:
                logger.error(f"Failed to proactively reactivate admin: {str(e)}")
            finally:
                db.close()

        logger.warning(f"Access attempt by inactive user: {current_user.username}")
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user
