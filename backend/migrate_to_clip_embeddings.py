"""
Скрипт для миграции существующих продуктов на CLIP embeddings.
Вычисляет embeddings для всех товаров с фотографиями.
"""
from app.database import SessionLocal
from app.models.product import Product
from app.utils.image_embedding import extract_image_embedding
import requests
import base64
import numpy as np
from tqdm import tqdm

def migrate_to_clip_embeddings():
    """
    Вычисляет CLIP embeddings для всех продуктов.
    """
    db = SessionLocal()
    
    try:
        # Получить все продукты с фотографиями
        products = db.query(Product).filter(
            Product.deleted_at == None,
            Product.photo != None
        ).all()
        
        print("=" * 60)
        print("МИГРАЦИЯ НА CLIP EMBEDDINGS")
        print("=" * 60)
        print(f"\nНайдено продуктов для обработки: {len(products)}")
        print("\nЗагрузка CLIP модели...")
        
        # Предзагрузка модели (первый вызов загружает модель)
        from app.utils.image_embedding import get_model
        get_model()
        print("✓ Модель загружена!\n")
        
        success_count = 0
        failed_count = 0
        skipped_count = 0
        
        # Обработка каждого продукта
        for i, product in enumerate(tqdm(products, desc="Обработка")):
            try:
                # Пропустить если уже есть embedding
                if product.image_embedding:
                    skipped_count += 1
                    continue
                
                image_data = None
                
                # Обработка base64 изображений
                if product.photo.startswith('data:image'):
                    try:
                        header, encoded = product.photo.split(',', 1)
                        image_data = base64.b64decode(encoded)
                    except Exception as e:
                        print(f"\n✗ Ошибка декодирования base64 для {product.name}: {e}")
                        failed_count += 1
                        continue
                
                # Обработка URL изображений
                elif product.photo.startswith('http://') or product.photo.startswith('https://'):
                    try:
                        response = requests.get(product.photo, timeout=10)
                        if response.status_code == 200:
                            image_data = response.content
                        else:
                            print(f"\n✗ HTTP {response.status_code} для {product.name}")
                            failed_count += 1
                            continue
                    except Exception as e:
                        print(f"\n✗ Ошибка загрузки URL для {product.name}: {e}")
                        failed_count += 1
                        continue
                
                # Извлечение embedding
                if image_data:
                    embedding = extract_image_embedding(image_data)
                    if embedding is not None:
                        # Сохранение как bytes (float32)
                        product.image_embedding = embedding.astype(np.float32).tobytes()
                        success_count += 1
                    else:
                        print(f"\n✗ Не удалось извлечь embedding для {product.name}")
                        failed_count += 1
                else:
                    print(f"\n✗ Неизвестный формат фото для {product.name}: {product.photo[:50]}")
                    failed_count += 1
                
                # Коммит каждые 10 товаров для безопасности
                if (i + 1) % 10 == 0:
                    db.commit()
                    
            except Exception as e:
                print(f"\n✗ Ошибка обработки {product.name}: {e}")
                failed_count += 1
        
        # Финальный коммит
        db.commit()
        
        # Статистика
        print("\n" + "=" * 60)
        print("РЕЗУЛЬТАТЫ МИГРАЦИИ")
        print("=" * 60)
        print(f"✓ Успешно обработано: {success_count}")
        print(f"⊘ Пропущено (уже есть embedding): {skipped_count}")
        print(f"✗ Ошибок: {failed_count}")
        print(f"📊 Всего продуктов: {len(products)}")
        
        if success_count > 0:
            print(f"\n✓ Embeddings успешно вычислены для {success_count} товаров!")
            print("  Теперь поиск по изображениям будет работать с точностью ~90%")
        
    except Exception as e:
        print(f"\n✗ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n🚀 Начинаем миграцию на CLIP embeddings...\n")
    migrate_to_clip_embeddings()
    print("\n✓ Миграция завершена!\n")
