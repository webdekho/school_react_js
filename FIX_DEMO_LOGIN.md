# Fix Demo Login - Easy Setup

## The Problem
The demo credentials were not working because the authentication system expects specific table structures.

## Quick Fix

**Run this SQL file to create working demo accounts:**

```bash
mysql -u root -p school_db < database/working_demo_setup.sql
```

Or through phpMyAdmin:
1. Open phpMyAdmin
2. Select `school_db` database  
3. Go to "Import" tab
4. Choose file: `database/working_demo_setup.sql`
5. Click "Go"

## Updated Demo Credentials

All accounts now use the simple password: **`password`**

### 🔐 Admin Account
- **Mobile:** `1111111111`
- **Password:** `password`
- **Access:** Full system access

### 👨‍🏫 Staff Account  
- **Mobile:** `2222222222`
- **Password:** `password`
- **Access:** Limited permissions (filtered sidebar)

### 👨‍👩‍👧‍👦 Parent Account
- **Mobile:** `3333333333`
- **Password:** `password`
- **Access:** Parent portal features

## How to Login

1. **Go to the login page**
2. **Click any demo account card** - credentials auto-fill
3. **Click "Login"**

The demo account cards on the login page have been updated with the correct passwords.

## What Was Fixed

1. **Table Structure**: Demo accounts now use correct tables (`staff` and `parents` instead of `users`)
2. **Password Hash**: Uses the standard bcrypt hash for "password"
3. **Required Fields**: Includes all required fields like `is_active`, `password_hash`, etc.
4. **Authentication Flow**: Matches exactly what the Auth_model expects

## Test the Permission System

- **Login as Admin** → See all menu items
- **Login as Staff** → See filtered menu (only permitted modules)
- **Login as Parent** → Access parent portal

The permission-based sidebar filtering should now work perfectly!

---

🎉 **The demo login should now work without any "invalid credentials" errors!**