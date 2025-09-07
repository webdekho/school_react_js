# Demo Credentials

This file contains the demo login credentials for testing the School Management System.

## How to Set Up Demo Accounts

1. **Run the demo credentials SQL file:**
   ```bash
   mysql -u root -p school_db < database/demo_credentials.sql
   ```

2. **Or manually import:**
   - Open phpMyAdmin or your MySQL client
   - Select the `school_db` database
   - Import the file: `database/demo_credentials.sql`

## Demo Login Credentials

### 🔐 Admin Account
- **Mobile:** `1111111111`
- **Password:** `Admin@123`
- **Access Level:** Full administrative access to all modules

### 👨‍🏫 Staff Account
- **Mobile:** `2222222222`
- **Password:** `Staff@123`
- **Access Level:** Limited permissions including:
  - Dashboard (view)
  - Students (view only)
  - Parents (view only)
  - Grades & Divisions (view only)
  - Fee Categories & Structures (view only)
  - Fee Collection (full access)
  - Announcements (view only)
  - Complaints (full access)
  - Reports (view)

### 👨‍👩‍👧‍👦 Parent Account
- **Mobile:** `3333333333`
- **Password:** `Parent@123`
- **Access Level:** Parent portal access including:
  - Student information
  - Fee payment history
  - Submit complaints
  - View announcements

## Security Notes

⚠️ **Important:** These are demo accounts for testing purposes only. 

**For production use:**
1. Delete or disable these demo accounts
2. Change all default passwords
3. Create proper admin accounts with secure passwords
4. Set up appropriate roles and permissions for staff

## Testing Permission-Based Access

1. **Login as Admin** - You should see all menu items and have full access
2. **Login as Staff** - Menu will be filtered based on assigned permissions
3. **Login as Parent** - Access to parent dashboard with limited functionality

## Troubleshooting

If login fails:
1. Verify the SQL file was executed successfully
2. Check that the `users`, `staff`, and `parents` tables exist
3. Ensure password hashes are correctly stored
4. Verify the authentication service is working

## Additional Demo Data

The SQL file also creates:
- A demo staff role with limited permissions
- A staff wallet with sample balance
- A demo parent profile
- A demo student (if academic year and grades exist)

---

**Last Updated:** $(date)
**Version:** 1.0