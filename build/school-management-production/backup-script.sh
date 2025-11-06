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
