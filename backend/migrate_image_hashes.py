"""
Migration script to compute image hashes for all existing products
"""
from app.database import SessionLocal
from app.models.product import Product
from app.utils.image import compute_image_hash
import requests
import base64
from tqdm import tqdm

def compute_hashes_for_all_products():
    db = SessionLocal()
    
    try:
        # Get all products without hashes
        products = db.query(Product).filter(
            Product.deleted_at == None,
            Product.image_hash == None,
            Product.photo != None
        ).all()
        
        print(f"Found {len(products)} products without image hashes")
        
        if len(products) == 0:
            print("✓ All products already have hashes!")
            return
        
        success_count = 0
        failed_count = 0
        
        for product in tqdm(products, desc="Computing hashes"):
            try:
                image_data = None
                
                # Handle base64 encoded images
                if product.photo.startswith('data:image'):
                    try:
                        header, encoded = product.photo.split(',', 1)
                        image_data = base64.b64decode(encoded)
                    except Exception as e:
                        print(f"\n✗ Failed to decode base64 for {product.name}: {e}")
                        failed_count += 1
                        continue
                
                # Handle URL images
                elif product.photo.startswith('http://') or product.photo.startswith('https://'):
                    try:
                        response = requests.get(product.photo, timeout=10)
                        if response.status_code == 200:
                            image_data = response.content
                        else:
                            print(f"\n✗ Failed to download image for {product.name}: HTTP {response.status_code}")
                            failed_count += 1
                            continue
                    except Exception as e:
                        print(f"\n✗ Failed to download image for {product.name}: {e}")
                        failed_count += 1
                        continue
                
                # Compute hash
                if image_data:
                    hash_value = compute_image_hash(image_data)
                    if hash_value:
                        product.image_hash = hash_value
                        success_count += 1
                    else:
                        print(f"\n✗ Failed to compute hash for {product.name}")
                        failed_count += 1
                else:
                    print(f"\n✗ Unknown photo format for {product.name}: {product.photo[:50]}")
                    failed_count += 1
                    
            except Exception as e:
                print(f"\n✗ Error processing {product.name}: {e}")
                failed_count += 1
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE")
        print("=" * 60)
        print(f"✓ Successfully computed hashes: {success_count}")
        print(f"✗ Failed: {failed_count}")
        print(f"Total processed: {len(products)}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("IMAGE HASH MIGRATION SCRIPT")
    print("=" * 60)
    print("\nThis script will compute image hashes for all products")
    print("that don't have them yet.\n")
    
    compute_hashes_for_all_products()
