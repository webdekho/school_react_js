#!/bin/bash

# Security Hardening Script for School Management System
# Run this script after deploying to production

set -e

echo "🔒 Starting Security Hardening Process..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Configuration
APP_DIR="/var/www/html/school-management"  # Update this path
BACKEND_DIR="$APP_DIR/backend"
LOG_DIR="/var/log/school-management"

echo -e "${BLUE}Application Directory: $APP_DIR${NC}"
echo -e "${BLUE}Backend Directory: $BACKEND_DIR${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script should be run as root for security hardening"
    print_warning "Run: sudo $0"
    exit 1
fi

# 1. File Permissions
echo -e "\n${BLUE}1. Setting File Permissions...${NC}"

# Set ownership (adjust user:group as needed)
chown -R www-data:www-data "$APP_DIR"
print_status "Ownership set to www-data:www-data"

# Set directory permissions
find "$APP_DIR" -type d -exec chmod 755 {} \;
print_status "Directory permissions set to 755"

# Set file permissions
find "$APP_DIR" -type f -exec chmod 644 {} \;
print_status "File permissions set to 644"

# Make scripts executable
chmod +x "$APP_DIR"/*.sh 2>/dev/null || true
print_status "Shell scripts made executable"

# Secure sensitive files
if [ -f "$BACKEND_DIR/application/config/production.php" ]; then
    chmod 600 "$BACKEND_DIR/application/config/production.php"
    print_status "Production config secured (600)"
fi

# Set writable directories
chmod -R 777 "$BACKEND_DIR/application/logs" 2>/dev/null || true
chmod -R 777 "$BACKEND_DIR/application/cache" 2>/dev/null || true
chmod -R 777 "$BACKEND_DIR/uploads" 2>/dev/null || true
print_status "Writable directories configured"

# 2. Remove Development Files
echo -e "\n${BLUE}2. Removing Development Files...${NC}"

# Remove debug files
find "$APP_DIR" -name "debug_*.php" -delete 2>/dev/null || true
find "$APP_DIR" -name "test_*.php" -delete 2>/dev/null || true
find "$APP_DIR" -name "check_*.php" -delete 2>/dev/null || true
find "$APP_DIR" -name "create_test_*.php" -delete 2>/dev/null || true
print_status "Debug and test files removed"

# Remove version control files
find "$APP_DIR" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
find "$APP_DIR" -name ".svn" -type d -exec rm -rf {} + 2>/dev/null || true
find "$APP_DIR" -name ".gitignore" -delete 2>/dev/null || true
print_status "Version control files removed"

# Remove package files
find "$APP_DIR" -name "package.json" -delete 2>/dev/null || true
find "$APP_DIR" -name "package-lock.json" -delete 2>/dev/null || true
find "$APP_DIR" -name "composer.json" -delete 2>/dev/null || true
find "$APP_DIR" -name "composer.lock" -delete 2>/dev/null || true
print_status "Package manager files removed"

# 3. Secure Web Server Configuration
echo -e "\n${BLUE}3. Securing Web Server Configuration...${NC}"

# Create/update .htaccess for backend security
cat > "$BACKEND_DIR/.htaccess" << 'EOF'
# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
</IfModule>

# Hide sensitive files and directories
<FilesMatch "\.(env|git|svn|htaccess|ini|log|sql|bak|backup)$">
    Order allow,deny
    Deny from all
</FilesMatch>

<DirectoryMatch "(\.git|\.svn|logs|cache|config)">
    Order allow,deny
    Deny from all
</DirectoryMatch>

# Disable directory browsing
Options -Indexes

# Block access to PHP files in uploads directory
<Directory "uploads">
    <FilesMatch "\.php$">
        Order allow,deny
        Deny from all
    </FilesMatch>
</Directory>

# Prevent execution of scripts in uploads
<Directory "uploads">
    Options -ExecCGI
    RemoveHandler .php .phtml .php3 .php4 .php5 .py .pl .cgi
    AddHandler application/octet-stream .php .phtml .php3 .php4 .php5 .py .pl .cgi
</Directory>

# URL Rewriting
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [QSA,L]

# Block access to application folder
RewriteCond %{REQUEST_URI} ^application.*
RewriteRule ^(.*)$ /index.php?/$1 [R=301,L]

# Rate limiting (if mod_evasive is available)
<IfModule mod_evasive24.c>
    DOSHashTableSize    2048
    DOSPageCount        10
    DOSPageInterval     1
    DOSSiteCount        50
    DOSSiteInterval     1
    DOSBlockingPeriod   600
</IfModule>
EOF

print_status "Backend .htaccess security configured"

# Create .htaccess for uploads directory
mkdir -p "$BACKEND_DIR/uploads"
cat > "$BACKEND_DIR/uploads/.htaccess" << 'EOF'
# Prevent execution of any scripts in uploads directory
Options -ExecCGI
RemoveHandler .php .phtml .php3 .php4 .php5 .py .pl .cgi .jsp .asp
AddHandler application/octet-stream .php .phtml .php3 .php4 .php5 .py .pl .cgi .jsp .asp

# Block access to PHP files
<FilesMatch "\.php$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Allow only specific file types
<FilesMatch "\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt)$">
    Order allow,deny
    Allow from all
</FilesMatch>
EOF

print_status "Uploads directory secured"

# 4. PHP Security Configuration
echo -e "\n${BLUE}4. PHP Security Configuration...${NC}"

# Create PHP security configuration
cat > "$BACKEND_DIR/.user.ini" << 'EOF'
; PHP Security Settings for Production
display_errors = Off
log_errors = On
error_reporting = E_ERROR
expose_php = Off
allow_url_fopen = Off
allow_url_include = Off
file_uploads = On
upload_max_filesize = 5M
post_max_size = 10M
max_execution_time = 30
max_input_time = 30
memory_limit = 128M
session.cookie_httponly = On
session.cookie_secure = On
session.use_strict_mode = On
session.cookie_samesite = Strict
open_basedir = "/var/www/html/school-management:/tmp"
disable_functions = "exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source,highlight_file"
EOF

print_status "PHP security settings configured"

# 5. Create Log Directory
echo -e "\n${BLUE}5. Setting up Logging...${NC}"

mkdir -p "$LOG_DIR"
touch "$LOG_DIR/application.log"
touch "$LOG_DIR/security.log"
touch "$LOG_DIR/error.log"

# Set log permissions
chown -R www-data:www-data "$LOG_DIR"
chmod -R 640 "$LOG_DIR"/*.log

print_status "Log directory created and secured"

# 6. Database Security Check
echo -e "\n${BLUE}6. Database Security Recommendations...${NC}"

print_warning "Manual Database Security Steps Required:"
echo "1. Remove test databases: DROP DATABASE IF EXISTS test;"
echo "2. Remove anonymous users: DELETE FROM mysql.user WHERE User='';"
echo "3. Disable remote root login: DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
echo "4. Set strong passwords for all database users"
echo "5. Flush privileges: FLUSH PRIVILEGES;"

# 7. Create Security Monitoring Script
echo -e "\n${BLUE}7. Creating Security Monitoring...${NC}"

cat > "$APP_DIR/security-check.sh" << 'EOF'
#!/bin/bash
# Security monitoring script

LOG_FILE="/var/log/school-management/security.log"
DATE=$(date)

echo "[$DATE] Starting security check..." >> "$LOG_FILE"

# Check for suspicious files
find /var/www/html/school-management -name "*.php" -newer /tmp/last-security-check 2>/dev/null | while read file; do
    echo "[$DATE] New PHP file detected: $file" >> "$LOG_FILE"
done

# Check file permissions
find /var/www/html/school-management -type f -perm -002 | while read file; do
    echo "[$DATE] World-writable file detected: $file" >> "$LOG_FILE"
done

# Update timestamp
touch /tmp/last-security-check

echo "[$DATE] Security check completed." >> "$LOG_FILE"
EOF

chmod +x "$APP_DIR/security-check.sh"
print_status "Security monitoring script created"

# 8. Firewall Recommendations
echo -e "\n${BLUE}8. Firewall Configuration Recommendations...${NC}"

print_warning "Configure UFW (Uncomplicated Firewall):"
echo "sudo ufw allow ssh"
echo "sudo ufw allow http"
echo "sudo ufw allow https"
echo "sudo ufw --force enable"

# 9. SSL/TLS Security
echo -e "\n${BLUE}9. SSL/TLS Security Recommendations...${NC}"

print_warning "SSL/TLS Security Steps:"
echo "1. Use strong SSL ciphers"
echo "2. Enable HSTS headers"
echo "3. Use TLS 1.2+ only"
echo "4. Configure OCSP stapling"
echo "5. Use secure certificate chains"

# 10. Create Security Audit Report
echo -e "\n${BLUE}10. Creating Security Audit Report...${NC}"

cat > "$APP_DIR/SECURITY-AUDIT-REPORT.md" << EOF
# Security Audit Report
Generated: $(date)

## Applied Security Measures

### File System Security
- [x] Proper file permissions set (644 for files, 755 for directories)
- [x] Sensitive files secured (600 for config files)
- [x] Development files removed
- [x] Version control files removed
- [x] Package manager files removed

### Web Server Security
- [x] Security headers configured
- [x] Directory browsing disabled
- [x] Sensitive files blocked via .htaccess
- [x] Script execution disabled in uploads
- [x] URL rewriting configured

### PHP Security
- [x] Error display disabled
- [x] Dangerous functions disabled
- [x] File upload restrictions set
- [x] Session security configured
- [x] Open basedir restrictions set

### Application Security
- [x] Debug mode disabled
- [x] Logging enabled
- [x] Security monitoring script created

## Manual Steps Required

### Database Security
- [ ] Remove test databases
- [ ] Remove anonymous users
- [ ] Disable remote root login
- [ ] Set strong database passwords
- [ ] Configure database firewall

### Server Security
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban
- [ ] Configure automatic security updates
- [ ] Set up intrusion detection

### SSL/TLS Security
- [ ] Install SSL certificate
- [ ] Configure strong cipher suites
- [ ] Enable HSTS
- [ ] Configure OCSP stapling

### Monitoring
- [ ] Set up log monitoring
- [ ] Configure security alerts
- [ ] Set up backup monitoring
- [ ] Configure uptime monitoring

## Security Checklist

### Daily
- [ ] Monitor security logs
- [ ] Check for suspicious activities
- [ ] Verify backup completion

### Weekly
- [ ] Run security check script
- [ ] Review access logs
- [ ] Check for software updates

### Monthly
- [ ] Security audit
- [ ] Password policy review
- [ ] Access control review
- [ ] Backup restore test

## Emergency Contacts
- Security Team: [contact]
- System Administrator: [contact]
- Hosting Provider: [contact]

## Important Files Locations
- Security Logs: /var/log/school-management/
- Application Logs: $BACKEND_DIR/application/logs/
- Configuration: $BACKEND_DIR/application/config/
- Security Check Script: $APP_DIR/security-check.sh
EOF

print_status "Security audit report created"

# 11. Set up automated security check
echo -e "\n${BLUE}11. Setting up Automated Security Monitoring...${NC}"

# Add to crontab (you'll need to run this manually)
print_warning "Add to crontab for automated security checks:"
echo "# Daily security check at 2 AM"
echo "0 2 * * * $APP_DIR/security-check.sh"
echo ""
echo "Run: crontab -e (as root)"

# Final summary
echo -e "\n${GREEN}🔒 Security Hardening Complete!${NC}"
echo "========================================="
echo -e "${BLUE}📋 Summary of Applied Security Measures:${NC}"
echo "✓ File permissions secured"
echo "✓ Development files removed"
echo "✓ Web server security configured"
echo "✓ PHP security settings applied"
echo "✓ Upload directory secured"
echo "✓ Logging configured"
echo "✓ Security monitoring script created"
echo ""
echo -e "${YELLOW}📋 Manual Steps Still Required:${NC}"
echo "• Configure database security"
echo "• Set up server firewall"
echo "• Install and configure SSL certificate"
echo "• Set up automated backups"
echo "• Configure monitoring and alerting"
echo ""
echo -e "${BLUE}📄 Review the Security Audit Report:${NC} $APP_DIR/SECURITY-AUDIT-REPORT.md"
echo -e "${BLUE}🔍 Run security checks with:${NC} $APP_DIR/security-check.sh"

# Final warnings
echo -e "\n${RED}⚠️  Important Security Reminders:${NC}"
echo "1. Change all default passwords immediately"
echo "2. Update JWT and encryption keys in production.php"
echo "3. Configure SSL/TLS properly"
echo "4. Set up regular automated backups"
echo "5. Monitor logs regularly for security incidents"
echo "6. Keep all software updated"
EOF