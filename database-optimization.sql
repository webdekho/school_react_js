-- Database Optimization for Production
-- Run these queries to optimize your database for production

-- 1. Add indexes for better performance
-- Fee Collections indexes
CREATE INDEX idx_fee_collections_collected_by ON fee_collections(collected_by);
CREATE INDEX idx_fee_collections_collection_date ON fee_collections(collection_date);
CREATE INDEX idx_fee_collections_student_id ON fee_collections(student_id);
CREATE INDEX idx_fee_collections_payment_method ON fee_collections(payment_method);

-- Student indexes
CREATE INDEX idx_students_grade_division ON students(grade_id, division_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_roll_number ON students(roll_number);

-- Staff indexes
CREATE INDEX idx_staff_role_id ON staff(role_id);
CREATE INDEX idx_staff_is_active ON staff(is_active);

-- Auth tokens indexes
CREATE INDEX idx_auth_tokens_user_type_id ON auth_tokens(user_type, user_id);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_is_revoked ON auth_tokens(is_revoked);

-- Fee structures indexes
CREATE INDEX idx_fee_structures_academic_year ON fee_structures(academic_year_id);
CREATE INDEX idx_fee_structures_grade_division ON fee_structures(grade_id, division_id);
CREATE INDEX idx_fee_structures_category ON fee_structures(fee_category_id);

-- Student fee assignments indexes
CREATE INDEX idx_student_fee_assignments_student ON student_fee_assignments(student_id);
CREATE INDEX idx_student_fee_assignments_status ON student_fee_assignments(status);
CREATE INDEX idx_student_fee_assignments_due_date ON student_fee_assignments(due_date);

-- 2. Update table statistics
ANALYZE TABLE fee_collections;
ANALYZE TABLE students;
ANALYZE TABLE staff;
ANALYZE TABLE auth_tokens;
ANALYZE TABLE fee_structures;
ANALYZE TABLE student_fee_assignments;

-- 3. Optimize tables
OPTIMIZE TABLE fee_collections;
OPTIMIZE TABLE students;
OPTIMIZE TABLE staff;
OPTIMIZE TABLE auth_tokens;
OPTIMIZE TABLE fee_structures;
OPTIMIZE TABLE student_fee_assignments;

-- 4. Clean up old data (adjust dates as needed)
-- Remove expired auth tokens (older than 30 days)
DELETE FROM auth_tokens 
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY) 
   OR is_revoked = 1;

-- Clean up old log entries if you have a logs table (adjust as needed)
-- DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 5. Production settings
-- Set appropriate timeouts and limits
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;
SET GLOBAL max_connections = 100;

-- 6. Create database backup procedure (optional)
DELIMITER $$
CREATE PROCEDURE backup_preparation()
BEGIN
    -- Lock tables for consistent backup
    FLUSH TABLES WITH READ LOCK;
    -- Note: Unlock with UNLOCK TABLES; after backup
END$$
DELIMITER ;

-- 7. Create performance monitoring views
CREATE VIEW v_performance_stats AS
SELECT 
    'fee_collections' as table_name,
    COUNT(*) as record_count,
    AVG(CHAR_LENGTH(remarks)) as avg_remarks_length
FROM fee_collections
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as record_count,
    NULL as avg_remarks_length
FROM students
UNION ALL
SELECT 
    'staff' as table_name,
    COUNT(*) as record_count,
    NULL as avg_remarks_length
FROM staff;

-- 8. Show current database size
SELECT 
    table_schema as 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'school_management'
GROUP BY table_schema;

-- 9. Show table sizes
SELECT 
    table_name as 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Size (MB)',
    table_rows as 'Rows'
FROM information_schema.TABLES 
WHERE table_schema = 'school_management'
ORDER BY (data_length + index_length) DESC;

-- 10. Performance recommendations
-- Check for tables without primary keys
SELECT 
    table_schema,
    table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc
    ON t.table_schema = tc.table_schema
    AND t.table_name = tc.table_name
    AND tc.constraint_type = 'PRIMARY KEY'
WHERE t.table_schema = 'school_management'
    AND tc.constraint_name IS NULL
    AND t.table_type = 'BASE TABLE';

-- Show query cache status (if enabled)
SHOW VARIABLES LIKE 'query_cache%';

-- Show slow query log status
SHOW VARIABLES LIKE 'slow_query_log%';

-- Recommendations for my.cnf (MySQL configuration file):
/*
[mysqld]
# Performance settings for production
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M
innodb_flush_log_at_trx_commit = 2
max_connections = 100
query_cache_type = 1
query_cache_size = 64M
tmp_table_size = 64M
max_heap_table_size = 64M

# Security settings
bind-address = 127.0.0.1
skip-networking = false
local-infile = 0

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1
*/