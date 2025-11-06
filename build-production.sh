#!/bin/bash

# School Management System - Production Build Script
# This script prepares the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting Production Build Process..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
DIST_DIR="$BUILD_DIR/school-management-production"

echo -e "${BLUE}Project Root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}Build Directory: $BUILD_DIR${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create build directory
echo -e "\n${BLUE}1. Setting up build environment...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$DIST_DIR"
print_status "Build directory created"

# Frontend Build
echo -e "\n${BLUE}2. Building Frontend (React)...${NC}"
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    # Install dependencies
    echo "Installing frontend dependencies..."
    npm install
    print_status "Frontend dependencies installed"
    
    # Run build
    echo "Building React application..."
    npm run build
    print_status "Frontend build completed"
    
    # Copy build to distribution
    cp -r build/* "$DIST_DIR/"
    print_status "Frontend files copied to distribution"
    
    cd "$PROJECT_ROOT"
else
    print_warning "Frontend directory not found, skipping frontend build"
fi

# Backend Preparation
echo -e "\n${BLUE}3. Preparing Backend (PHP/CodeIgniter)...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    # Create backend directory in distribution
    mkdir -p "$DIST_DIR/backend"
    
    # Copy backend files (excluding development files)
    rsync -av --exclude='logs/' \
              --exclude='cache/' \
              --exclude='.git/' \
              --exclude='*.log' \
              --exclude='*.tmp' \
              --exclude='test_*.php' \
              --exclude='debug_*.php' \
              --exclude='check_*.php' \
              --exclude='create_test_*.php' \
              "$BACKEND_DIR/" "$DIST_DIR/backend/"
    
    print_status "Backend files copied"
    
    # Set proper permissions
    chmod -R 755 "$DIST_DIR/backend"
    chmod -R 777 "$DIST_DIR/backend/application/logs" 2>/dev/null || true
    chmod -R 777 "$DIST_DIR/backend/application/cache" 2>/dev/null || true
    
    print_status "Backend permissions set"
else
    print_error "Backend directory not found"
    exit 1
fi

# Environment Configuration
echo -e "\n${BLUE}4. Setting up production environment...${NC}"

# Create production config template
cat > "$DIST_DIR/backend/application/config/production.php" << 'EOF'
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
|--------------------------------------------------------------------------
| Production Environment Configuration
|--------------------------------------------------------------------------
*/

// Database Configuration for Production
$config['database'] = [
    'hostname' => 'YOUR_PRODUCTION_DB_HOST',
    'username' => 'YOUR_PRODUCTION_DB_USER',
    'password' => 'YOUR_PRODUCTION_DB_PASS',
    'database' => 'YOUR_PRODUCTION_DB_NAME',
    'dbdriver' => 'mysqli',
    'dbprefix' => '',
    'pconnect' => FALSE,
    'db_debug' => FALSE,  // Disable in production
    'cache_on' => FALSE,
    'cachedir' => '',
    'char_set' => 'utf8mb4',
    'dbcollat' => 'utf8mb4_general_ci',
    'swap_pre' => '',
    'encrypt' => FALSE,
    'compress' => FALSE,
    'stricton' => FALSE,
    'failover' => [],
    'save_queries' => FALSE
];

// JWT Configuration
$config['jwt_secret'] = 'YOUR_STRONG_JWT_SECRET_KEY_HERE_CHANGE_THIS';
$config['jwt_expire'] = 7200; // 2 hours

// Security Settings
$config['encryption_key'] = 'YOUR_ENCRYPTION_KEY_HERE_CHANGE_THIS';

// Logging
$config['log_threshold'] = 1; // Only errors in production

// Base URL (update for your domain)
$config['base_url'] = 'https://yourdomain.com/';

// Email Configuration (if using email features)
$config['email'] = [
    'protocol' => 'smtp',
    'smtp_host' => 'your-smtp-host.com',
    'smtp_port' => 587,
    'smtp_user' => 'your-email@domain.com',
    'smtp_pass' => 'your-email-password',
    'smtp_crypto' => 'tls',
    'mailtype' => 'html',
    'charset' => 'utf-8'
];
EOF

print_status "Production configuration template created"

# Create .htaccess for security
cat > "$DIST_DIR/backend/.htaccess" << 'EOF'
# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Hide sensitive files
<Files ~ "^(\.env|\.git|composer\.(json|lock)|package\.(json|lock))$">
    Order allow,deny
    Deny from all
</Files>

# Disable directory browsing
Options -Indexes

# URL Rewriting
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [QSA,L]

# Block access to application folder
RewriteCond %{REQUEST_URI} ^application.*
RewriteRule ^(.*)$ /index.php?/$1 [R=301,L]
EOF

print_status "Security .htaccess created"

# Frontend production configuration
cat > "$DIST_DIR/.htaccess" << 'EOF'
# Frontend .htaccess for React Router
RewriteEngine On

# Handle Angular and React Router
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
EOF

print_status "Frontend .htaccess created"

# Create database migration script
cat > "$DIST_DIR/database-setup.sql" << 'EOF'
-- Database Setup for Production
-- Run this script on your production database

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Use the database
USE school_management;

-- Note: Import your existing database structure and data here
-- You can export from your development database using:
-- mysqldump -u root -p school_management > database_backup.sql

-- Then import on production:
-- mysql -u production_user -p school_management < database_backup.sql

-- Update any development-specific data
-- UPDATE settings SET value = 'production' WHERE setting_key = 'environment';
-- UPDATE settings SET value = 'https://yourdomain.com' WHERE setting_key = 'base_url';
EOF

print_status "Database setup script created"

# Create deployment checklist
cat > "$DIST_DIR/DEPLOYMENT-CHECKLIST.md" << 'EOF'
# 📋 Production Deployment Checklist

## Prerequisites
- [ ] Web server (Apache/Nginx) with PHP 7.4+ support
- [ ] MySQL 5.7+ or MariaDB 10.3+
- [ ] SSL certificate configured
- [ ] Domain name configured

## Database Setup
- [ ] Create production database
- [ ] Import database structure and data
- [ ] Create database user with appropriate permissions
- [ ] Update database credentials in `backend/application/config/production.php`

## Configuration
- [ ] Update `backend/application/config/production.php`:
  - [ ] Database credentials
  - [ ] JWT secret key (generate strong random key)
  - [ ] Encryption key (generate strong random key)
  - [ ] Base URL (your domain)
  - [ ] Email configuration (if using email features)
- [ ] Update frontend API URLs if different from backend location

## Security
- [ ] Change all default passwords
- [ ] Ensure debug mode is disabled
- [ ] Verify .htaccess files are in place
- [ ] Test file upload restrictions
- [ ] Verify database user has minimal required permissions

## Testing
- [ ] Test user login (admin and staff)
- [ ] Test fee collection functionality
- [ ] Test file uploads (if any)
- [ ] Test email sending (if configured)
- [ ] Test API endpoints
- [ ] Verify role-based access control

## Performance
- [ ] Enable gzip compression
- [ ] Configure cache headers
- [ ] Optimize database indexes
- [ ] Consider setting up CDN for static assets

## Monitoring
- [ ] Set up error logging
- [ ] Configure backup system
- [ ] Set up monitoring/alerts
- [ ] Document maintenance procedures

## Post-Deployment
- [ ] Test all critical functionality
- [ ] Create admin user accounts
- [ ] Import initial data (if required)
- [ ] Train users on the system
- [ ] Set up regular backups

## Emergency Contacts
- Developer: [Your contact information]
- System Admin: [System admin contact]
- Database Admin: [DBA contact]
EOF

print_status "Deployment checklist created"

# Create backup script
cat > "$DIST_DIR/backup-script.sh" << 'EOF'
#!/bin/bash

# School Management System Backup Script
# Run this script regularly to backup your data

# Configuration
DB_USER="your_db_user"
DB_PASS="your_db_password"
DB_NAME="school_management"
BACKUP_DIR="/path/to/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/database_backup_$DATE.sql"

# File backup (uploaded files, logs, etc.)
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" /path/to/your/application/uploads

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x "$DIST_DIR/backup-script.sh"
print_status "Backup script created"

# Remove development/debug files
echo -e "\n${BLUE}5. Cleaning up development files...${NC}"
find "$DIST_DIR" -name "debug_*.php" -delete 2>/dev/null || true
find "$DIST_DIR" -name "test_*.php" -delete 2>/dev/null || true
find "$DIST_DIR" -name "check_*.php" -delete 2>/dev/null || true
find "$DIST_DIR" -name "create_test_*.php" -delete 2>/dev/null || true
find "$DIST_DIR" -name "*.log" -delete 2>/dev/null || true
print_status "Development files cleaned"

# Create archive
echo -e "\n${BLUE}6. Creating production archive...${NC}"
cd "$BUILD_DIR"
tar -czf "school-management-production-$(date +%Y%m%d-%H%M%S).tar.gz" school-management-production/
print_status "Production archive created"

# Final summary
echo -e "\n${GREEN}🎉 Production Build Complete!${NC}"
echo "========================================"
echo -e "${BLUE}📦 Production files location:${NC} $DIST_DIR"
echo -e "${BLUE}📁 Archive location:${NC} $BUILD_DIR/school-management-production-*.tar.gz"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Review the DEPLOYMENT-CHECKLIST.md file"
echo "2. Update configuration files with production values"
echo "3. Test the build locally before deploying"
echo "4. Upload to your production server"
echo "5. Run database setup and import your data"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Change all default passwords and secret keys"
echo "- Update database credentials in production.php"
echo "- Ensure SSL is configured on your production server"
echo "- Test thoroughly before going live"

cd "$PROJECT_ROOT"