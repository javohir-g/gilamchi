"""
Test script to check image search functionality
"""
from app.database import SessionLocal
from app.models.product import Product
from app.utils.image import compute_image_hash
import requests
from io import BytesIO

db = SessionLocal()

# Check products with image hashes
print("=" * 60)
print("CHECKING PRODUCTS WITH IMAGE HASHES")
print("=" * 60)

products = db.query(Product).filter(Product.deleted_at == None).all()
print(f"\nTotal products: {len(products)}")

products_with_hash = [p for p in products if p.image_hash]
products_without_hash = [p for p in products if not p.image_hash]

print(f"Products WITH image hash: {len(products_with_hash)}")
print(f"Products WITHOUT image hash: {len(products_without_hash)}")

if products_with_hash:
    print("\n--- Sample products WITH hash ---")
    for p in products_with_hash[:5]:
        print(f"  • {p.name} - Hash: {p.image_hash[:20]}... - Photo: {p.photo[:50] if p.photo else 'None'}...")

if products_without_hash:
    print("\n--- Sample products WITHOUT hash ---")
    for p in products_without_hash[:5]:
        print(f"  • {p.name} - Photo: {p.photo[:50] if p.photo else 'None'}...")

# Test hash computation for URL images
print("\n" + "=" * 60)
print("TESTING HASH COMPUTATION FOR URL IMAGES")
print("=" * 60)

if products_without_hash:
    test_product = products_without_hash[0]
    print(f"\nTesting with product: {test_product.name}")
    print(f"Photo URL: {test_product.photo}")
    
    if test_product.photo and (test_product.photo.startswith('http://') or test_product.photo.startswith('https://')):
        try:
            print("\nDownloading image...")
            response = requests.get(test_product.photo, timeout=10)
            if response.status_code == 200:
                image_data = response.content
                print(f"Image downloaded: {len(image_data)} bytes")
                
                print("Computing hash...")
                hash_value = compute_image_hash(image_data)
                if hash_value:
                    print(f"✓ Hash computed successfully: {hash_value}")
                    
                    # Update product with hash
                    test_product.image_hash = hash_value
                    db.commit()
                    print("✓ Hash saved to database")
                else:
                    print("✗ Failed to compute hash")
            else:
                print(f"✗ Failed to download image: HTTP {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")
    elif test_product.photo and test_product.photo.startswith('data:image'):
        print("Photo is base64 encoded - hash should have been computed on creation")
    else:
        print("Photo URL format not recognized or missing")

# Summary and recommendations
print("\n" + "=" * 60)
print("RECOMMENDATIONS")
print("=" * 60)

if len(products_without_hash) > 0:
    print(f"\n⚠️  {len(products_without_hash)} products don't have image hashes")
    print("   This means they won't appear in image search results!")
    print("\n   Solutions:")
    print("   1. Run a migration script to compute hashes for existing products")
    print("   2. Ensure new products always get hashes when created")
    print("   3. Update products to recompute hashes if photos change")
else:
    print("\n✓ All products have image hashes - search should work well!")

db.close()
