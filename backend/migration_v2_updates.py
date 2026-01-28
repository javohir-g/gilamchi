"""
Migration script v2:
- Renames products.name to products.code
- Adds products.buy_price_usd, products.is_usd_priced
- Adds collections.price_per_sqm
- Adds sales.admin_profit, sales.seller_profit
"""
from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            # 0. Collections: ensure table exists
            print("Ensuring collections table exists...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS collections (
                    id UUID PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP WITH TIME ZONE,
                    name VARCHAR UNIQUE,
                    icon VARCHAR,
                    price_per_sqm DECIMAL(15, 2)
                )
            """))
            conn.commit()

            # Seed default collections
            print("Seeding default collections...")
            default_collections = [
                ("Lara", "🌺", 15.0),
                ("Emili", "🌸", 15.0),
                ("Melord", "👑", 15.0),
                ("Mashad", "🎨", 15.0),
                ("Izmir", "✨", 15.0),
                ("Isfahan", "🏛️", 15.0),
                ("Prestige", "💎", 15.0),
                ("Sultan", "🕌", 15.0)
            ]
            import uuid
            for name, icon, price in default_collections:
                result = conn.execute(text("SELECT id FROM collections WHERE name = :name"), {"name": name})
                if not result.fetchone():
                    conn.execute(text("""
                        INSERT INTO collections (id, name, icon, price_per_sqm, created_at, updated_at)
                        VALUES (:id, :name, :icon, :price, NOW(), NOW())
                    """), {"id": uuid.uuid4(), "name": name, "icon": icon, "price": price})
            conn.commit()
            print("✓ Default collections seeded")

            # 1. Products: rename name to code
            print("Checking products table...")
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='products' AND column_name='name'
            """))
            if result.fetchone():
                print("Renaming products.name to products.code...")
                conn.execute(text("ALTER TABLE products RENAME COLUMN name TO code"))
            else:
                print("✓ products.code already exists or products.name missing")

            # 2. Products: add buy_price_usd
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='products' AND column_name='buy_price_usd'
            """))
            if not result.fetchone():
                print("Adding products.buy_price_usd...")
                conn.execute(text("ALTER TABLE products ADD COLUMN buy_price_usd DECIMAL(15, 2) NULL"))
            
            # 3. Products: add is_usd_priced
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='products' AND column_name='is_usd_priced'
            """))
            if not result.fetchone():
                print("Adding products.is_usd_priced...")
                conn.execute(text("ALTER TABLE products ADD COLUMN is_usd_priced BOOLEAN DEFAULT FALSE"))

            # 4. Collections: add price_per_sqm
            print("Checking collections table...")
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='collections' AND column_name='price_per_sqm'
            """))
            if not result.fetchone():
                print("Adding collections.price_per_sqm...")
                conn.execute(text("ALTER TABLE collections ADD COLUMN price_per_sqm DECIMAL(15, 2) NULL"))

            # 5. Sales: add admin_profit
            print("Checking sales table...")
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='sales' AND column_name='admin_profit'
            """))
            if not result.fetchone():
                print("Adding sales.admin_profit...")
                conn.execute(text("ALTER TABLE sales ADD COLUMN admin_profit DECIMAL(15, 2) DEFAULT 0"))

            # 6. Sales: add seller_profit
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='sales' AND column_name='seller_profit'
            """))
            if not result.fetchone():
                print("Adding sales.seller_profit...")
                conn.execute(text("ALTER TABLE sales ADD COLUMN seller_profit DECIMAL(15, 2) DEFAULT 0"))

            conn.commit()
            print("\n✓ All migrations applied successfully!")
            
        except Exception as e:
            print(f"✗ Migration error: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("RUNNING SCHEMA MIGRATION V2")
    print("=" * 60 + "\n")
    run_migration()
