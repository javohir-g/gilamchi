from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from ..database import get_db
from ..models.branch import Branch
from ..schemas.branch import BranchCreate, BranchResponse, BranchUpdate
from ..utils.dependencies import get_admin_user, get_current_user

router = APIRouter()

@router.get("/", response_model=List[BranchResponse])
def read_branches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    branches = db.query(Branch).filter(Branch.deleted_at == None).offset(skip).limit(limit).all()
    return branches

@router.post("/", response_model=BranchResponse)
def create_branch(branch: BranchCreate, db: Session = Depends(get_db), current_user = Depends(get_admin_user)):
    db_branch = db.query(Branch).filter(Branch.name == branch.name).first()
    if db_branch:
        # If branch was soft-deleted, restore it? Or just error. 
        # For simplicity, if it exists and not deleted, error. If deleted, maybe restore?
        # Let's keep it simple: unique name constraint usually applies to active records in complex systems, 
        # but here the DB constraint is likely absolute.
        pass
    
    # Check if a branch with this name exists, even if deleted (due to unique constraint usually being on the column)
    # The model says `unique=True` on name. So we can't reuse names even if deleted unless we handle it.
    # For now, let's assume unique names are required globally.
    existing = db.query(Branch).filter(Branch.name == branch.name).first()
    if existing:
        if existing.deleted_at:
             raise HTTPException(status_code=400, detail="Branch with this name exists but is deleted. Please contact support to restore.")
        raise HTTPException(status_code=400, detail="Branch already exists")

    new_branch = Branch(**branch.dict())
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    return new_branch

@router.delete("/{branch_id}")
def delete_branch(branch_id: str, db: Session = Depends(get_db), current_user = Depends(get_admin_user)):
    branch = db.query(Branch).filter(Branch.id == branch_id, Branch.deleted_at == None).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Soft delete
    branch.deleted_at = datetime.now(timezone.utc)
    branch.deleted_by = current_user.id
    
    db.commit()
    return {"status": "success"}

@router.get("/{branch_id}", response_model=BranchResponse)
def read_branch(branch_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    branch = db.query(Branch).filter(Branch.id == branch_id, Branch.deleted_at == None).first()
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch
