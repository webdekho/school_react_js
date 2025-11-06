<?php
/**
 * Performance Monitoring Dashboard
 * Access: https://yourdomain.com/performance-monitoring.php
 * 
 * IMPORTANT: Remove this file after production setup or protect with authentication
 */

// Security check - remove in production or add authentication
if ($_SERVER['HTTP_HOST'] !== 'localhost' && !isset($_GET['key']) || $_GET['key'] !== 'your_secret_key') {
    die('Access denied. This file should be removed in production.');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>School Management System - Performance Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e3f2fd; border-radius: 5px; min-width: 200px; }
        .metric.warning { background: #fff3e0; }
        .metric.error { background: #ffebee; }
        .metric h3 { margin: 0 0 10px 0; color: #1976d2; }
        .metric.warning h3 { color: #f57c00; }
        .metric.error h3 { color: #d32f2f; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .status-good { color: #4caf50; font-weight: bold; }
        .status-warning { color: #ff9800; font-weight: bold; }
        .status-error { color: #f44336; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>

<div class="container">
    <h1>🚀 School Management System - Performance Monitor</h1>
    
    <?php
    // Database connection (update credentials)
    $db_host = 'localhost';
    $db_name = 'school_management';
    $db_user = 'root';
    $db_pass = '';
    
    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db_connected = true;
    } catch (PDOException $e) {
        $db_connected = false;
        $db_error = $e->getMessage();
    }
    ?>
    
    <!-- System Overview -->
    <div class="card">
        <h2>📊 System Overview</h2>
        
        <?php
        // PHP Information
        $php_version = phpversion();
        $memory_limit = ini_get('memory_limit');
        $max_execution_time = ini_get('max_execution_time');
        $upload_max_filesize = ini_get('upload_max_filesize');
        $post_max_size = ini_get('post_max_size');
        $memory_usage = round(memory_get_usage(true) / 1024 / 1024, 2);
        $memory_peak = round(memory_get_peak_usage(true) / 1024 / 1024, 2);
        
        // Server Information
        $server_software = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
        $document_root = $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown';
        $server_load = function_exists('sys_getloadavg') ? sys_getloadavg() : [0, 0, 0];
        ?>
        
        <div class="metric">
            <h3>PHP Version</h3>
            <div><?php echo $php_version; ?></div>
        </div>
        
        <div class="metric">
            <h3>Memory Usage</h3>
            <div><?php echo $memory_usage; ?> MB / <?php echo $memory_limit; ?></div>
        </div>
        
        <div class="metric">
            <h3>Peak Memory</h3>
            <div><?php echo $memory_peak; ?> MB</div>
        </div>
        
        <div class="metric">
            <h3>Server Load</h3>
            <div><?php echo implode(', ', array_map(function($load) { return round($load, 2); }, $server_load)); ?></div>
        </div>
        
        <div class="metric">
            <h3>Web Server</h3>
            <div><?php echo $server_software; ?></div>
        </div>
        
        <div class="metric">
            <h3>Max Execution Time</h3>
            <div><?php echo $max_execution_time; ?>s</div>
        </div>
    </div>
    
    <!-- Database Performance -->
    <?php if ($db_connected): ?>
    <div class="card">
        <h2>🗄️ Database Performance</h2>
        
        <?php
        // Database size
        $stmt = $pdo->query("
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as db_size_mb
            FROM information_schema.tables 
            WHERE table_schema = '$db_name'
        ");
        $db_size = $stmt->fetch()['db_size_mb'];
        
        // Table information
        $stmt = $pdo->query("
            SELECT 
                table_name,
                table_rows,
                ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
            FROM information_schema.TABLES 
            WHERE table_schema = '$db_name'
            ORDER BY (data_length + index_length) DESC
            LIMIT 10
        ");
        $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Connection count
        $stmt = $pdo->query("SHOW STATUS LIKE 'Threads_connected'");
        $connections = $stmt->fetch()['Value'];
        
        // Slow queries
        $stmt = $pdo->query("SHOW STATUS LIKE 'Slow_queries'");
        $slow_queries = $stmt->fetch()['Value'];
        
        // Uptime
        $stmt = $pdo->query("SHOW STATUS LIKE 'Uptime'");
        $uptime = $stmt->fetch()['Value'];
        $uptime_hours = round($uptime / 3600, 1);
        ?>
        
        <div class="metric">
            <h3>Database Size</h3>
            <div><?php echo $db_size; ?> MB</div>
        </div>
        
        <div class="metric">
            <h3>Active Connections</h3>
            <div><?php echo $connections; ?></div>
        </div>
        
        <div class="metric <?php echo $slow_queries > 10 ? 'warning' : ''; ?>">
            <h3>Slow Queries</h3>
            <div><?php echo $slow_queries; ?></div>
        </div>
        
        <div class="metric">
            <h3>Uptime</h3>
            <div><?php echo $uptime_hours; ?> hours</div>
        </div>
        
        <h3>📊 Largest Tables</h3>
        <table>
            <thead>
                <tr>
                    <th>Table Name</th>
                    <th>Rows</th>
                    <th>Size (MB)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($tables as $table): ?>
                <tr>
                    <td><?php echo htmlspecialchars($table['table_name']); ?></td>
                    <td><?php echo number_format($table['table_rows']); ?></td>
                    <td><?php echo $table['size_mb']; ?></td>
                    <td class="<?php echo $table['size_mb'] > 100 ? 'status-warning' : 'status-good'; ?>">
                        <?php echo $table['size_mb'] > 100 ? 'Large' : 'OK'; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    
    <!-- Application Metrics -->
    <div class="card">
        <h2>📈 Application Metrics</h2>
        
        <?php
        // Count records in main tables
        $metrics = [];
        
        $tables_to_check = [
            'staff' => 'Staff Members',
            'students' => 'Students',
            'fee_collections' => 'Fee Collections',
            'parents' => 'Parents',
            'auth_tokens' => 'Active Sessions',
            'fee_structures' => 'Fee Structures'
        ];
        
        foreach ($tables_to_check as $table => $label) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                $count = $stmt->fetch()['count'];
                $metrics[$label] = $count;
            } catch (Exception $e) {
                $metrics[$label] = 'Error';
            }
        }
        
        // Recent activity
        try {
            $stmt = $pdo->query("
                SELECT COUNT(*) as today_collections 
                FROM fee_collections 
                WHERE DATE(collection_date) = CURDATE()
            ");
            $today_collections = $stmt->fetch()['today_collections'];
            
            $stmt = $pdo->query("
                SELECT COUNT(*) as week_collections 
                FROM fee_collections 
                WHERE collection_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ");
            $week_collections = $stmt->fetch()['week_collections'];
            
        } catch (Exception $e) {
            $today_collections = 'Error';
            $week_collections = 'Error';
        }
        ?>
        
        <?php foreach ($metrics as $label => $count): ?>
        <div class="metric">
            <h3><?php echo $label; ?></h3>
            <div><?php echo is_numeric($count) ? number_format($count) : $count; ?></div>
        </div>
        <?php endforeach; ?>
        
        <div class="metric">
            <h3>Today's Collections</h3>
            <div><?php echo is_numeric($today_collections) ? number_format($today_collections) : $today_collections; ?></div>
        </div>
        
        <div class="metric">
            <h3>This Week's Collections</h3>
            <div><?php echo is_numeric($week_collections) ? number_format($week_collections) : $week_collections; ?></div>
        </div>
    </div>
    
    <?php else: ?>
    <div class="card">
        <h2>❌ Database Connection Error</h2>
        <p class="status-error">Could not connect to database: <?php echo htmlspecialchars($db_error); ?></p>
    </div>
    <?php endif; ?>
    
    <!-- File System Check -->
    <div class="card">
        <h2>📁 File System Status</h2>
        
        <?php
        $app_root = __DIR__;
        $backend_dir = $app_root . '/backend';
        $uploads_dir = $backend_dir . '/uploads';
        $logs_dir = $backend_dir . '/application/logs';
        
        // Check directory permissions
        function checkDirectory($path, $name, $required_writable = false) {
            if (!is_dir($path)) {
                return ['name' => $name, 'status' => 'Missing', 'class' => 'status-error', 'path' => $path];
            }
            
            $perms = fileperms($path);
            $perms_string = substr(sprintf('%o', $perms), -4);
            
            if ($required_writable && !is_writable($path)) {
                return ['name' => $name, 'status' => "Not Writable ($perms_string)", 'class' => 'status-error', 'path' => $path];
            }
            
            return ['name' => $name, 'status' => "OK ($perms_string)", 'class' => 'status-good', 'path' => $path];
        }
        
        $directories = [
            checkDirectory($app_root, 'Application Root'),
            checkDirectory($backend_dir, 'Backend Directory'),
            checkDirectory($uploads_dir, 'Uploads Directory', true),
            checkDirectory($logs_dir, 'Logs Directory', true),
        ];
        
        // Check disk space
        $disk_free = disk_free_space($app_root);
        $disk_total = disk_total_space($app_root);
        $disk_used_percent = round((($disk_total - $disk_free) / $disk_total) * 100, 1);
        ?>
        
        <div class="metric <?php echo $disk_used_percent > 90 ? 'error' : ($disk_used_percent > 80 ? 'warning' : ''); ?>">
            <h3>Disk Usage</h3>
            <div><?php echo $disk_used_percent; ?>% used</div>
        </div>
        
        <div class="metric">
            <h3>Free Space</h3>
            <div><?php echo round($disk_free / 1024 / 1024 / 1024, 2); ?> GB</div>
        </div>
        
        <h3>📂 Directory Status</h3>
        <table>
            <thead>
                <tr>
                    <th>Directory</th>
                    <th>Status</th>
                    <th>Path</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($directories as $dir): ?>
                <tr>
                    <td><?php echo htmlspecialchars($dir['name']); ?></td>
                    <td class="<?php echo $dir['class']; ?>"><?php echo $dir['status']; ?></td>
                    <td><small><?php echo htmlspecialchars($dir['path']); ?></small></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    
    <!-- Security Check -->
    <div class="card">
        <h2>🔒 Security Status</h2>
        
        <?php
        $security_checks = [];
        
        // Check for debug files
        $debug_files = glob($app_root . '/debug_*.php') ?: [];
        $security_checks['Debug Files'] = count($debug_files) === 0 ? 'Clean' : count($debug_files) . ' found';
        
        // Check for test files
        $test_files = glob($app_root . '/test_*.php') ?: [];
        $security_checks['Test Files'] = count($test_files) === 0 ? 'Clean' : count($test_files) . ' found';
        
        // Check PHP settings
        $security_checks['Display Errors'] = ini_get('display_errors') ? 'Enabled (Bad)' : 'Disabled (Good)';
        $security_checks['Expose PHP'] = ini_get('expose_php') ? 'Enabled (Bad)' : 'Disabled (Good)';
        
        // Check for .htaccess files
        $htaccess_backend = file_exists($backend_dir . '/.htaccess');
        $security_checks['Backend .htaccess'] = $htaccess_backend ? 'Present' : 'Missing';
        
        // Check for sensitive files
        $sensitive_files = ['.env', '.git', 'composer.json', 'package.json'];
        $found_sensitive = [];
        foreach ($sensitive_files as $file) {
            if (file_exists($app_root . '/' . $file)) {
                $found_sensitive[] = $file;
            }
        }
        $security_checks['Sensitive Files'] = empty($found_sensitive) ? 'Clean' : implode(', ', $found_sensitive);
        ?>
        
        <table>
            <thead>
                <tr>
                    <th>Security Check</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($security_checks as $check => $status): ?>
                <tr>
                    <td><?php echo htmlspecialchars($check); ?></td>
                    <td class="<?php 
                        if (strpos($status, 'Clean') !== false || strpos($status, 'Present') !== false || strpos($status, 'Disabled') !== false) {
                            echo 'status-good';
                        } elseif (strpos($status, 'Missing') !== false || strpos($status, 'found') !== false || strpos($status, 'Enabled') !== false) {
                            echo 'status-warning';
                        } else {
                            echo 'status-error';
                        }
                    ?>"><?php echo htmlspecialchars($status); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    
    <!-- Performance Recommendations -->
    <div class="card">
        <h2>⚡ Performance Recommendations</h2>
        
        <h3>✅ Quick Wins</h3>
        <ul>
            <li>Enable gzip compression in web server</li>
            <li>Set up browser caching for static assets</li>
            <li>Optimize database with regular ANALYZE TABLE</li>
            <li>Use production environment settings</li>
            <li>Enable OPcache for PHP</li>
        </ul>
        
        <h3>📊 Monitoring Setup</h3>
        <ul>
            <li>Set up log rotation for application logs</li>
            <li>Monitor database slow query log</li>
            <li>Set up disk space alerts</li>
            <li>Monitor error logs for issues</li>
            <li>Set up automated backups</li>
        </ul>
        
        <h3>🔧 Advanced Optimizations</h3>
        <ul>
            <li>Consider Redis for session storage</li>
            <li>Set up CDN for static assets</li>
            <li>Database query optimization</li>
            <li>Consider database read replicas for heavy loads</li>
            <li>Implement API rate limiting</li>
        </ul>
    </div>
    
    <!-- Footer -->
    <div class="card">
        <h2>⚠️ Important Notes</h2>
        <ul>
            <li><strong>Remove this file in production</strong> or protect it with authentication</li>
            <li>Monitor these metrics regularly</li>
            <li>Set up automated alerts for critical thresholds</li>
            <li>Keep backups of your database and files</li>
            <li>Update system software regularly</li>
        </ul>
        
        <p><strong>Last Updated:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
    </div>
</div>

</body>
</html>