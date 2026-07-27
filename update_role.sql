-- Update user role to pro
UPDATE users SET role = 'pro' WHERE email = 'testadmin@telegramgeeks.com';
-- Verify
SELECT id, email, role, is_active FROM users WHERE email = 'testadmin@telegramgeeks.com';
