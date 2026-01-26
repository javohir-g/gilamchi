from typing import Optional, List, TYPE_CHECKING
from PIL import Image
import io
import numpy as np

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

# Глобальная переменная для кэширования модели
_model: Optional["SentenceTransformer"] = None

def optimize_image(image_bytes: bytes, max_size: int = 800, quality: int = 85, enhance_details: bool = True) -> bytes:
    """
    Оптимизирует изображение для CLIP и программно усиливает детали (узоры).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Конвертация в RGB
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 1. Усиление деталей (CLAHE)
        if enhance_details:
            try:
                import cv2
                # Переводим в массив для OpenCV
                img_cv = np.array(img)
                # Переводим в LAB для работы только с яркостью (L channel)
                lab = cv2.cvtColor(img_cv, cv2.COLOR_RGB2LAB)
                l, a, b = cv2.split(lab)
                # Применяем адаптивное выравнивание гистограммы (вытягиваем узоры)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                cl = clahe.apply(l)
                # Собираем обратно
                limg = cv2.merge((cl,a,b))
                final_cv = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
                img = Image.fromarray(final_cv)
                # print("Pattern details enhanced via CLAHE")
            except ImportError:
                # Если opencv-python не установлен, пропускаем этот шаг
                pass
        
        # 2. Изменение размера
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Сжатие в JPEG
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        return output.getvalue()
        
    except Exception as e:
        print(f"Error optimizing image: {e}")
        return image_bytes

def get_model() -> "SentenceTransformer":
    """
    Получает или загружает CLIP модель.
    Модель кэшируется для повторного использования.
    """
    global _model
    if _model is None:
        print("Loading CLIP model (clip-ViT-B-32)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('clip-ViT-B-32')
        print("Model loaded successfully!")
    return _model

def extract_image_embedding(image_bytes: bytes, optimize: bool = True) -> Optional[np.ndarray]:
    """
    Извлекает комбинированный embedding (Global + Pattern Focus).
    """
    try:
        if optimize:
            image_bytes = optimize_image(image_bytes)
        
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        model = get_model()
        
        # 1. Global View Embedding (общий вид)
        global_embedding = model.encode(img, convert_to_numpy=True, normalize_embeddings=True)
        
        # 2. Pattern Focus Embedding (Zoom на центр)
        # Вырезаем центральные 60% изображения (там обычно самый яркий узор)
        width, height = img.size
        # Ограничиваем crop так, чтобы не выйти за границы
        crop_w = int(width * 0.6)
        crop_h = int(height * 0.6)
        left = (width - crop_w) // 2
        top = (height - crop_h) // 2
        right = left + crop_w
        bottom = top + crop_h
        
        center_crop = img.crop((left, top, right, bottom))
        pattern_embedding = model.encode(center_crop, convert_to_numpy=True, normalize_embeddings=True)
        
        # 3. Intelligent Fusion (Инновационное слияние)
        # Мы смешиваем общий вид и узор в один вектор.
        # Даем узору 65% веса, общему виду 35%, чтобы сканер лучше различал детали.
        fused_embedding = (global_embedding * 0.35) + (pattern_embedding * 0.65)
        
        # Повторная нормализация после слияния
        norm = np.linalg.norm(fused_embedding)
        if norm > 0:
            fused_embedding = fused_embedding / norm
            
        return fused_embedding
        
    except Exception as e:
        print(f"Error extracting embedding: {e}")
        return None

def compute_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Вычисляет cosine similarity между двумя embeddings.
    
    Args:
        embedding1: Первый embedding вектор
        embedding2: Второй embedding вектор
    
    Returns:
        float: Значение от 0 до 1, где:
            - 1.0 = идентичные изображения
            - 0.9-0.99 = очень похожие
            - 0.7-0.89 = похожие
            - <0.7 = разные
    """
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Reshape для sklearn (требует 2D массив)
        emb1 = embedding1.reshape(1, -1)
        emb2 = embedding2.reshape(1, -1)
        
        # Вычисление cosine similarity
        similarity = cosine_similarity(emb1, emb2)[0][0]
        
        return float(similarity)
        
    except Exception as e:
        print(f"Error computing similarity: {e}")
        return 0.0

def batch_extract_embeddings(images_bytes: list[bytes]) -> list[Optional[np.ndarray]]:
    """
    Извлекает embeddings для нескольких изображений за один раз.
    Более эффективно чем вызывать extract_image_embedding в цикле.
    
    Args:
        images_bytes: Список байтов изображений
    
    Returns:
        Список embeddings (или None для ошибочных изображений)
    """
    try:
        model = get_model()
        embeddings = []
        
        for img_bytes in images_bytes:
            try:
                img = Image.open(io.BytesIO(img_bytes))
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                embedding = model.encode(img, convert_to_numpy=True)
                embeddings.append(embedding)
            except Exception as e:
                print(f"Error processing image in batch: {e}")
                embeddings.append(None)
        
        return embeddings
        
    except Exception as e:
        print(f"Error in batch extraction: {e}")
        return [None] * len(images_bytes)
