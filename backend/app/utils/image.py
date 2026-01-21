from PIL import Image, ImageEnhance
import imagehash
import io

def compute_image_hash(image_file: bytes) -> str:
    """
    Вычисляет perceptual hash изображения с предобработкой
    для устойчивости к изменениям освещения.
    
    Использует dHash (Difference Hash) который сравнивает градиенты яркости
    между соседними пикселями, что делает его устойчивым к изменениям освещения.
    """
    try:
        img = Image.open(io.BytesIO(image_file))
        
        # Конвертация в RGB
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            bg.paste(img, mask=img.split()[3])
            img = bg
        else:
            img = img.convert('RGB')
        
        # Предобработка для устойчивости к освещению
        # 1. Нормализация контраста - помогает при разном освещении
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)
        
        # 2. Небольшое увеличение резкости для лучшего выделения узоров ковров
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.1)
        
        # Вычисление dHash (устойчив к освещению)
        # hash_size=8 дает 64-битный хеш (8x8 сетка)
        hash_obj = imagehash.dhash(img, hash_size=8)
        return str(hash_obj)
    except Exception as e:
        print(f"Error computing hash: {e}")
        return None

