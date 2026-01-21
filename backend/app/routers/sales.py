from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.sale import Sale
from ..models.product import Product, ProductType
from ..schemas.sale import SaleCreate, SaleResponse
from ..utils.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=SaleResponse)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Stock Validation
    if product.type == ProductType.UNIT:
        if product.quantity < sale.quantity:
             raise HTTPException(status_code=400, detail="Insufficient stock (quantity)")
        product.quantity -= int(sale.quantity)
        
        # Auto-delete product if quantity reaches 0
        if product.quantity == 0:
            from datetime import datetime, timezone
            product.deleted_at = datetime.now(timezone.utc)
            product.deleted_by = current_user.id
    elif product.type == ProductType.METER:
        # Assuming remaining_length is tracked
        if product.remaining_length and product.remaining_length < sale.quantity:
             raise HTTPException(status_code=400, detail="Insufficient stock (length)")
        if product.remaining_length:
            product.remaining_length -= float(sale.quantity)
            
            # Auto-delete product if remaining length reaches 0
            if product.remaining_length <= 0:
                from datetime import datetime, timezone
                product.deleted_at = datetime.now(timezone.utc)
                product.deleted_by = current_user.id
    
    # Calculate amounts if strictly needed or rely on frontend
    # Logic: Profit = (SellPrice - BuyPrice) * qty + (extra_profit)
    # Here we assume frontend sends the final amount, or we calculate? 
    # Prompt says "profit" is extra profit.
    # Director's profit logic: (sellPrice - buyPrice) * quantity.
    # We store the "profit" field as the Extra Profit above standard.
    
    # For now, just create the record
    new_sale = Sale(
        product_id=sale.product_id,
        branch_id=current_user.branch_id if current_user.branch_id else product.branch_id, # Fallback
        seller_id=current_user.id,
        quantity=sale.quantity,
        amount=sale.amount or (float(product.sell_price) * sale.quantity), # Fallback calculation
        payment_type=sale.payment_type,
        order_id=sale.order_id,
        profit=0, # Logic to calculate extra profit can be complex if sale amount varies
        width=sale.width,
        length=sale.length,
        area=sale.area
    )
    
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale

from sqlalchemy.orm import joinedload

@router.get("/", response_model=List[SaleResponse])
def read_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Newest first sorting is critical for the dashboard
    query = db.query(Sale).options(joinedload(Sale.product)).order_by(Sale.date.desc())
    
    if current_user.role == "seller":
        # Ensure seller only sees their branch
        if current_user.branch_id:
            query = query.filter(Sale.branch_id == current_user.branch_id)
        else:
            # If for some reason branch_id is missing, show their own sales as fallback
            query = query.filter(Sale.seller_id == current_user.id)
        
    return query.offset(skip).limit(limit).all()
