from app.database import engine
from sqlalchemy import text

def update_timestamps():
    with engine.connect() as connection:
        print("Altering timestamp columns to TIMESTAMP WITH TIME ZONE...")
        try:
            # Sales table
            connection.execute(text("ALTER TABLE sales ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE"))
            connection.execute(text("ALTER TABLE sales ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE"))
            connection.execute(text("ALTER TABLE sales ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE"))
            
            # Products table
            connection.execute(text("ALTER TABLE products ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE"))
            connection.execute(text("ALTER TABLE products ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE"))
            
            # Users table
            connection.execute(text("ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE"))
            connection.execute(text("ALTER TABLE users ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE"))
            
            # Branches table
            connection.execute(text("ALTER TABLE branches ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE"))
            connection.execute(text("ALTER TABLE branches ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE"))
            
            connection.commit()
            print("Successfully updated timestamp columns to TIMESTAMPTZ.")
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    update_timestamps()
