# 🚀 School Management System - Production Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Build Process](#build-process)
3. [Server Setup](#server-setup)
4. [Database Configuration](#database-configuration)
5. [Security Configuration](#security-configuration)
6. [Testing](#testing)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Server Requirements
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **PHP**: 7.4+ (8.0+ recommended)
- **Database**: MySQL 5.7+ or MariaDB 10.3+
- **SSL Certificate**: Required for production
- **Memory**: Minimum 512MB RAM (2GB+ recommended)
- **Storage**: Minimum 1GB free space

### PHP Extensions Required
```bash
# Check if extensions are installed
php -m | grep -E "(mysqli|json|mbstring|openssl|curl|gd|zip)"
```

Required extensions:
- mysqli
- json
- mbstring
- openssl
- curl
- gd (for image processing)
- zip

## 🔨 Build Process

### Step 1: Run the Build Script
```bash
# Navigate to your project directory
cd /Applications/XAMPP/xamppfiles/htdocs/School

# Run the production build script
./build-production.sh
```

### Step 2: Manual Frontend Build (if needed)
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 3: Verify Build Output
The build script creates:
- `build/school-management-production/` - Complete application
- `build/school-management-production-YYYYMMDD-HHMMSS.tar.gz` - Archive for deployment

## 🖥️ Server Setup

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/html/school-management
    
    # Redirect HTTP to HTTPS
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/html/school-management
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # PHP Configuration
    php_flag display_errors Off
    php_flag log_errors On
    php_value error_log /var/log/apache2/school_errors.log
</VirtualHost>
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    root /var/www/html/school-management;
    index index.html index.php;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React) routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API routes
    location /backend/ {
        try_files $uri $uri/ /backend/index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Block access to sensitive files
    location ~ /\.(env|git|svn) {
        deny all;
    }
}
```

## 🗄️ Database Configuration

### Step 1: Create Production Database
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Create database user
CREATE USER 'school_user'@'localhost' IDENTIFIED BY 'strong_password_here';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON school_management.* TO 'school_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Import Database Structure
```bash
# Export from development
mysqldump -u root -p school_management > school_management_backup.sql

# Import to production
mysql -u school_user -p school_management < school_management_backup.sql
```

### Step 3: Update Database Configuration
Edit `backend/application/config/production.php`:
```php
$config['database'] = [
    'hostname' => 'localhost',
    'username' => 'school_user',
    'password' => 'your_strong_password',
    'database' => 'school_management',
    'dbdriver' => 'mysqli',
    'db_debug' => FALSE,  // Important: Disable in production
    // ... other settings
];
```

## 🔐 Security Configuration

### Step 1: Generate Secure Keys
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate encryption key (32+ characters)
openssl rand -base64 32
```

### Step 2: Update Configuration
In `backend/application/config/production.php`:
```php
// Use the generated keys
$config['jwt_secret'] = 'your_generated_jwt_secret_here';
$config['encryption_key'] = 'your_generated_encryption_key_here';

// Security settings
$config['log_threshold'] = 1; // Only errors
$config['base_url'] = 'https://yourdomain.com/';
```

### Step 3: File Permissions
```bash
# Set proper permissions
chmod -R 755 /var/www/html/school-management
chmod -R 777 /var/www/html/school-management/backend/application/logs
chmod -R 777 /var/www/html/school-management/backend/application/cache

# Secure sensitive files
chmod 600 /var/www/html/school-management/backend/application/config/production.php
```

### Step 4: Remove Debug Files
```bash
# Remove any debug/test files
find /var/www/html/school-management -name "debug_*.php" -delete
find /var/www/html/school-management -name "test_*.php" -delete
find /var/www/html/school-management -name "check_*.php" -delete
```

## 🧪 Testing

### Step 1: Basic Functionality Test
```bash
# Test API endpoint
curl -k https://yourdomain.com/backend/api/admin/debug_auth

# Should return 401 (unauthorized) - this is correct
```

### Step 2: Login Test
1. Access: `https://yourdomain.com`
2. Try logging in with admin credentials
3. Verify dashboard loads correctly
4. Test fee collection functionality

### Step 3: Database Connection Test
```php
// Create test file: test_db.php (remove after testing)
<?php
$mysqli = new mysqli('localhost', 'school_user', 'password', 'school_management');
if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}
echo 'Database connection successful!';
$mysqli->close();
?>
```

## 📊 Monitoring & Maintenance

### Step 1: Error Logging
Monitor these log files:
- `/var/log/apache2/error.log` (Apache)
- `/var/log/nginx/error.log` (Nginx)
- `backend/application/logs/log-YYYY-MM-DD.php`

### Step 2: Backup Setup
```bash
# Create backup script (already included in build)
chmod +x backup-script.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### Step 3: Performance Monitoring
Monitor:
- Server resources (CPU, Memory, Disk)
- Database performance
- API response times
- Error rates

## 🔧 Troubleshooting

### Common Issues

#### 1. "Internal Server Error"
- Check Apache/Nginx error logs
- Verify file permissions
- Check PHP error logs

#### 2. Database Connection Failed
```bash
# Test database connection
mysql -u school_user -p school_management
```

#### 3. API Returns 404
- Verify .htaccess files are in place
- Check web server configuration
- Ensure mod_rewrite is enabled (Apache)

#### 4. Frontend Not Loading
- Check if build files exist
- Verify index.html is in root directory
- Check browser console for errors

### Debug Mode (Temporary)
Only for troubleshooting - disable after fixing:
```php
// In backend/application/config/production.php
$config['log_threshold'] = 4; // Show all logs temporarily
```

## 📞 Support

### Emergency Contacts
- **Developer**: [Your contact information]
- **System Admin**: [System admin contact]
- **Hosting Provider**: [Provider support contact]

### Useful Commands
```bash
# Check PHP version
php -v

# Check Apache status
systemctl status apache2

# Check MySQL status
systemctl status mysql

# View recent errors
tail -f /var/log/apache2/error.log

# Check disk space
df -h

# Check memory usage
free -m
```

---

## ✅ Final Checklist

Before going live:
- [ ] SSL certificate installed and working
- [ ] All configuration files updated with production values
- [ ] Database imported and user configured
- [ ] All debug files removed
- [ ] File permissions set correctly
- [ ] Backup system configured
- [ ] Error monitoring set up
- [ ] All functionality tested
- [ ] Admin users created
- [ ] Documentation updated

**Remember**: Always test thoroughly in a staging environment before deploying to production!