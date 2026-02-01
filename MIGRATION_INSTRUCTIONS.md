# Nasiya Migration Instructions

The backend container needs to be rebuilt to include the migration script.

## Run these commands on the production server:

```bash
cd ~/gilamchi

# Rebuild and restart the backend container
docker compose -f docker-compose.prod.yml up -d --build backend

# Wait for the container to be ready (about 10-15 seconds)
sleep 15

# Run the migration
docker compose -f docker-compose.prod.yml exec backend python migration_nasiya.py

# Restart backend to ensure clean state
docker compose -f docker-compose.prod.yml restart backend
```

## What the migration does:
- Adds `price_nasiya_per_sqm` column to `collections` table
- Adds `order_id` column to `debts` table (with index)
- Adds `is_nasiya` column to `sales` table

The script is idempotent and safe to run multiple times.
