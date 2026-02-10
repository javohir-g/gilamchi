"""
Migration script to add Telegram integration fields to users table
and create invitation_links table.
"""
import sys
from sqlalchemy import create_engine, text
from app.config import get_settings

settings = get_settings()

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Starting migration...")
        
        # Add telegram_id and full_name columns to users table
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
            """))
            conn.commit()
            print("✓ Added telegram_id column to users table")
        except Exception as e:
            print(f"⚠ telegram_id column might already exist: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS full_name VARCHAR;
            """))
            conn.commit()
            print("✓ Added full_name column to users table")
        except Exception as e:
            print(f"⚠ full_name column might already exist: {e}")
        
        # Create index on telegram_id
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_users_telegram_id 
                ON users(telegram_id);
            """))
            conn.commit()
            print("✓ Created index on telegram_id")
        except Exception as e:
            print(f"⚠ Index might already exist: {e}")
        
        # Create invitation_links table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS invitation_links (
                    id UUID PRIMARY KEY,
                    token VARCHAR UNIQUE NOT NULL,
                    branch_id UUID REFERENCES branches(id),
                    role VARCHAR NOT NULL DEFAULT 'seller',
                    is_used BOOLEAN NOT NULL DEFAULT FALSE,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP WITH TIME ZONE,
                    deleted_by UUID
                );
            """))
            conn.commit()
            print("✓ Created invitation_links table")
        except Exception as e:
            print(f"⚠ invitation_links table might already exist: {e}")
        
        # Create index on token
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_invitation_links_token 
                ON invitation_links(token);
            """))
            conn.commit()
            print("✓ Created index on invitation token")
        except Exception as e:
            print(f"⚠ Index might already exist: {e}")
        
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
