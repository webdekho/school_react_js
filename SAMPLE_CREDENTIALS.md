# 🔐 School Management System - Sample Credentials

## 📋 **Quick Setup Instructions**

1. **Import Database Schema**:
   ```sql
   mysql -u root -p < database_schema.sql
   ```

2. **Import Sample Data** (Choose one method):
   
   **Method A - Safe Import (Recommended)**:
   ```sql
   mysql -u root -p < sample_data_safe.sql
   ```
   
   **Method B - Original (if you get foreign key errors, use Method A)**:
   ```sql
   mysql -u root -p < sample_data.sql
   ```

3. **Start Backend**: Ensure CodeIgniter backend is running at `http://localhost/School/backend/public/`

4. **Start Frontend**: Run `npm start` in the frontend directory

---

## 👨‍💼 **Admin/Staff Credentials**

### **Super Administrator**
- **Mobile**: `9999999999`
- **Password**: `password123`
- **User Type**: `admin`
- **Access**: Full system access, all permissions
- **Email**: admin@school.com

### **Principal (Admin)**
- **Mobile**: `9876543210`
- **Password**: `password123`
- **User Type**: `admin`
- **Name**: Dr. Rajesh Kumar
- **Email**: principal@school.com

### **Vice Principal (Admin)**
- **Mobile**: `9876543211`
- **Password**: `password123`
- **User Type**: `admin`
- **Name**: Mrs. Priya Sharma
- **Email**: vp@school.com

---

## 👩‍🏫 **Teacher/Staff Credentials**

### **Nursery & LKG Teacher**
- **Mobile**: `9876543212`
- **Password**: `password123`
- **User Type**: `staff`
- **Name**: Mr. Amit Patel
- **Assigned**: Nursery A,B & LKG A,B
- **Email**: amit.teacher@school.com

### **UKG & Class 1 Teacher**
- **Mobile**: `9876543213`
- **Password**: `password123`
- **User Type**: `staff`
- **Name**: Ms. Sunita Joshi
- **Assigned**: UKG A,B & Class 1 A,B,C
- **Email**: sunita.teacher@school.com

### **Class 2 & 3 Teacher**
- **Mobile**: `9876543214`
- **Password**: `password123`
- **User Type**: `staff`
- **Name**: Mr. Vikram Singh
- **Assigned**: Class 2 A,B & Class 3 A
- **Email**: vikram.teacher@school.com

### **Class 4 & 5 Teacher**
- **Mobile**: `9876543215`
- **Password**: `password123`
- **User Type**: `staff`
- **Name**: Mrs. Kavita Reddy
- **Assigned**: Class 4 A & Class 5 A
- **Email**: kavita.teacher@school.com

### **Higher Classes Teacher**
- **Mobile**: `9876543216`
- **Password**: `password123`
- **User Type**: `staff`
- **Name**: Mr. Arjun Gupta
- **Assigned**: Class 6, 7, 8
- **Email**: arjun.teacher@school.com

---

## 👨‍👩‍👧‍👦 **Parent Credentials**

### **Parent 1 - Ramesh Agarwal**
- **Mobile**: `8888888801`
- **Password**: `parent123`
- **User Type**: `parent`
- **Children**: Arjun Agarwal (Nursery A), Aarav Agarwal (Nursery A)
- **Email**: ramesh.agarwal@email.com

### **Parent 2 - Meera Jain**
- **Mobile**: `8888888802`
- **Password**: `parent123`
- **User Type**: `parent`
- **Children**: Priya Jain (Nursery B), Isha Jain (LKG A)
- **Email**: meera.jain@email.com

### **Parent 3 - Suresh Patel**
- **Mobile**: `8888888803`
- **Password**: `parent123`
- **User Type**: `parent`
- **Children**: Rohit Patel (LKG A), Dev Patel (UKG A)
- **Email**: suresh.patel@email.com

### **Parent 4 - Anita Sharma**
- **Mobile**: `8888888804`
- **Password**: `parent123`
- **User Type**: `parent`
- **Children**: Sneha Sharma (LKG B), Myra Sharma (Class 1 A)
- **Email**: anita.sharma@email.com

### **Parent 5 - Deepak Kumar**
- **Mobile**: `8888888805`
- **Password**: `parent123`
- **User Type**: `parent`
- **Children**: Kiran Kumar (UKG A), Aryan Kumar (Class 2 A)
- **Email**: deepak.kumar@email.com

### **Additional Parent Accounts**
All follow the same pattern:
- **Mobile**: `8888888806` to `8888888810`
- **Password**: `parent123`
- **User Type**: `parent`

---

## 📊 **Sample Data Overview**

### **Academic Structure**
- **Grades**: 13 grades (Nursery to Class 10)
- **Divisions**: 19 divisions across different grades
- **Students**: 15 sample students with complete profiles
- **Staff**: 8 staff members with role assignments

### **Fee Structure**
- **Fee Types**: 7 different fee categories
- **Sample Collections**: 8 fee payment records
- **Payment Methods**: Cash, Online, Cheque, DD

### **System Features**
- ✅ **Complaints**: 5 sample complaints with different statuses
- ✅ **Announcements**: 4 sample announcements for testing
- ✅ **Audit Logs**: Activity tracking enabled
- ✅ **Permissions**: Role-based access control
- ✅ **Encrypted Data**: Aadhaar numbers properly encrypted

---

## 🧪 **Testing Scenarios**

### **Admin Login Testing**
1. Login as Super Admin (`9999999999` / `password123`)
2. View dashboard with student/staff statistics
3. Manage grades, divisions, students, and staff
4. Process fee collections
5. Send announcements
6. Handle complaints

### **Staff Login Testing**
1. Login as Teacher (`9876543212` / `password123`)
2. View assigned classes only
3. Collect fees for assigned students
4. View student lists with limited access
5. Check announcements

### **Parent Login Testing**
1. Login as Parent (`8888888801` / `parent123`)
2. View children's details and academic info
3. Check fee payment history
4. Submit complaints
5. View school announcements

### **API Testing**
```bash
# Test login endpoint
curl -X POST http://localhost/School/backend/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9999999999","password":"password123","user_type":"admin"}'

# Test dashboard endpoint (use token from login response)
curl -X GET http://localhost/School/backend/public/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚀 **Quick Login Guide**

### **Frontend Login Page**
1. Open: `http://localhost:3000` (or 3001)
2. Select user type from dropdown
3. Enter mobile number and password
4. Click "Sign In"

### **User Type Selection**
- **Admin**: Full system management
- **Staff**: Limited to assigned classes
- **Parent**: Student and fee information only

### **Dashboard Access**
- **Admin**: `/admin` - Complete system overview
- **Staff**: `/staff` - Limited staff dashboard  
- **Parent**: `/parent` - Student-focused dashboard

---

## 🔧 **Troubleshooting**

### **Login Issues**
- Ensure database is properly imported
- Check backend API is running
- Verify correct mobile number format
- Confirm user type matches database role

### **Permission Errors**
- Super Admin has all permissions (`*`)
- Staff permissions based on role assignments
- Parents can only access their children's data

### **Database Connection**
```php
// Check backend/application/config/database.php
$db['default'] = array(
    'hostname' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'school_management',
    // ...
);
```

---

## 🎯 **Next Steps After Login**

### **For Admins**
1. ✅ View dashboard metrics
2. ✅ Add new students/staff
3. ✅ Process fee collections
4. ✅ Send announcements
5. ✅ Manage complaints

### **For Staff**
1. ✅ Check assigned classes
2. ✅ Collect fees from students
3. ✅ View student information
4. ✅ Read announcements

### **For Parents**
1. ✅ View children's profiles
2. ✅ Check fee payment status
3. ✅ Submit complaints
4. ✅ Read school announcements

---

## 📧 **Support Information**

**Default School**: Bright Future Academy  
**Academic Year**: 2024-25  
**Database**: school_management  
**Total Sample Users**: 18 (8 staff + 10 parents)  
**Total Sample Students**: 15  

All passwords are hashed using PHP's `password_hash()` function for security.

---

**🎉 Ready to Test!** Use any of the above credentials to explore the School Management System's features and functionality.