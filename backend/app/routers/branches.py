from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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
        raise HTTPException(status_code=400, detail="Branch already exists")
    new_branch = Branch(**branch.dict())
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    return new_branch

@router.get("/{branch_id}", response_model=BranchResponse)
def read_branch(branch_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    branch = db.query(Branch).filter(Branch.id == branch_id, Branch.deleted_at == None).first()
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch
