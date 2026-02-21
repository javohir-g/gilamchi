from app.database import Base
from app.models.expense import Expense
from app.models.user import User
from sqlalchemy import inspect

print(f"Expense Metadata: {Expense.metadata}")
print(f"User Metadata: {User.metadata}")
print(f"Are they same? {Expense.metadata is User.metadata}")

print("\nExpense Foreign Keys:")
for fk in Expense.__table__.foreign_keys:
    print(f"  {fk.column} <- {fk.parent}")

print("\nInspector Check:")
inspector = inspect(Expense)
for rel in inspector.mapper.relationships:
    print(f"Relationship: {rel.key}")
    try:
        print(f"  Target: {rel.target}")
        print(f"  Join condition: {rel.primaryjoin}")
    except Exception as e:
        print(f"  Error inspecting relationship: {e}")
