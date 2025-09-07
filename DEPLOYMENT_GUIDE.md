# 🚀 School Management System - Deployment Guide

## Quick Start Guide

### Prerequisites
- ✅ XAMPP/LAMP/WAMP server running
- ✅ PHP 7.4+ installed
- ✅ MySQL 5.7+ running
- ✅ Node.js 16+ installed

### 🗄️ Database Setup

1. **Start MySQL server** (via XAMPP or standalone)

2. **Create database and import schema**:
   ```bash
   # Option 1: Using MySQL command line
   mysql -u root -p
   CREATE DATABASE school_management;
   USE school_management;
   SOURCE /path/to/School/database_schema.sql;
   
   # Option 2: Using phpMyAdmin
   # - Open http://localhost/phpmyadmin
   # - Create new database 'school_management'
   # - Import database_schema.sql file
   ```

3. **Verify database setup**:
   - Check that all 15+ tables are created
   - Verify default roles and fee types are inserted

### 🔧 Backend Setup (CodeIgniter 3)

1. **Configure database connection**:
   ```php
   // backend/application/config/database.php
   $db['default'] = array(
       'hostname' => 'localhost',
       'username' => 'root',
       'password' => '',  // Your MySQL password
       'database' => 'school_management',
       // ... rest of config is already set
   );
   ```

2. **Set correct base URL**:
   ```php
   // backend/application/config/config.php
   $config['base_url'] = 'http://localhost/School/backend/public/';
   ```

3. **Test backend API**:
   ```bash
   # Open in browser or use curl
   curl http://localhost/School/backend/public/
   
   # Should return JSON response with API info
   ```

### ⚛️ Frontend Setup (React)

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Configure API URL** (already configured):
   ```bash
   # .env file already created with:
   REACT_APP_API_URL=http://localhost/School/backend/public
   ```

3. **Start development server**:
   ```bash
   npm start
   # Opens http://localhost:3000
   ```

4. **For production build**:
   ```bash
   npm run build
   # Creates build/ folder for deployment
   ```

## 🔐 Default Login Credentials

Since this is a fresh installation, you'll need to create initial admin user:

### Method 1: Direct Database Insert
```sql
-- Insert admin role (if not exists)
INSERT INTO roles (name, description, permissions) VALUES 
('super_admin', 'Super Administrator', '["*"]');

-- Insert admin user
INSERT INTO staff (name, mobile, email, role_id, password_hash, created_at) VALUES 
('System Admin', '1234567890', 'admin@school.com', 1, '$2y$10$YourHashedPasswordHere', NOW());

-- For password hash, you can use PHP:
-- password_hash('admin123', PASSWORD_DEFAULT)
```

### Method 2: Create Registration Endpoint (Temporary)
Add a temporary registration endpoint in the backend for initial setup.

## 🧪 Testing the System

### 1. Backend API Testing
```bash
# Test welcome endpoint
curl http://localhost/School/backend/public/

# Test login endpoint (after creating admin user)
curl -X POST http://localhost/School/backend/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"1234567890","password":"admin123","user_type":"admin"}'
```

### 2. Frontend Testing
1. Open http://localhost:3000
2. Should see login page
3. Try logging in with admin credentials
4. Should redirect to admin dashboard

## 📁 Project Structure Verification

```
School/
├── backend/                    ✅ CodeIgniter 3 Backend
│   ├── application/
│   │   ├── config/            ✅ Database & API config
│   │   ├── controllers/api/   ✅ REST API endpoints
│   │   ├── models/           ✅ Database models
│   │   ├── libraries/        ✅ JWT authentication
│   │   └── core/             ✅ Base API controller
│   └── public/               ✅ Entry point
├── frontend/                  ✅ React TypeScript Frontend
│   ├── src/
│   │   ├── components/       ✅ UI components
│   │   ├── pages/           ✅ Page components
│   │   ├── services/        ✅ API services
│   │   ├── contexts/        ✅ React contexts
│   │   └── types/           ✅ TypeScript types
│   └── build/               ✅ Production build (after npm run build)
├── database_schema.sql       ✅ Database setup
└── README.md                ✅ Documentation
```

## 🚨 Common Issues & Solutions

### Backend Issues

**Issue**: "No direct script access allowed"
```bash
# Solution: Check .htaccess file exists in public/ folder
# Ensure mod_rewrite is enabled in Apache
```

**Issue**: Database connection failed
```bash
# Solution: Verify MySQL is running and credentials are correct
# Check if 'school_management' database exists
```

**Issue**: CORS errors
```bash
# Solution: Headers are already configured in controllers
# Check if Apache mod_headers is enabled
```

### Frontend Issues

**Issue**: API calls failing
```bash
# Solution: Verify backend is running at correct URL
# Check .env file has correct REACT_APP_API_URL
```

**Issue**: Build fails
```bash
# Solution: Run 'npm install --legacy-peer-deps' again
# Clear node_modules and reinstall if needed
```

**Issue**: Port 3000 already in use
```bash
# Solution: Either stop other process or use different port
npm start -- --port 3001
```

## 🔧 Production Deployment

### Backend Deployment
1. Upload backend files to web server
2. Configure production database settings
3. Set proper file permissions (755 for folders, 644 for files)
4. Ensure logs folder is writable (777)
5. Configure SSL/HTTPS

### Frontend Deployment
1. Run `npm run build`
2. Upload build/ folder contents to web server
3. Configure web server to serve index.html for all routes
4. Update .env with production API URL

## 📊 System Status Check

After deployment, verify these endpoints:

- ✅ Backend API: `http://yourserver/backend/public/`
- ✅ Admin Login: `http://yourserver/` 
- ✅ Database Connection: Check API responses
- ✅ JWT Authentication: Test login/logout flow
- ✅ CORS Headers: Check browser network tab

## 🎯 Next Steps

1. **Create Admin User**: Set up initial admin account
2. **Add Sample Data**: Create grades, divisions, test students
3. **Test Features**: Verify all implemented features work
4. **Customize**: Update school name, logo, colors
5. **Extend**: Implement remaining features as needed

## 🆘 Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check Apache error logs for backend issues
3. Verify database connections and queries
4. Test API endpoints individually
5. Ensure all dependencies are installed

---

**System Status**: ✅ **Ready for Use**  
**Version**: 1.0.0  
**Last Updated**: August 2024