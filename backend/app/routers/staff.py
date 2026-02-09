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
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage staff")
    
    new_staff = Staff(**staff.model_dump())
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.get("/", response_model=List[StaffResponse])
def get_staff(
    branch_id: UUID = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Staff).filter(Staff.deleted_at == None)
    if branch_id:
        query = query.filter(Staff.branch_id == branch_id)
    return query.all()

@router.patch("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: UUID,
    staff_update: StaffUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage staff")
    
    db_staff = db.query(Staff).filter(Staff.id == staff_id, Staff.deleted_at == None).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    update_data = staff_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_staff, key, value)
    
    db.commit()
    db.refresh(db_staff)
    return db_staff

@router.delete("/{staff_id}")
def delete_staff(
    staff_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage staff")
    
    db_staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    db.delete(db_staff)
    db.commit()
    return {"message": "Staff deleted"}
@router.post("/generate-link", response_model=InvitationResponse)
def generate_invitation_link(
    invitation: InvitationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    token = secrets.token_urlsafe(16)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=invitation.expires_in_hours)
    
    db_invitation = InvitationLink(
        token=token,
        branch_id=invitation.branch_id,
        role=invitation.role,
        expires_at=expires_at
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    
    # URL construction - base bot URL can be in settings
    bot_url = f"https://t.me/gilamchi_robot?start={token}"
    
    return InvitationResponse(
        id=db_invitation.id,
        token=db_invitation.token,
        branch_id=db_invitation.branch_id,
        role=db_invitation.role,
        is_used=db_invitation.is_used,
        expires_at=db_invitation.expires_at,
        url=bot_url
    )
