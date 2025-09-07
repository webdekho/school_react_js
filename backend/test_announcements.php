<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Simple test endpoint to verify announcements functionality without authentication

// Database connection
$host = 'localhost';
$dbname = 'School';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            // Get announcements list
            $stmt = $pdo->prepare("
                SELECT a.*, s.name as created_by_name 
                FROM announcements a 
                LEFT JOIN staff s ON a.created_by = s.id 
                WHERE a.is_active = 1 
                ORDER BY a.created_at DESC 
                LIMIT 10
            ");
            $stmt->execute();
            $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields
            foreach ($announcements as &$announcement) {
                $announcement['target_ids'] = json_decode($announcement['target_ids'], true);
                $announcement['channels'] = json_decode($announcement['notification_channels'], true);
            }
            
            echo json_encode([
                'status' => 'success',
                'data' => $announcements,
                'count' => count($announcements)
            ]);
            break;
            
        case 'targets':
            $type = $_GET['type'] ?? '';
            $data = [];
            
            switch ($type) {
                case 'grades':
                    $stmt = $pdo->prepare("SELECT id, name FROM grades WHERE is_active = 1 ORDER BY name");
                    $stmt->execute();
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;
                    
                case 'divisions':
                    $stmt = $pdo->prepare("SELECT id, name FROM divisions WHERE is_active = 1 ORDER BY name");
                    $stmt->execute();
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;
                    
                case 'parents':
                    $stmt = $pdo->prepare("SELECT id, name, mobile FROM parents WHERE is_active = 1 ORDER BY name LIMIT 50");
                    $stmt->execute();
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;
                    
                case 'staff':
                    $stmt = $pdo->prepare("SELECT id, name, mobile, role_name FROM staff WHERE is_active = 1 ORDER BY name LIMIT 50");
                    $stmt->execute();
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    break;
            }
            
            echo json_encode([
                'status' => 'success',
                'data' => $data,
                'count' => count($data)
            ]);
            break;
            
        case 'delivery_status':
            $announcement_id = $_GET['id'] ?? 1;
            
            // Get delivery status
            $stmt = $pdo->prepare("
                SELECT ads.*, 
                       CASE 
                         WHEN ads.recipient_type = 'parent' THEN p.name 
                         WHEN ads.recipient_type = 'staff' THEN s.name 
                       END as recipient_name
                FROM announcement_delivery_status ads
                LEFT JOIN parents p ON ads.recipient_id = p.id AND ads.recipient_type = 'parent'
                LEFT JOIN staff s ON ads.recipient_id = s.id AND ads.recipient_type = 'staff'
                WHERE ads.announcement_id = ?
                ORDER BY ads.created_at DESC
            ");
            $stmt->execute([$announcement_id]);
            $delivery_status = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get statistics
            $stats = [];
            
            // By status
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count 
                FROM announcement_delivery_status 
                WHERE announcement_id = ? 
                GROUP BY status
            ");
            $stmt->execute([$announcement_id]);
            $status_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stats['by_status'] = [];
            foreach ($status_stats as $stat) {
                $stats['by_status'][$stat['status']] = $stat['count'];
            }
            
            // By channel
            $stmt = $pdo->prepare("
                SELECT channel, COUNT(*) as count 
                FROM announcement_delivery_status 
                WHERE announcement_id = ? 
                GROUP BY channel
            ");
            $stmt->execute([$announcement_id]);
            $channel_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stats['by_channel'] = [];
            foreach ($channel_stats as $stat) {
                $stats['by_channel'][$stat['channel']] = $stat['count'];
            }
            
            echo json_encode([
                'status' => 'success',
                'delivery_status' => $delivery_status,
                'statistics' => $stats
            ]);
            break;
            
        default:
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid action'
            ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>