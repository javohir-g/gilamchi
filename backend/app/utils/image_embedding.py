from sentence_transformers import SentenceTransformer
from PIL import Image
import io
import numpy as np
from typing import Optional

# Глобальная переменная для кэширования модели
_model: Optional[SentenceTransformer] = None

def get_model() -> SentenceTransformer:
    """
    Получает или загружает CLIP модель.
    Модель кэшируется для повторного использования.
    """
    global _model
    if _model is None:
        print("Loading CLIP model (clip-ViT-B-32)...")
        # CLIP-based модель, оптимизированная для изображений
        # Размер: ~400MB, Embedding dimension: 512
        _model = SentenceTransformer('clip-ViT-B-32')
        print("Model loaded successfully!")
    return _model

def extract_image_embedding(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Извлекает embedding из изображения используя CLIP.
    
    Args:
        image_bytes: Байты изображения (JPEG, PNG, etc.)
    
    Returns:
        numpy array размерности 512 или None при ошибке
        
    Примечание:
        Embeddings устойчивы к:
        - Изменениям освещения
        - Небольшим поворотам
        - Масштабированию
        - Различным ракурсам
    """
    try:
        # Открытие изображения из bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Конвертация в RGB (CLIP требует RGB)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Получение модели
        model = get_model()
        
        # Извлечение embedding
        # Возвращает numpy array размерности (512,)
        embedding = model.encode(img, convert_to_numpy=True)
        
        return embedding
        
    except Exception as e:
        print(f"Error extracting embedding: {e}")
        import traceback
        traceback.print_exc()
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
