from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import imagehash
from ..database import get_db
from ..models.product import Product
from ..schemas.product import ProductCreate, ProductResponse, ProductUpdate
from ..utils.dependencies import get_current_user, get_admin_user
from ..utils.image import compute_image_hash

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
    import sys
    import uuid
    print(f"DEBUG: read_products called. User: {current_user}", file=sys.stderr)
    try:
        query = db.query(Product).filter(Product.deleted_at == None)
        
        if current_user.role == "seller" and not branch_id:
            if current_user.branch_id:
                branch_id = str(current_user.branch_id)
                print(f"DEBUG: Seller branch_id from user: {branch_id} (Type: {type(branch_id)})", file=sys.stderr)
        
        if branch_id and branch_id != "all":
            # Sanity check for empty dict string or object
            if isinstance(branch_id, dict) or branch_id == "{}":
                print(f"ERROR: branch_id is invalid: {branch_id}", file=sys.stderr)
                branch_id = None
            else:
                try:
                    # Validate UUID
                    uuid_obj = uuid.UUID(str(branch_id))
                    query = query.filter(Product.branch_id == uuid_obj)
                except ValueError:
                    print(f"WARNING: Invalid UUID for branch_id: {branch_id}", file=sys.stderr)
                    # If invalid UUID, maybe don't filter? Or filter by string?
                    # If DB has string UUIDs, uuid_obj comparison works.
                    pass

        if category:
            query = query.filter(Product.category == category)
        if collection:
            query = query.filter(Product.collection == collection)
            
        products = query.offset(skip).limit(limit).all()
        print(f"DEBUG: Found {len(products)} products", file=sys.stderr)
        return products
    except Exception as e:
        print(f"DEBUG: Error in read_products: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise e

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check permissions (if seller has can_add_products)
    if current_user.role != "admin" and not current_user.can_add_products:
         raise HTTPException(status_code=403, detail="Not authorized to add products")

    if current_user.role == "seller" and str(current_user.branch_id) != str(product.branch_id):
         raise HTTPException(status_code=403, detail="Cannot add product to another branch")

    product_data = product.dict()
    
    # Compute Hash if photo is provided and is base64
    if product.photo and product.photo.startswith("data:image"):
        try:
             # Extract base64 headers if present
             header, encoded = product.photo.split(",", 1)
             image_data = base64.b64decode(encoded)
             product_data["image_hash"] = compute_image_hash(image_data)
        except Exception as e:
             print(f"Failed to compute hash: {e}")

    new_product = Product(**product_data)
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

@router.post("/search-image", response_model=List[ProductResponse])
async def search_products_by_image(
    file: UploadFile = File(...),
    limit: int = 5,
    threshold: int = 15, # Hamming distance threshold
    branch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    contents = await file.read()
    input_hash_str = compute_image_hash(contents)
    
    if not input_hash_str:
        raise HTTPException(status_code=400, detail="Invalid image")
        
    input_hash = imagehash.hex_to_hash(input_hash_str)
    
    # Get all products with hashes
    # Optimization: Filter by branch if needed, though for search we might want global or branch specific
    query = db.query(Product).filter(Product.image_hash != None, Product.deleted_at == None)
    
    if branch_id and branch_id != "all":
         query = query.filter(Product.branch_id == branch_id)
         
    products = query.all()
    
    matches = []
    for product in products:
        try:
            prod_hash = imagehash.hex_to_hash(product.image_hash)
            distance = input_hash - prod_hash
            if distance <= threshold:
                matches.append((product, distance))
        except:
            continue
            
    # Sort by distance (asc)
    matches.sort(key=lambda x: x[1])
    
    return [m[0] for m in matches[:limit]]

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str, 
    product_update: ProductUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Check permissions (admins can update anything, sellers maybe shouldn't update others' products)
    db_product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user.role != "admin":
         if str(db_product.branch_id) != str(current_user.branch_id):
             raise HTTPException(status_code=403, detail="Not authorized to update products in other branches")

    update_data = product_update.dict(exclude_unset=True)
    
    # Handle image hash if photo is updated
    if "photo" in update_data and update_data["photo"] and update_data["photo"].startswith("data:image"):
        try:
             header, encoded = update_data["photo"].split(",", 1)
             image_data = base64.b64decode(encoded)
             update_data["image_hash"] = compute_image_hash(image_data)
        except Exception as e:
             print(f"Failed to compute hash: {e}")

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user.role != "admin":
         if str(db_product.branch_id) != str(current_user.branch_id):
             raise HTTPException(status_code=403, detail="Not authorized to delete products in other branches")

    # Soft delete
    from datetime import datetime, timezone
    db_product.deleted_at = datetime.now(timezone.utc)
    db_product.deleted_by = current_user.id
    
    db.commit()
    return {"status": "success"}
