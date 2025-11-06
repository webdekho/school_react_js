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
