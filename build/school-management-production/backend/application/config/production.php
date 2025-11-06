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
