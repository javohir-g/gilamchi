from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from ..database import get_db
from ..models.debt import Debt, Payment
from ..schemas.debt import DebtCreate, DebtResponse, PaymentCreate, PaymentResponse
from ..utils.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=DebtResponse)
def create_debt(debt: DebtCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        # Calculate initial remaining
        remaining = Decimal(str(debt.total_amount)) - Decimal(str(debt.paid_amount))
        
        new_debt = Debt(
            debtor_name=debt.debtor_name,
            phone_number=debt.phone_number,
            order_details=debt.order_details,
            branch_id=debt.branch_id or current_user.branch_id, # Use provided branch_id or user's branch
            seller_id=current_user.id,
            total_amount=debt.total_amount,
            paid_amount=debt.paid_amount,
            initial_payment=debt.paid_amount,
            remaining_amount=remaining,
            payment_deadline=debt.payment_deadline,
            status="pending" if remaining > 0 else "paid",
            exchange_rate=debt.exchange_rate or 12200.0
        )
        
        db.add(new_debt)
        db.commit()
        db.refresh(new_debt)
        return new_debt
    except Exception as e:
        import traceback
        print(f"Error creating debt: {e}")
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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
        
    payment_amount_dec = Decimal(str(payment.amount))
    
    if payment_amount_dec > debt.remaining_amount:
         raise HTTPException(status_code=400, detail="Payment exceeds remaining debt")
         
    new_payment = Payment(
        debt_id=debt.id,
        amount=payment.amount,
        note=payment.note,
        recorded_by=current_user.id,
        exchange_rate=payment.exchange_rate or 12200.0
    )
    
    # Update Debt
    debt.paid_amount += payment_amount_dec
    debt.remaining_amount -= payment_amount_dec
    if debt.remaining_amount <= 0:
        debt.status = "paid"
        
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment
