from PIL import Image
import imagehash
import io

def compute_image_hash(image_file: bytes) -> str:
    """
    Computes the pHash/dHash of an image.
    Uses dHash (Difference Hash) as it is robust.
    Returns the hash as a hex string.
    """
    try:
        img = Image.open(io.BytesIO(image_file))
        # Remove transparency if present, convert to RGB
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            bg.paste(img, mask=img.split()[3])
            img = bg
        else:
            img = img.convert('RGB')
            
        # Compute dHash
        hash_obj = imagehash.dhash(img)
        return str(hash_obj)
    except Exception as e:
        print(f"Error computing hash: {e}")
        return None
