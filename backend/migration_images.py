import os
import sys
import base64
import uuid

# Setup paths so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product

def migrate_images():
    print("Starting image migration from DB to filesystem...")
    
    # Ensure uploads directory exists
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    print(f"Uploads directory verified at: {uploads_dir}")
    
    db = SessionLocal()
    
    try:
        # Find all products that have a photo starting with "data:image"
        # Since 'photo' might be large, we'll process them in batches or one by one
        products = db.query(Product).filter(Product.photo.like("data:image%")).all()
        
        total = len(products)
        print(f"Found {total} products with Base64 images to migrate.")
        
        migrated = 0
        errors = 0
        
        for p in products:
            try:
                # Extract base64 headers if present
                header, encoded = p.photo.split(",", 1)
                image_data = base64.b64decode(encoded)
                
                # Determine extension from header
                ext = "jpg"
                if "png" in header.lower():
                    ext = "png"
                elif "webp" in header.lower():
                    ext = "webp"
                    
                filename = f"product_{p.id}.{ext}"
                filepath = os.path.join(uploads_dir, filename)
                
                # Write to disk
                with open(filepath, "wb") as f:
                    f.write(image_data)
                    
                # Update database
                p.photo = f"/uploads/{filename}"
                
                # Commit frequently to avoid massive memory holding
                db.commit()
                
                migrated += 1
                if migrated % 10 == 0:
                    print(f"Progress: {migrated}/{total} migrated...")
                    
            except Exception as e:
                print(f"Error migrating image for product {p.id}: {e}")
                db.rollback()
                errors += 1
                
        print(f"\nMigration Complete!")
        print(f"Successfully migrated: {migrated}")
        print(f"Errors encountered: {errors}")
        
    finally:
        db.close()

if __name__ == "__main__":
    migrate_images()
