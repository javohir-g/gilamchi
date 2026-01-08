from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.product import Product
from ..schemas.product import ProductCreate, ProductResponse, ProductUpdate
from ..utils.dependencies import get_current_user, get_admin_user

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def read_products(
    skip: int = 0, 
    limit: int = 100, 
    branch_id: Optional[str] = None,
    category: Optional[str] = None,
    collection: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    query = db.query(Product).filter(Product.deleted_at == None)
    
    if branch_id:
        query = query.filter(Product.branch_id == branch_id)
    if category:
        query = query.filter(Product.category == category)
    if collection:
        query = query.filter(Product.collection == collection)
        
    products = query.offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check permissions logic can be added here (if seller has can_add_products)
    if current_user.role != "admin" and not current_user.can_add_products:
         raise HTTPException(status_code=403, detail="Not authorized to add products")

    if current_user.role == "seller" and str(current_user.branch_id) != str(product.branch_id):
         raise HTTPException(status_code=403, detail="Cannot add product to another branch")

    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
