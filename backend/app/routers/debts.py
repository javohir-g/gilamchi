from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.debt import Debt, Payment
from ..schemas.debt import DebtCreate, DebtResponse, PaymentCreate, PaymentResponse
from ..utils.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=DebtResponse)
def create_debt(debt: DebtCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Calculate initial remaining
    remaining = debt.total_amount - debt.paid_amount
    
    new_debt = Debt(
        customer_name=debt.customer_name,
        customer_phone=debt.customer_phone,
        branch_id=current_user.branch_id, # Debts belong to the branch where created
        seller_id=current_user.id,
        total_amount=debt.total_amount,
        paid_amount=debt.paid_amount,
        remaining_amount=remaining,
        payment_deadline=debt.payment_deadline,
        status="pending" if remaining > 0 else "paid"
    )
    
    db.add(new_debt)
    db.commit()
    db.refresh(new_debt)
    return new_debt

@router.get("/", response_model=List[DebtResponse])
def read_debts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(Debt)
    if current_user.role == "seller":
        query = query.filter(Debt.branch_id == current_user.branch_id)
    return query.offset(skip).limit(limit).all()

@router.post("/{debt_id}/payments", response_model=PaymentResponse)
def create_payment(debt_id: str, payment: PaymentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
        
    if payment.amount > debt.remaining_amount:
         raise HTTPException(status_code=400, detail="Payment exceeds remaining debt")
         
    new_payment = Payment(
        debt_id=debt.id,
        amount=payment.amount,
        note=payment.note,
        recorded_by=current_user.id
    )
    
    # Update Debt
    debt.paid_amount += payment.amount
    debt.remaining_amount -= payment.amount
    if debt.remaining_amount <= 0:
        debt.status = "paid"
        
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment
