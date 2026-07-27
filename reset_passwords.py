import bcrypt
# Generate proper bcrypt hashes
emails = ['admin@telegramgeeks.com', 'a@b.com', 'admin@test.com', 'user@test.com']
passwords = ['AdminPass123!', 'AdminPass123!', 'Testpass123!', 'UserPass123!']
updates = []
for email, pw in zip(emails, passwords):
    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12)).decode()
    updates.append(f"UPDATE users SET hashed_password = '{hashed}' WHERE email = '{email}';")
    print(f"{email}: {hashed}")

# Write SQL file
with open('/tmp/reset_passwords.sql', 'w') as f:
    f.write('\n'.join(updates))
print("\n--- SQL file written ---")
