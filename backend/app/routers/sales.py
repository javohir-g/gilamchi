from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.sale import Sale
from ..models.product import Product, ProductType
from ..schemas.sale import SaleCreate, SaleResponse
from ..utils.dependencies import get_current_user

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=SaleResponse)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    product = db.query(Product).with_for_update().filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Stock Validation & Deduction
    logger.debug(f"Processing sale for product {product.id} (Type: {product.type})")
    
    if product.type == ProductType.UNIT:
        logger.debug(f"Current quantity: {product.quantity}, Sale quantity: {sale.quantity}")
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
                    logger.debug(f"Size {sale.size} updated: {size_qty} -> {s['quantity']}")
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
        logger.debug(f"New quantity: {product.quantity}")
        
        if product.quantity <= 0:
            from datetime import datetime, timezone
            product.deleted_at = datetime.now(timezone.utc)
            product.deleted_by = current_user.id
            logger.debug(f"Product {product.id} marked as deleted")
            
    elif product.type == ProductType.METER:
        available = float(product.remaining_length if product.remaining_length is not None else (product.total_length or 0))
        sale_len = float(sale.length) if sale.length else float(sale.quantity)
        sale_width = float(sale.width) if sale.width else None
        
        logger.debug(f"Current remaining_length: {available}, Sale length: {sale_len}, Width: {sale_width}")
        
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
                                
                                logger.debug(f"Roll {size_str} updated to {w}x{new_l:.2f}")
                                found = True
                                break
                    except Exception as e:
                        logger.error(f"Error parsing roll size {s.get('size')}: {e}")
            
            if found:
                from sqlalchemy.orm.attributes import flag_modified
                product.available_sizes = sizes
                flag_modified(product, "available_sizes")
        
        product.remaining_length = available - sale_len
        logger.debug(f"New remaining_length: {product.remaining_length}")
            
        if product.remaining_length <= 0.05:
            from datetime import datetime, timezone
            product.deleted_at = datetime.now(timezone.utc)
            product.deleted_by = current_user.id
            print(f"DEBUG: Product {product.id} marked as deleted", file=sys.stderr)
    
    # Explicitly add product back to session to ensure it's marked for update
    db.add(product)
    
    from ..models.collection import Collection
    from ..models.settings import Settings
    from decimal import Decimal
    collection = db.query(Collection).filter(Collection.name == product.collection).first() if product.collection else None

    # Get exchange rate from settings for currency normalization
    settings = db.query(Settings).first()
    exchange_rate = Decimal(str(settings.exchange_rate if settings else 12200.0))

    # ─────────────────────────────────────────────────────────────────────────
    # Profit calculation — ALL values normalized to USD for storage
    # ─────────────────────────────────────────────────────────────────────────

    # Normalize buy price to USD
    raw_buy_price = Decimal(str(product.buy_price))
    if product.is_usd_priced:
        buy_price_usd = raw_buy_price
    else:
        buy_price_usd = raw_buy_price / exchange_rate

    qty = Decimal(str(sale.quantity))

    if product.type == ProductType.METER:
        # sell_price_per_meter is stored in USD per LINEAR meter (= pricePerSqm × roll_width).
        # Frontend calculates: total = area × sellingPrice = (width × length) × (sell_price_per_meter / width)
        #                            = length × sell_price_per_meter
        # So metric = length, base_sell_price = sell_price_per_meter (USD per linear meter)
        # Similarly, buy_price is stored as USD per linear meter (buyPricePerSqm × width, with is_usd_priced=True)
        length_d = Decimal(str(sale.length)) if sale.length else qty
        metric_for_standard_price = length_d  # length in linear meters

        raw_sell_price_per_linear_m = Decimal(str(product.sell_price_per_meter or product.sell_price or 0))
        base_sell_price_usd = raw_sell_price_per_linear_m  # already in USD per linear meter




    else:
        # Unit products: quantity (or area) is the metric
        metric_for_standard_price = Decimal(str(sale.area)) if sale.area else qty
        
        # sell_price can be USD or UZS
        raw_sell_price = Decimal(str(product.sell_price))
        if product.is_usd_priced:
            base_sell_price_usd = raw_sell_price
        else:
            base_sell_price_usd = raw_sell_price / exchange_rate

    # Standard costs and sell values in USD
    total_buy_cost_usd = buy_price_usd * metric_for_standard_price
    standard_sell_usd = base_sell_price_usd * metric_for_standard_price

    # Actual sale amount (Frontend sends USD for Sale.amount)
    if sale.amount:
        sale_amount_usd = Decimal(str(sale.amount))
    else:
        sale_amount_usd = standard_sell_usd

    # Profit breakdown in USD
    admin_profit  = standard_sell_usd - total_buy_cost_usd
    seller_profit = sale_amount_usd - standard_sell_usd
    total_profit  = sale_amount_usd - total_buy_cost_usd

    # Data to store (USD)
    sale_amount = float(sale_amount_usd)




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
def read_sales(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
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
