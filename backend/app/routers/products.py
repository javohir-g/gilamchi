from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, BackgroundTasks
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

def compute_clip_embedding_background(product_id: str, image_data: bytes):
    """
    Фоновая задача для вычисления CLIP embedding.
    Выполняется асинхронно после создания товара.
    
    Args:
        product_id: ID товара для обновления
        image_data: Байты изображения
    """
    import sys
    from ..utils.image_embedding import extract_image_embedding
    import numpy as np
    
    try:
        print(f"Background: Computing CLIP embedding for product {product_id}", file=sys.stderr)
        
        # Вычисление embedding (оптимизация изображения происходит внутри)
        embedding = extract_image_embedding(image_data)
        
        if embedding is not None:
            # Получаем новую сессию БД для фоновой задачи
            from ..database import SessionLocal
            db = SessionLocal()
            try:
                product = db.query(Product).filter(Product.id == product_id).first()
                if product:
                    product.image_embedding = embedding.astype(np.float32).tobytes()
                    db.commit()
                    print(f"Background: CLIP embedding saved for product {product_id}", file=sys.stderr)
                else:
                    print(f"Background: Product {product_id} not found", file=sys.stderr)
            finally:
                db.close()
        else:
            print(f"Background: Failed to compute embedding for product {product_id}", file=sys.stderr)
            
    except Exception as e:
        print(f"Background: Error computing embedding for product {product_id}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

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
def create_product(
    product: ProductCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Check permissions (if seller has can_add_products)
    if current_user.role != "admin" and not current_user.can_add_products:
         raise HTTPException(status_code=403, detail="Not authorized to add products")

    if current_user.role == "seller" and str(current_user.branch_id) != str(product.branch_id):
         raise HTTPException(status_code=403, detail="Cannot add product to another branch")

    product_data = product.dict()
    image_data_for_background = None
    
    # Compute Hash and schedule CLIP Embedding if photo is provided and is base64
    if product.photo and product.photo.startswith("data:image"):
        try:
             # Extract base64 headers if present
             header, encoded = product.photo.split(",", 1)
             image_data = base64.b64decode(encoded)
             
             # Legacy dHash (быстрая операция, выполняем синхронно)
             product_data["image_hash"] = compute_image_hash(image_data)
             
             # Сохраняем image_data для фоновой задачи
             image_data_for_background = image_data
             
             print("DEBUG: Image hash computed, CLIP embedding will be computed in background")
                 
        except Exception as e:
             print(f"Failed to compute image hash: {e}")

    # Auto-calculate sell_price if collection has price_per_sqm and sizes are provided
    # Only if sell_price is not explicitly provided or we want to enforce it
    from ..models.collection import Collection
    
    # Refresh logic for collection price
    if product.collection and (product.width or (product.available_sizes and len(product.available_sizes) > 0)):
        coll = db.query(Collection).filter(Collection.name == product.collection).first()
        if coll and coll.price_per_sqm:
            area = 0
            if product.width:
                # For metraj or fixed width products
                # We might need length for area calculation, but for metraj price is often per linear meter
                # if it's based on sqm, we need width * length
                pass 
            elif product.available_sizes:
                # Logic for fixed sizes could go here if needed
                pass

    # Создаем товар БЕЗ CLIP embedding (мгновенно!)
    # We use product.dict() which already has the data
    new_product = Product(**product_data)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Запускаем фоновую задачу для CLIP embedding
    if image_data_for_background is not None:
        background_tasks.add_task(
            compute_clip_embedding_background,
            str(new_product.id),
            image_data_for_background
        )
        print(f"DEBUG: Background task scheduled for product {new_product.id}")
    
    return new_product

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/search-image", response_model=List[dict])
async def search_products_by_image(
    file: UploadFile = File(...),
    limit: int = 10,
    threshold: float = 0.70,  # Cosine similarity threshold (0.70 = 70% похожести)
    category: Optional[str] = Query(None),
    collection: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Поиск товаров по изображению используя CLIP embeddings.
    
    Использует state-of-the-art deep learning модель (CLIP) для:
    - Понимания цветов и сложных узоров
    - Устойчивости к освещению, ракурсу, масштабу
    - Семантического понимания изображений
    
    Точность: ~90-95% (vs ~60% у старого метода)
    
    Args:
        file: Загруженное изображение
        limit: Максимальное количество результатов (по умолчанию 10)
        threshold: Порог cosine similarity (0.70 = 70%, рекомендуется 0.65-0.80)
        
    Returns:
        List[dict]: Список товаров с процентом похожести
    """
    import sys
    from ..utils.image_embedding import extract_image_embedding, compute_similarity
    import numpy as np
    
    try:
        # Извлечение embedding из загруженного изображения
        contents = await file.read()
        query_embedding = extract_image_embedding(contents)
        
        if query_embedding is None:
            raise HTTPException(status_code=400, detail="Не удалось обработать изображение")
        
        print(f"Query embedding extracted: shape={query_embedding.shape}", file=sys.stderr)
        
        # Построение запроса с фильтрацией
        query = db.query(Product).filter(
            Product.image_embedding != None,
            Product.deleted_at == None
        )

        if category:
            query = query.filter(Product.category == category)
        if collection:
            query = query.filter(Product.collection == collection)
        
        # Автоматическая фильтрация по филиалу для продавцов
        if current_user.role == "seller":
            if current_user.branch_id:
                query = query.filter(Product.branch_id == current_user.branch_id)
                print(f"Filtering by seller's branch: {current_user.branch_id}", file=sys.stderr)
            else:
                print("WARNING: Seller has no branch_id assigned", file=sys.stderr)
        
        products = query.all()
        print(f"Searching among {len(products)} products with CLIP embeddings", file=sys.stderr)
        
        if len(products) == 0:
            print("WARNING: No products with CLIP embeddings found!", file=sys.stderr)
            return []
        
        # 1. Извлекаем все эмбеддинги товаров и образцов
        # 2. Вычисляем похожесть всех сразу через матричное умножение
        
        try:
            from ..models.product_sample import ProductSample
            
            # Подготавливаем данные для матричного поиска
            # Каждая строка: (product_object, image_embedding_bytes)
            search_items = []
            
            # Основные фото товаров
            for p in products:
                search_items.append((p, p.image_embedding))
                
            # Дополнительные образцы (samples)
            samples = db.query(ProductSample).filter(
                ProductSample.product_id.in_([p.id for p in products])
            ).all()
            
            # Создаем карту samples для быстрого поиска продукта
            product_map = {p.id: p for p in products}
            for s in samples:
                search_items.append((product_map[s.product_id], s.embedding))
            
            if not search_items:
                return []

            # Извлекаем эмбеддинги в одну матрицу
            product_embeddings = np.array([
                np.frombuffer(item[1], dtype=np.float32) for item in search_items
            ])
            
            # Нормализация
            norms = np.linalg.norm(product_embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            product_embeddings = product_embeddings / norms
            
            # Матричное умножение
            similarities = product_embeddings @ query_embedding
            
            # Собираем результаты, группируя по продукту (берем максимальную похожесть)
            product_best_matches = {} # product_id -> max_similarity
            
            for i, similarity in enumerate(similarities):
                if similarity >= threshold:
                    p = search_items[i][0]
                    if p.id not in product_best_matches or similarity > product_best_matches[p.id]:
                        product_best_matches[p.id] = {
                            "product": p,
                            "similarity": float(similarity)
                        }
            
            matches = list(product_best_matches.values())
            print(f"Vectorized search (including {len(samples)} samples) finished. Matches: {len(matches)}", file=sys.stderr)
            
        except Exception as e:
            print(f"Error in vectorized search: {e}", file=sys.stderr)
            # Fallback к обычному циклу если что-то пошло не так
            matches = []
            for product in products:
                product_emb = np.frombuffer(product.image_embedding, dtype=np.float32)
                sim = compute_similarity(query_embedding, product_emb)
                if sim >= threshold:
                    matches.append({"product": product, "similarity": sim})
        
        # Сортировка по similarity (лучшие совпадения первыми)
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Формирование ответа с процентом похожести
        results = []
        for match in matches[:limit]:
            similarity_percentage = match["similarity"] * 100
            product_dict = {
                "id": str(match["product"].id),
                "code": match["product"].code,
                "category": match["product"].category,
                "collection": match["product"].collection,
                "type": match["product"].type,
                "buy_price": float(match["product"].buy_price),
                "sell_price": float(match["product"].sell_price),
                "sell_price_per_meter": float(match["product"].sell_price_per_meter) if match["product"].sell_price_per_meter else None,
                "quantity": match["product"].quantity,
                "remaining_length": float(match["product"].remaining_length) if match["product"].remaining_length else None,
                "total_length": float(match["product"].total_length) if match["product"].total_length else None,
                "max_quantity": match["product"].max_quantity,
                "width": match["product"].width,
                "available_sizes": match["product"].available_sizes,
                "photo": match["product"].photo,
                "branch_id": str(match["product"].branch_id),
                "created_at": match["product"].created_at.isoformat(),
                "updated_at": match["product"].updated_at.isoformat(),
                "similarity_percentage": round(similarity_percentage, 1),
                "cosine_similarity": round(match["similarity"], 3)
            }
            results.append(product_dict)
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in search_products_by_image: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail="Ошибка при поиске по изображению")

@router.post("/{product_id}/samples")
async def add_product_sample(
    product_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Добавляет новый образец изображения (embedding) для товара.
    Используется для активного обучения сканера на реальных фото.
    """
    from ..utils.image_embedding import extract_image_embedding, compute_similarity
    from ..models.product_sample import ProductSample
    import numpy as np
    import sys

    try:
        product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        contents = await file.read()
        new_embedding = extract_image_embedding(contents)
        
        if new_embedding is None:
            raise HTTPException(status_code=400, detail="Не удалось обработать изображение")

        # 1. Проверка на качество (должно быть похоже на оригинал хотя бы на 60%)
        if product.image_embedding:
            master_emb = np.frombuffer(product.image_embedding, dtype=np.float32)
            similarity_to_master = compute_similarity(new_embedding, master_emb)
            if similarity_to_master < 0.60:
                print(f"Sample rejected: low similarity to master ({similarity_to_master:.2f})", file=sys.stderr)
                return {"status": "skipped", "reason": "low_similarity"}

        # 2. Проверка на дубликаты среди существующих образцов
        existing_samples = db.query(ProductSample).filter(ProductSample.product_id == product_id).all()
        for sample in existing_samples:
            sample_emb = np.frombuffer(sample.embedding, dtype=np.float32)
            sim = compute_similarity(new_embedding, sample_emb)
            if sim > 0.95:
                print(f"Sample rejected: too similar to existing sample ({sim:.2f})", file=sys.stderr)
                return {"status": "skipped", "reason": "duplicate"}

        # 3. Сохранение
        new_sample = ProductSample(
            product_id=product_id,
            embedding=new_embedding.astype(np.float32).tobytes()
        )
        db.add(new_sample)
        db.commit()
        
        print(f"Added new sample for product {product_id}", file=sys.stderr)
        return {"status": "success"}

    except Exception as e:
        print(f"Error adding product sample: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str, 
    product_update: ProductUpdate,
    background_tasks: BackgroundTasks,
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
    image_data_for_background = None
    
    # Handle image hash and embedding if photo is updated
    if "photo" in update_data and update_data["photo"] and update_data["photo"].startswith("data:image"):
        try:
             header, encoded = update_data["photo"].split(",", 1)
             image_data = base64.b64decode(encoded)
             
             # Legacy dHash (быстрая операция)
             update_data["image_hash"] = compute_image_hash(image_data)
             
             # Сохраняем для фоновой задачи
             image_data_for_background = image_data
             
             print("DEBUG: Image hash updated, CLIP embedding will be computed in background")
                 
        except Exception as e:
             print(f"Failed to compute image hash on update: {e}")

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    
    # Запускаем фоновую задачу для CLIP embedding если фото обновлено
    if image_data_for_background is not None:
        background_tasks.add_task(
            compute_clip_embedding_background,
            str(db_product.id),
            image_data_for_background
        )
        print(f"DEBUG: Background task scheduled for updated product {db_product.id}")
    
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
