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

    # Stock Validation & Deduction
    import sys
    print(f"DEBUG: Processing sale for product {product.id} (Type: {product.type})", file=sys.stderr)
    
    if product.type == ProductType.UNIT:
        print(f"DEBUG: Current quantity: {product.quantity}, Sale quantity: {sale.quantity}", file=sys.stderr)
        if product.quantity < sale.quantity:
             raise HTTPException(status_code=400, detail=f"Insufficient stock (requested {sale.quantity}, available {product.quantity})")
        
        # Per-size stock handling
        if sale.size and product.available_sizes:
            sizes = list(product.available_sizes) if product.available_sizes else []
            found = False
            for s in sizes:
                if isinstance(s, dict) and s.get("size") == sale.size:
                    size_qty = int(s.get("quantity", 0))
                    if size_qty < sale.quantity:
                        raise HTTPException(status_code=400, detail=f"Insufficient stock for size {sale.size}")
                    s["quantity"] = size_qty - int(sale.quantity)
                    print(f"DEBUG: Size {sale.size} updated: {size_qty} -> {s['quantity']}", file=sys.stderr)
                    found = True
                    break
                elif isinstance(s, str) and s == sale.size:
                    found = True
                    break
            
            if found:
                from sqlalchemy.orm.attributes import flag_modified
                product.available_sizes = sizes
                flag_modified(product, "available_sizes")

        product.quantity = int(product.quantity) - int(sale.quantity)
        print(f"DEBUG: New quantity: {product.quantity}", file=sys.stderr)
        
        if product.quantity <= 0:
            from datetime import datetime, timezone
            product.deleted_at = datetime.now(timezone.utc)
            product.deleted_by = current_user.id
            print(f"DEBUG: Product {product.id} marked as deleted", file=sys.stderr)
            
    elif product.type == ProductType.METER:
        available = float(product.remaining_length if product.remaining_length is not None else (product.total_length or 0))
        sale_len = float(sale.quantity)
        sale_width = float(sale.width) if sale.width else None
        
        print(f"DEBUG: Current remaining_length: {available}, Sale length: {sale_len}, Width: {sale_width}", file=sys.stderr)
        
        if available < sale_len:
             raise HTTPException(status_code=400, detail=f"Insufficient stock (requested {sale_len}m, available {available}m)")
        
        # Individual roll deduction
        if sale_width and product.available_sizes:
            sizes = list(product.available_sizes)
            found = False
            for s in sizes:
                if isinstance(s, dict) and "size" in s:
                    try:
                        # size format "WxL"
                        size_str = s["size"]
                        if 'x' in size_str:
                            w_part, l_part = size_str.split('x')
                            w = float(w_part)
                            l = float(l_part)
                            
                            # Match by width
                            if w == sale_width:
                                if l < sale_len:
                                    continue # Try next roll with same width
                                
                                # Deduct from this roll
                                new_l = l - sale_len
                                if new_l <= 0.05: # Effectively empty
                                    sizes.remove(s)
                                else:
                                    # Preserve metadata like initial_length if present
                                    s["size"] = f"{w}x{new_l:.2f}"
                                
                                print(f"DEBUG: Roll {size_str} updated to {w}x{new_l:.2f}", file=sys.stderr)
                                found = True
                                break
                    except Exception as e:
                        print(f"DEBUG: Error parsing roll size {s.get('size')}: {e}", file=sys.stderr)
            
            if found:
                from sqlalchemy.orm.attributes import flag_modified
                product.available_sizes = sizes
                flag_modified(product, "available_sizes")
        
        product.remaining_length = available - sale_len
        print(f"DEBUG: New remaining_length: {product.remaining_length}", file=sys.stderr)
            
        if product.remaining_length <= 0.05:
            from datetime import datetime, timezone
            product.deleted_at = datetime.now(timezone.utc)
            product.deleted_by = current_user.id
            print(f"DEBUG: Product {product.id} marked as deleted", file=sys.stderr)
    
    # Explicitly add product back to session to ensure it's marked for update
    db.add(product)
    
    from ..models.collection import Collection
    collection = db.query(Collection).filter(Collection.name == product.collection).first() if product.collection else None

    # Profit calculation:
    # Admin Profit = (Base Sell Price - Product.buy_price) * Metric (qty or area)
    # Seller Profit = Sale.amount - (Base Sell Price * Metric)
    # Total Profit = Sale.amount - (Product.buy_price * Metric)
    
    qty = float(sale.quantity)
    area = float(sale.area) if sale.area else None
    metric = area if area else qty

    base_sell_price = float(product.sell_price)
    buy_price = float(product.buy_price)
    sale_amount = float(sale.amount or (base_sell_price * metric))
    
    admin_profit = (base_sell_price - buy_price) * metric
    seller_profit = sale_amount - (base_sell_price * metric)
    total_profit = sale_amount - (buy_price * metric)

    new_sale = Sale(
        product_id=sale.product_id,
        branch_id=current_user.branch_id if current_user.branch_id else product.branch_id,
        seller_id=current_user.id,
        quantity=sale.quantity,
        amount=sale_amount,
        payment_type=sale.payment_type,
        order_id=sale.order_id,
        profit=total_profit,
        admin_profit=admin_profit,
        seller_profit=seller_profit,
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
