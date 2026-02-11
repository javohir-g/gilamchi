from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..models.staff import Staff
from ..schemas.staff import StaffCreate, StaffUpdate, StaffResponse
from ..utils.dependencies import get_current_user, get_admin_user
from ..models.invitation import InvitationLink
from ..schemas.invitation import InvitationCreate, InvitationResponse
from datetime import datetime, timedelta, timezone
import secrets

router = APIRouter(tags=["staff"])

@router.post("/", response_model=StaffResponse)
def create_staff(
    staff: StaffCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    raise HTTPException(status_code=400, detail="Manual staff creation is deprecated. Please use invitation links.")

@router.get("/", response_model=List[StaffResponse])
def get_staff(
    branch_id: UUID = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Fetching staff list. Filter branch_id: {branch_id}")
    
    # Query Users with role 'seller' or 'admin'
    from ..models.user import User
    
    query = db.query(User).filter(User.deleted_at == None)
    
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
        
    users = query.all()
    logger.info(f"Found {len(users)} active users in DB")
    
    # Map users to StaffResponse interface
    staff_list = []
    for user in users:
        logger.debug(f"Mapping user: {user.username} (role: {user.role}, branch: {user.branch_id})")
        staff_list.append({
            "id": user.id,
            "name": user.full_name or user.username,
            "branch_id": user.branch_id,
            "is_active": True,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        })
        
    return staff_list

@router.patch("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: UUID,
    staff_update: StaffUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage staff")
    
    # Update User instead of Staff
    from ..models.user import User
    db_user = db.query(User).filter(User.id == staff_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Staff (User) not found")
        
    # We only allow updating name (full_name) and branch_id for now
    if staff_update.name:
        db_user.full_name = staff_update.name
    if staff_update.branch_id:
        db_user.branch_id = staff_update.branch_id
    if staff_update.is_active is False:
        # Soft delete if set to inactive
        from datetime import datetime
        db_user.deleted_at = datetime.now()
    
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "name": db_user.full_name or db_user.username,
        "branch_id": db_user.branch_id,
        "is_active": db_user.deleted_at is None,
        "created_at": db_user.created_at
    }

@router.delete("/{staff_id}")
def delete_staff(
    staff_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage staff")
    
    from ..models.user import User
    from datetime import datetime
    
    db_user = db.query(User).filter(User.id == staff_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Staff (User) not found")
    
    # Soft delete
    db_user.deleted_at = datetime.now()
    db.commit()
    
    return {"message": "Staff (User) deactivated"}
@router.post("/generate-link", response_model=InvitationResponse)
def generate_invitation_link(
    invitation: InvitationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Generating invitation link for user: {current_user.username} (role: {current_user.role})")
    logger.info(f"Invitation data: {invitation.dict()}")
    
    try:
        token = secrets.token_urlsafe(16)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=invitation.expires_in_hours)
        
        db_invitation = InvitationLink(
            token=token,
            branch_id=invitation.branch_id,
            role=invitation.role,
            expires_at=expires_at,
            username_hint=invitation.username_hint
        )
        db.add(db_invitation)
        db.commit()
        db.refresh(db_invitation)
        
        # URL construction - base bot URL can be in settings
        from ..config import get_settings
        settings = get_settings()
        bot_url = f"https://t.me/{settings.telegram_bot_username}?start={token}"
        
        logger.info(f"Successfully generated link with token: {token[:5]}...")
        
        return InvitationResponse(
            id=db_invitation.id,
            token=db_invitation.token,
            branch_id=db_invitation.branch_id,
            role=db_invitation.role,
            is_used=db_invitation.is_used,
            expires_at=db_invitation.expires_at,
            url=bot_url
        )
    except Exception as e:
        logger.error(f"Error generating invitation link: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate link: {str(e)}")
