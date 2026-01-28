from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.collection import Collection
from ..schemas.collection import CollectionCreate, CollectionResponse
from ..utils.dependencies import get_admin_user

router = APIRouter()

@router.get("/", response_model=List[CollectionResponse])
def read_collections(db: Session = Depends(get_db)):
    return db.query(Collection).filter(Collection.deleted_at == None).all()

@router.post("/", response_model=CollectionResponse)
def create_collection(collection: CollectionCreate, db: Session = Depends(get_db), admin = Depends(get_admin_user)):
    db_collection = Collection(**collection.dict())
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.put("/{collection_id}", response_model=CollectionResponse)
def update_collection(collection_id: str, collection: CollectionCreate, db: Session = Depends(get_db), admin = Depends(get_admin_user)):
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # If price_per_sqm updated, we might want to update all products in this collection
    old_price = db_collection.price_per_sqm
    
    for key, value in collection.dict().items():
        setattr(db_collection, key, value)
    
    if old_price != db_collection.price_per_sqm and db_collection.price_per_sqm:
        # Update products' sell_price for this collection
        # This is basic logic: area * price_per_sqm
        # We need products that have width and total_length/remaining_length
        from ..models.product import Product
        products = db.query(Product).filter(Product.collection == db_collection.name).all()
        for p in products:
            if p.width and p.total_length:
                p.sell_price = float(p.width) * float(p.total_length) * float(db_collection.price_per_sqm)
            # For fixed units, we might have a different logic, but usually collections are for metraj
                
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.delete("/{collection_id}")
def delete_collection(collection_id: str, db: Session = Depends(get_db), admin = Depends(get_admin_user)):
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    from datetime import datetime, timezone
    db_collection.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Collection deleted"}
