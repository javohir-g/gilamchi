# Gilamchi Server Update Guide

This guide explains how to apply the recent changes (Expense bug fix and UI simplification) to your production server at `62.171.165.103`.

## Prerequisites
- You are connected to the server via SSH as `root`.
- You are in the project root directory (usually `/root/gilamchi` or similar).

## Step-by-Step Instructions

### 1. Update the Code
If you are using Git, run:
```bash
git pull origin main
```
*If you are not using Git, you may need to upload the changed files manually using SFTP/SCP.*

### 2. Apply Database Schema Fix
Since we updated the `expenses` table structure, you need to run the migration script on the server:
```bash
docker exec -it gilamchi-backend-1 python fix_expenses_table.py
```
*(Note: If the container name is different, use `docker ps` to find the backend container name).*

### 3. Rebuild and Restart Containers
To apply the frontend UI changes and backend code updates:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This will:
- Re-compile the Frontend with the simplified `AddExpense` design.
- Update the Backend API with the `staff_id` fix.

### 4. Verify
After the build completes, check the logs to ensure everything started correctly:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## Useful Commands
- **Check Status**: `docker ps`
- **Restart Backend**: `docker compose -f docker-compose.prod.yml restart backend`
- **View Frontend Build Logs**: `docker compose -f docker-compose.prod.yml logs frontend`
