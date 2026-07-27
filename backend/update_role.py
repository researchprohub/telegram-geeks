import sys
sys.path.insert(0, '/app')
from app.db.database import SessionLocal
from app.models import User

s = SessionLocal()
u = s.query(User).filter_by(email="testadmin@telegramgeeks.com").first()
print(f"Current role: {u.role}")
u.role = "pro"
s.commit()
print(f"Updated to {u.role}")
s.close()
