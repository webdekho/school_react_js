<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$route['default_controller'] = 'welcome';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// API Routes
$route['api/auth/test'] = 'api/Auth/test';
$route['api/auth/login'] = 'api/Auth/login';
$route['api/auth/logout'] = 'api/Auth/logout';
$route['api/auth/refresh'] = 'api/Auth/refresh_token';
$route['api/auth/me'] = 'api/Auth/me';

// Admin Routes
$route['api/admin/dashboard'] = 'api/Admin/dashboard';
$route['api/admin/grades_dropdown'] = 'api/Admin/grades_dropdown';
$route['api/admin/grades'] = 'api/Admin/grades';
$route['api/admin/grades/(:num)'] = 'api/Admin/grades/$1';
$route['api/admin/divisions'] = 'api/Admin/divisions';
$route['api/admin/divisions/(:num)'] = 'api/Admin/divisions/$1';
$route['api/admin/students'] = 'api/Admin/students';
$route['api/admin/students/(:num)'] = 'api/Admin/students/$1';
$route['api/admin/parents'] = 'api/Admin/parents';
$route['api/admin/parents/(:num)'] = 'api/Admin/parents/$1';
$route['api/admin/staff'] = 'api/Admin/staff';
$route['api/admin/staff/(:num)'] = 'api/Admin/staff/$1';
// Academic Years
$route['api/admin/academic_years'] = 'api/Admin/academic_years';
$route['api/admin/academic_years/(:num)'] = 'api/Admin/academic_years/$1';
$route['api/admin/academic_years_dropdown'] = 'api/Admin/academic_years_dropdown';
$route['api/admin/academic_years_current'] = 'api/Admin/academic_years_current';
$route['api/admin/academic_years_set_default/(:num)'] = 'api/Admin/academic_years_set_default/$1';

// Fee Management
$route['api/admin/fee_categories'] = 'api/Admin/fee_categories';
$route['api/admin/fee_categories/(:num)'] = 'api/Admin/fee_categories/$1';
$route['api/admin/fee_categories/dropdown'] = 'api/Admin/fee_categories_dropdown';
$route['api/admin/fee_structures'] = 'api/Admin/fee_structures';
$route['api/admin/fee_structures/(:num)'] = 'api/Admin/fee_structures/$1';
$route['api/admin/fees'] = 'api/Admin/fees';
$route['api/admin/fees/collect'] = 'api/Admin/collect_fee';

// Communication
$route['api/admin/announcements'] = 'api/Admin/announcements';
$route['api/admin/announcements/(:num)'] = 'api/Admin/announcements/$1';
$route['api/admin/send_announcement/(:num)'] = 'api/Admin/send_announcement/$1';
$route['api/admin/upload_announcement_attachment'] = 'api/Admin/upload_announcement_attachment';
$route['api/admin/delete_announcement_attachment/(.+)'] = 'api/Admin/delete_announcement_attachment/$1';
$route['api/admin/download_announcement_attachment/(.+)'] = 'api/Admin/download_announcement_attachment/$1';
$route['api/admin/public_download_attachment/(.+)'] = 'api/Admin/public_download_attachment/$1';

// Complaints
$route['api/admin/complaints'] = 'api/Admin/complaints';
$route['api/admin/complaints/(:num)'] = 'api/Admin/complaints/$1';
$route['api/admin/assign_complaint/(:num)'] = 'api/Admin/assign_complaint/$1';
$route['api/admin/resolve_complaint/(:num)'] = 'api/Admin/resolve_complaint/$1';
$route['api/admin/close_complaint/(:num)'] = 'api/Admin/close_complaint/$1';
$route['api/admin/complaint_comments/(:num)'] = 'api/Admin/complaint_comments/$1';
$route['api/admin/complaints_statistics'] = 'api/Admin/complaints_statistics';

// Reports
$route['api/admin/reports/(:any)'] = 'api/Admin/reports/$1';
$route['api/admin/report_types'] = 'api/Admin/report_types';

// Search
$route['api/admin/global_search'] = 'api/Admin/global_search';
$route['api/admin/quick_search'] = 'api/Admin/quick_search';
$route['api/admin/search'] = 'api/Admin/search';

// Role & Permission Management
$route['api/admin/roles'] = 'api/Admin/roles';
$route['api/admin/roles/(:num)'] = 'api/Admin/roles/$1';
$route['api/admin/permissions'] = 'api/Admin/permissions';
$route['api/admin/duplicate_role/(:num)'] = 'api/Admin/duplicate_role/$1';
$route['api/admin/roles_dropdown'] = 'api/Admin/roles_dropdown';

// Staff Wallet Routes
$route['api/admin/staff-wallets'] = 'api/Admin/staff_wallets';
$route['api/admin/staff-wallets/(:num)'] = 'api/Admin/staff_wallets/$1';
$route['api/admin/staff-wallet-ledger/(:num)'] = 'api/Admin/staff_ledger/$1';
$route['api/admin/process-withdrawal/(:num)'] = 'api/Admin/process_withdrawal/$1';
$route['api/admin/clear-wallet-balance/(:num)'] = 'api/Admin/clear_wallet_balance/$1';
$route['api/admin/wallet-statistics'] = 'api/Admin/wallet_statistics';

// Staff Routes
$route['api/staff/dashboard'] = 'api/Staff/dashboard';
$route['api/staff/students'] = 'api/Staff/students';
$route['api/staff/fees/collect'] = 'api/Staff/collect_fee';

// Parent Routes
$route['api/parent/dashboard'] = 'api/Parent/dashboard';
$route['api/parent/students'] = 'api/Parent/students';
$route['api/parent/fees'] = 'api/Parent/fees';
$route['api/parent/complaints'] = 'api/Parent/complaints';