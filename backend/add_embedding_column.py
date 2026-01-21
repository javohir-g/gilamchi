"""
Скрипт для добавления колонки image_embedding в таблицу products
"""
from app.database import engine
from sqlalchemy import text

def add_image_embedding_column():
    """Добавляет колонку image_embedding в таблицу products"""
    
    with engine.connect() as conn:
        try:
            # Проверяем, существует ли уже колонка
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='products' AND column_name='image_embedding'
            """))
            
            if result.fetchone():
                print("✓ Колонка image_embedding уже существует")
                return
            
            # Добавляем колонку
            print("Добавление колонки image_embedding...")
            conn.execute(text("""
                ALTER TABLE products 
                ADD COLUMN image_embedding BYTEA NULL
            """))
            conn.commit()
            
            print("✓ Колонка image_embedding успешно добавлена!")
            
        except Exception as e:
            print(f"✗ Ошибка: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("ДОБАВЛЕНИЕ КОЛОНКИ image_embedding")
    print("=" * 60 + "\n")
    add_image_embedding_column()
    print("\n✓ Миграция базы данных завершена!\n")
