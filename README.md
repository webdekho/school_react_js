# School Management System

A comprehensive school management system built with CodeIgniter 3 (Backend) and React JS with TypeScript (Frontend). The system supports three user roles: Admin, Staff, and Parent/Student with role-based permissions and features.

## 🚀 Features

### Core Features Implemented ✅
- **Authentication System**: JWT-based authentication for all user roles
- **Admin Dashboard**: Overview with key metrics and statistics
- **Database Schema**: Comprehensive MySQL database with all required tables
- **API Architecture**: RESTful APIs with proper error handling and validation
- **Frontend Framework**: React with TypeScript, Bootstrap 5, and responsive design
- **Role-based Access**: Protected routes and permission-based access control

### Features In Development 🔄
- Fee collection system with multiple fee types
- Role-based permissions management
- Announcement system with multi-channel notifications
- Complaint management system
- Financial management and reporting
- Universal search functionality
- Staff module with limited permissions
- Parent/Student portal interface
- Advanced security measures and data encryption

## 🏗️ System Architecture

### Backend (CodeIgniter 3)
- **Framework**: CodeIgniter 3.x
- **Database**: MySQL with optimized schema
- **Authentication**: JWT tokens with refresh capability
- **API**: RESTful endpoints with versioning support
- **Security**: Input validation, SQL injection prevention, CSRF protection

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Bootstrap 5 with React Bootstrap components
- **State Management**: React Query for server state, Context API for auth
- **Routing**: React Router DOM with protected routes
- **Notifications**: React Hot Toast for user feedback

## 📁 Project Structure

```
School/
├── backend/                    # CodeIgniter 3 Backend
│   ├── application/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # API Controllers
│   │   │   └── api/          # API endpoints
│   │   ├── models/           # Database models
│   │   ├── libraries/        # Custom libraries (JWT)
│   │   └── core/             # Core extensions
│   ├── public/               # Public files and entry point
│   └── system/               # CodeIgniter system files
├── frontend/                  # React TypeScript Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── staff/       # Staff-specific components
│   │   │   ├── parent/      # Parent-specific components
│   │   │   └── common/      # Shared components
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── staff/       # Staff pages
│   │   │   └── parent/      # Parent pages
│   │   ├── services/        # API service layer
│   │   ├── contexts/        # React contexts
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
└── database_schema.sql       # Database setup script
```

## 🛠️ Installation & Setup

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Node.js 16 or higher
- XAMPP/LAMP/WAMP server

### Backend Setup

1. **Database Setup**
   ```bash
   # Create database and import schema
   mysql -u root -p < database_schema.sql
   ```

2. **Configure Database Connection**
   ```php
   // backend/application/config/database.php
   $db['default'] = array(
       'hostname' => 'localhost',
       'username' => 'root',
       'password' => '',
       'database' => 'school_management',
       // ... other settings
   );
   ```

3. **Configure Base URL**
   ```php
   // backend/application/config/config.php
   $config['base_url'] = 'http://localhost/School/backend/public/';
   ```

4. **Set File Permissions**
   ```bash
   chmod -R 755 backend/
   chmod -R 777 backend/application/logs/
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Configure Environment**
   ```bash
   # Create .env file (already created)
   REACT_APP_API_URL=http://localhost/School/backend/public
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

## 🔐 User Roles & Permissions

### Admin
- **Dashboard**: Full system overview with metrics
- **Student Management**: CRUD operations for student records
- **Parent Management**: Manage parent accounts and relationships
- **Staff Management**: Manage staff accounts and role assignments
- **Grade & Division Management**: Academic structure management
- **Fee Management**: Complete fee collection and reporting
- **System Settings**: Configuration and customization

### Staff
- **Limited Dashboard**: Role-based access to assigned classes
- **Student View**: Access to assigned grade/division students
- **Fee Collection**: Collect fees for assigned classes
- **Announcements**: View relevant announcements

### Parent
- **Student Dashboard**: View children's information
- **Fee Status**: Check fee payments and pending amounts
- **Announcements**: Receive school communications
- **Complaints**: Submit and track complaints

## 🗄️ Database Schema

### Core Tables
- **users**: Admin and staff authentication
- **parents**: Parent user accounts
- **students**: Student records with encrypted sensitive data
- **grades**: Academic grade levels
- **divisions**: Class divisions within grades
- **roles**: Permission-based role system
- **staff_grades/staff_divisions**: Staff assignments

### Feature Tables
- **fee_types**: Different types of fees
- **fee_structures**: Fee amounts by grade/category
- **fee_collections**: Payment records
- **announcements**: School communications
- **complaints**: Parent feedback system
- **audit_logs**: System activity tracking

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET/POST/PUT/DELETE /api/admin/grades` - Grade management
- `GET/POST/PUT/DELETE /api/admin/divisions` - Division management
- `GET/POST/PUT/DELETE /api/admin/students` - Student management
- `GET/POST/PUT/DELETE /api/admin/parents` - Parent management
- `GET/POST/PUT/DELETE /api/admin/staff` - Staff management
- `GET /api/admin/search` - Universal search

## 🚀 Deployment

### Production Setup
1. **Backend Deployment**
   - Upload backend files to web server
   - Configure production database settings
   - Set proper file permissions
   - Enable HTTPS for security

2. **Frontend Deployment**
   ```bash
   npm run build
   # Deploy build folder to web server
   ```

3. **Security Considerations**
   - Change default JWT secret keys
   - Enable database encryption for sensitive data
   - Configure proper CORS settings
   - Set up SSL certificates

## 🧪 Testing

### Backend Testing
- API endpoint testing with Postman
- Database integrity testing
- Authentication flow testing

### Frontend Testing
- Component unit testing with React Testing Library
- Integration testing for user flows
- Cross-browser compatibility testing

## 📈 Performance Optimization

### Backend
- Database indexing for frequently queried fields
- Query optimization for large datasets
- Caching implementation for static data
- API response compression

### Frontend
- Code splitting for route-based chunks
- Image optimization and lazy loading
- Bundle size optimization
- Browser caching strategies

## 🔒 Security Features

### Implemented
- JWT-based authentication with expiry
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- CSRF protection
- Sensitive data encryption (Aadhaar numbers)

### Planned
- Two-factor authentication
- Rate limiting for API endpoints
- Advanced audit logging
- Data backup and recovery
- GDPR compliance features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core authentication system
- ✅ Admin dashboard and basic management
- ✅ Database schema and API structure
- ✅ React frontend with routing

### Phase 2 (Next)
- 🔄 Complete fee management system
- 🔄 Announcement and notification system
- 🔄 Complaint management workflow
- 🔄 Advanced reporting and analytics

### Phase 3 (Future)
- 📱 Mobile app development
- 🌐 Multi-language support
- 📊 Advanced analytics dashboard
- 🔗 Third-party integrations (SMS, Email, Payment gateways)

---

**Version**: 1.0.0  
**Last Updated**: August 2024  
**Development Status**: Active Development# school_react_js
