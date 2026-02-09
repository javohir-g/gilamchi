from sqlalchemy import create_engine, MetaData, Table, select, update, DECIMAL
from decimal import Decimal
import os

# Database URL
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gilamchi"

def migrate_debts():
    # Fixed exchange rate for migration
    EXCHANGE_RATE = Decimal("12200.0")
    
    engine = create_engine(DATABASE_URL)
    metadata = MetaData()
    
    # Reflect tables
    debts = Table('debts', metadata, autoload_with=engine)
    payments = Table('payments', metadata, autoload_with=engine)
    
    with engine.connect() as conn:
        # 1. Migrate Debts
        print("Migrating debts...")
        all_debts = conn.execute(select(debts)).fetchall()
        for debt in all_debts:
            # We assume current values are in USD (< 100000)
            if debt.total_amount < 100000:
                print(f"Updating debt {debt.id} for {debt.debtor_name}")
                new_total = debt.total_amount * EXCHANGE_RATE
                new_paid = debt.paid_amount * EXCHANGE_RATE
                new_initial = debt.initial_payment * EXCHANGE_RATE
                new_remaining = debt.remaining_amount * EXCHANGE_RATE
                
                conn.execute(
                    update(debts)
                    .where(debts.c.id == debt.id)
                    .values(
                        total_amount=new_total,
                        paid_amount=new_paid,
                        initial_payment=new_initial,
                        remaining_amount=new_remaining
                    )
                )
        
        # 2. Migrate Payments
        print("Migrating payments...")
        all_payments = conn.execute(select(payments)).fetchall()
        for payment in all_payments:
            if payment.amount < 100000:
                print(f"Updating payment {payment.id}")
                new_amount = payment.amount * EXCHANGE_RATE
                conn.execute(
                    update(payments)
                    .where(payments.c.id == payment.id)
                    .values(amount=new_amount)
                )
        
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_debts()
