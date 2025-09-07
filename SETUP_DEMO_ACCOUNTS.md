# Quick Demo Setup Guide

## Step 1: Run Demo Account Creation

Execute this SQL file to create demo accounts:

```bash
mysql -u root -p school_db < database/quick_demo_setup.sql
```

Or through phpMyAdmin:
1. Open phpMyAdmin
2. Select `school_db` database  
3. Go to "Import" tab
4. Choose file: `database/quick_demo_setup.sql`
5. Click "Go"

## Step 2: Demo Accounts Created

The following demo accounts will be available:

### 🔐 Admin Account
- **Mobile:** `1111111111`
- **Password:** `Admin@123`
- **Access:** Full system access

### 👨‍🏫 Staff Account  
- **Mobile:** `2222222222`
- **Password:** `Staff@123`
- **Access:** Limited permissions (view-only for most modules)

### 👨‍👩‍👧‍👦 Parent Account
- **Mobile:** `3333333333`
- **Password:** `Parent@123`
- **Access:** Parent portal features

## Step 3: Login

1. Go to the login page
2. **Click on any demo account card** to auto-fill credentials
3. Or manually enter the mobile number and password
4. Select the correct user type
5. Click "Login"

## Features to Test

### Admin Login
- Full access to all modules
- Can see all menu items in sidebar
- Create/edit/delete permissions everywhere

### Staff Login  
- **Filtered sidebar** - only shows allowed modules
- **Permission-based access** - some modules view-only
- **Route protection** - can't access restricted pages via URL

### Parent Login
- Parent dashboard with student information
- Fee payment history
- Complaint submission
- Announcements viewing

## Security Notes

⚠️ **Important:** These are demo accounts for testing only.

**For production:**
1. Delete these demo accounts
2. Change all default passwords  
3. Create proper admin accounts
4. Set up real staff roles and permissions

## Troubleshooting

**Login fails?**
- Verify SQL file was executed successfully
- Check that demo accounts exist in `users` table
- Ensure authentication service is working

**Staff can see all menus?**
- Check if staff role has correct permissions
- Verify permission-based filtering is working
- Check browser console for errors

**Permission denied errors?**
- Normal for staff accessing restricted areas
- Verify PermissionGuard component is working
- Check user permissions in database

---

🎉 **You're all set!** The system now has full permission-based access control with demo accounts ready for testing.