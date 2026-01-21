from app.database import engine, Base
# Import all models to ensure they are registered with Base
from app.models import branch, collection, debt, product, sale, user, audit, base

print("Creating tables in PostgreSQL...")
try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
except Exception as e:
    print(f"Error creating tables: {e}")
