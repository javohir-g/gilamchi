from app.database import Base
import app.models
from app.models.expense import Expense
from app.models.user import User

print(f"E_tab:{Expense.__tablename__} U_tab:{User.__tablename__}")
for c in Expense.__table__.c:
    fks = [f"{fk.target_fullname}" for fk in c.foreign_keys]
    if fks: print(f"Col:{c.name} -> {','.join(fks)}")

print(f"U_PKs:{[c.name for c in User.__table__.c if c.primary_key]}")
print(f"E_Meta:{id(Expense.metadata)} U_Meta:{id(User.metadata)}")
