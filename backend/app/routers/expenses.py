from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.expense import Expense
from ..schemas.expense import ExpenseCreate, ExpenseResponse
from ..utils.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    branch_id = expense.branch_id or current_user.branch_id
    
    if not branch_id:
        raise HTTPException(status_code=400, detail="Branch ID is required")
        
    new_expense = Expense(
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        branch_id=branch_id,
        seller_id=current_user.id
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/", response_model=List[ExpenseResponse])
def read_expenses(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    query = db.query(Expense).order_by(Expense.created_at.desc())
    
    if current_user.role == "seller":
        # Sellers only see their branch expenses
        if current_user.branch_id:
            query = query.filter(Expense.branch_id == current_user.branch_id)
    
    return query.offset(skip).limit(limit).all()

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Only admin or the seller who created it can delete
    if current_user.role != "admin" and str(expense.seller_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(expense)
    db.commit()
    return {"status": "success"}
