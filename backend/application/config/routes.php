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

// Admin Routes - Keep original admin access
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
$route['api/admin/parent_staff/(:num)'] = 'api/Admin/parent_staff/$1';
$route['api/admin/parent_staff/contact/(:num)'] = 'api/Admin/parent_staff/contact/$1';
$route['api/admin/parent_staff_bulk/(:num)'] = 'api/Admin/parent_staff_bulk/$1';
$route['api/admin/staff'] = 'api/Admin/staff';
$route['api/admin/staff/(:num)'] = 'api/Admin/staff/$1';
$route['api/admin/staff_kids/(:num)'] = 'api/Admin/staff_kids/$1';
$route['api/admin/staff_kids/kid/(:num)'] = 'api/Admin/staff_kids/kid/$1';
$route['api/admin/staff_kids_bulk/(:num)'] = 'api/Admin/staff_kids_bulk/$1';

// Staff routes for all admin functionalities
$route['api/staff/dashboard'] = 'api/Staff/admin_dashboard';
$route['api/staff/grades_dropdown'] = 'api/Staff/admin_grades_dropdown';
$route['api/staff/divisions'] = 'api/Staff/admin_divisions';
$route['api/staff/divisions/(:num)'] = 'api/Staff/admin_divisions/$1';
$route['api/staff/grades'] = 'api/Staff/admin_grades';
$route['api/staff/grades/(:num)'] = 'api/Staff/admin_grades/$1';
$route['api/staff/students'] = 'api/Staff/admin_students';
$route['api/staff/students/(:num)'] = 'api/Staff/admin_students/$1';
$route['api/staff/parents'] = 'api/Staff/admin_parents';
$route['api/staff/parents/(:num)'] = 'api/Staff/admin_parents/$1';
$route['api/staff/staff'] = 'api/Staff/admin_staff';
$route['api/staff/staff/(:num)'] = 'api/Staff/admin_staff/$1';
$route['api/staff/staff_kids/(:num)'] = 'api/Staff/admin_staff_kids/$1';
$route['api/staff/staff_kids/kid/(:num)'] = 'api/Staff/admin_staff_kids/kid/$1';
$route['api/staff/staff_kids_bulk/(:num)'] = 'api/Staff/admin_staff_kids_bulk/$1';
// Academic Years
$route['api/admin/academic_years'] = 'api/Admin/academic_years';
$route['api/admin/academic_years/(:num)'] = 'api/Admin/academic_years/$1';
$route['api/admin/academic_years_dropdown'] = 'api/Admin/academic_years_dropdown';
$route['api/admin/academic_years_current'] = 'api/Admin/academic_years_current';
$route['api/admin/academic_years_set_default/(:num)'] = 'api/Admin/academic_years_set_default/$1';
$route['api/staff/academic_years'] = 'api/Staff/admin_academic_years';
$route['api/staff/academic_years/(:num)'] = 'api/Staff/admin_academic_years/$1';
$route['api/staff/academic_years_dropdown'] = 'api/Staff/admin_academic_years_dropdown';
$route['api/staff/academic_years_current'] = 'api/Staff/admin_academic_years_current';
$route['api/staff/academic_years_set_default/(:num)'] = 'api/Staff/admin_academic_years_set_default/$1';

// Fee Management
$route['api/admin/fee_categories'] = 'api/Admin/fee_categories';
$route['api/admin/fee_categories/(:num)'] = 'api/Admin/fee_categories/$1';
$route['api/admin/fee_categories/dropdown'] = 'api/Admin/fee_categories_dropdown';
$route['api/admin/fee_structures'] = 'api/Admin/fee_structures';
$route['api/admin/fee_structures/(:num)'] = 'api/Admin/fee_structures/$1';
$route['api/admin/student_applicable_fees/(:num)'] = 'api/Admin/student_applicable_fees/$1';
$route['api/admin/available_optional_fees/(:num)'] = 'api/Admin/available_optional_fees/$1';
$route['api/admin/fees'] = 'api/Admin/fees';
$route['api/admin/fees/collect'] = 'api/Admin/collect_fee';
$route['api/staff/fee_categories'] = 'api/Staff/admin_fee_categories';
$route['api/staff/fee_categories/(:num)'] = 'api/Staff/admin_fee_categories/$1';
$route['api/staff/fee_categories/dropdown'] = 'api/Staff/admin_fee_categories_dropdown';
$route['api/staff/fee_structures'] = 'api/Staff/admin_fee_structures';
$route['api/staff/fee_structures/(:num)'] = 'api/Staff/admin_fee_structures/$1';
$route['api/staff/student_applicable_fees/(:num)'] = 'api/Staff/admin_student_applicable_fees/$1';
$route['api/staff/available_optional_fees/(:num)'] = 'api/Staff/admin_available_optional_fees/$1';
$route['api/staff/fees'] = 'api/Staff/admin_fees';
$route['api/staff/fees/collect'] = 'api/Staff/admin_collect_fee';

// Communication
$route['api/admin/announcements'] = 'api/Admin/announcements';
$route['api/admin/announcements/(:num)'] = 'api/Admin/announcements/$1';
$route['api/admin/send_announcement/(:num)'] = 'api/Admin/send_announcement/$1';
$route['api/admin/upload_announcement_attachment'] = 'api/Admin/upload_announcement_attachment';
$route['api/admin/delete_announcement_attachment/(.+)'] = 'api/Admin/delete_announcement_attachment/$1';
$route['api/admin/download_announcement_attachment/(.+)'] = 'api/Admin/download_announcement_attachment/$1';
$route['api/admin/public_download_attachment/(.+)'] = 'api/Admin/public_download_attachment/$1';
$route['api/staff/announcements'] = 'api/Staff/admin_announcements';
$route['api/staff/announcements/(:num)'] = 'api/Staff/admin_announcements/$1';
$route['api/staff/send_announcement/(:num)'] = 'api/Staff/admin_send_announcement/$1';
$route['api/staff/upload_announcement_attachment'] = 'api/Staff/admin_upload_announcement_attachment';
$route['api/staff/delete_announcement_attachment/(.+)'] = 'api/Staff/admin_delete_announcement_attachment/$1';
$route['api/staff/download_announcement_attachment/(.+)'] = 'api/Staff/admin_download_announcement_attachment/$1';
$route['api/staff/public_download_attachment/(.+)'] = 'api/Staff/admin_public_download_attachment/$1';

// Complaints
$route['api/admin/complaints'] = 'api/Admin/complaints';
$route['api/admin/complaints/(:num)'] = 'api/Admin/complaints/$1';
$route['api/admin/assign_complaint/(:num)'] = 'api/Admin/assign_complaint/$1';
$route['api/admin/resolve_complaint/(:num)'] = 'api/Admin/resolve_complaint/$1';
$route['api/admin/close_complaint/(:num)'] = 'api/Admin/close_complaint/$1';
$route['api/admin/complaint_comments/(:num)'] = 'api/Admin/complaint_comments/$1';
$route['api/admin/complaints_statistics'] = 'api/Admin/complaints_statistics';
$route['api/staff/complaints'] = 'api/Staff/admin_complaints';
$route['api/staff/complaints/(:num)'] = 'api/Staff/admin_complaints/$1';
$route['api/staff/assign_complaint/(:num)'] = 'api/Staff/admin_assign_complaint/$1';
$route['api/staff/resolve_complaint/(:num)'] = 'api/Staff/admin_resolve_complaint/$1';
$route['api/staff/close_complaint/(:num)'] = 'api/Staff/admin_close_complaint/$1';
$route['api/staff/complaint_comments/(:num)'] = 'api/Staff/admin_complaint_comments/$1';
$route['api/staff/complaints_statistics'] = 'api/Staff/admin_complaints_statistics';

// Reports
$route['api/admin/reports/(:any)'] = 'api/Admin/reports/$1';
$route['api/admin/report_types'] = 'api/Admin/report_types';
$route['api/staff/reports/(:any)'] = 'api/Staff/admin_reports/$1';
$route['api/staff/report_types'] = 'api/Staff/admin_report_types';

// Search
$route['api/admin/global_search'] = 'api/Admin/global_search';
$route['api/admin/quick_search'] = 'api/Admin/quick_search';
$route['api/admin/search'] = 'api/Admin/search';
$route['api/staff/global_search'] = 'api/Staff/admin_global_search';
$route['api/staff/quick_search'] = 'api/Staff/admin_quick_search';
$route['api/staff/search'] = 'api/Staff/admin_search';

// Role & Permission Management
$route['api/admin/roles'] = 'api/Admin/roles';
$route['api/admin/roles/(:num)'] = 'api/Admin/roles/$1';
$route['api/admin/permissions'] = 'api/Admin/permissions';
$route['api/admin/duplicate_role/(:num)'] = 'api/Admin/duplicate_role/$1';
$route['api/admin/roles_dropdown'] = 'api/Admin/roles_dropdown';
$route['api/admin/staff_dropdown'] = 'api/Admin/staff_dropdown';
$route['api/admin/vision_statements'] = 'api/Admin/vision_statements';
$route['api/admin/vision_statements/(:num)'] = 'api/Admin/vision_statements/$1';
$route['api/staff/roles'] = 'api/Staff/admin_roles';
$route['api/staff/roles/(:num)'] = 'api/Staff/admin_roles/$1';
$route['api/staff/permissions'] = 'api/Staff/admin_permissions';
$route['api/staff/duplicate_role/(:num)'] = 'api/Staff/admin_duplicate_role/$1';
$route['api/staff/roles_dropdown'] = 'api/Staff/admin_roles_dropdown';
$route['api/staff/staff_dropdown'] = 'api/Staff/admin_staff_dropdown';
$route['api/staff/vision_statements'] = 'api/Staff/vision_statements';
$route['api/staff/vision_statements/(:num)'] = 'api/Staff/vision_statements/$1';
$route['api/staff/vision_statements_by_grade/(:num)'] = 'api/Staff/vision_statements_by_grade/$1';

// Staff Wallet Routes
$route['api/admin/staff-wallets'] = 'api/Admin/staff_wallets';
$route['api/admin/staff-wallets/(:num)'] = 'api/Admin/staff_wallets/$1';
$route['api/admin/staff-wallet-ledger/(:num)'] = 'api/Admin/staff_ledger/$1';
$route['api/admin/process-withdrawal/(:num)'] = 'api/Admin/process_withdrawal/$1';
$route['api/admin/clear-wallet-balance/(:num)'] = 'api/Admin/clear_wallet_balance/$1';
$route['api/admin/wallet-statistics'] = 'api/Admin/wallet_statistics';
$route['api/staff/staff-wallets'] = 'api/Staff/admin_staff_wallets';
$route['api/staff/staff-wallets/(:num)'] = 'api/Staff/admin_staff_wallets/$1';
$route['api/staff/staff-wallet-ledger/(:num)'] = 'api/Staff/admin_staff_ledger/$1';
$route['api/staff/process-withdrawal/(:num)'] = 'api/Staff/admin_process_withdrawal/$1';
$route['api/staff/clear-wallet-balance/(:num)'] = 'api/Staff/admin_clear_wallet_balance/$1';
$route['api/staff/wallet-statistics'] = 'api/Staff/admin_wallet_statistics';

// System Settings Routes
$route['api/admin/system-settings'] = 'api/Admin/system_settings';
$route['api/admin/system-settings/(:any)'] = 'api/Admin/system_settings/$1';
$route['api/admin/test-email'] = 'api/Admin/test_email';
$route['api/admin/test-sms'] = 'api/Admin/test_sms';
$route['api/admin/test-whatsapp'] = 'api/Admin/test_whatsapp';
$route['api/staff/system-settings'] = 'api/Staff/admin_system_settings';
$route['api/staff/system-settings/(:any)'] = 'api/Staff/admin_system_settings/$1';
$route['api/staff/test-email'] = 'api/Staff/admin_test_email';
$route['api/staff/test-sms'] = 'api/Staff/admin_test_sms';
$route['api/staff/test-whatsapp'] = 'api/Staff/admin_test_whatsapp';

// Debug Routes - REMOVE IN PRODUCTION
$route['api/admin/debug_user_info'] = 'api/Admin/debug_user_info';
$route['api/staff/debug_user_info'] = 'api/Staff/admin_debug_user_info';

// Original Staff Routes (non-admin functionality)
// Dashboard route already defined above to use admin_dashboard method
// Students route already defined above to use admin_students method
// Fees and announcements routes use original staff methods for specific staff functionality
$route['api/staff/fees/collect'] = 'api/Staff/collect_fee';
$route['api/staff/fee_collections'] = 'api/Staff/fee_collections';
$route['api/staff/announcements/(:num)/read'] = 'api/Staff/mark_announcement_read/$1';
$route['api/staff/academic_year'] = 'api/Staff/academic_year';

// Additional Fee Routes
$route['api/admin/semester_fees'] = 'api/Admin/semester_fees';
$route['api/admin/student_semester_fees/(:num)'] = 'api/Admin/student_semester_fees/$1';
$route['api/admin/debug_fee_assignment_info'] = 'api/Admin/debug_fee_assignment_info';
$route['api/admin/assign_fees_to_all_students'] = 'api/Admin/assign_fees_to_all_students';
$route['api/admin/assign_fees_to_student/(:num)'] = 'api/Admin/assign_fees_to_student/$1';
$route['api/admin/test_student_creation'] = 'api/Admin/test_student_creation';
$route['api/staff/semester_fees'] = 'api/Staff/admin_semester_fees';
$route['api/staff/student_semester_fees/(:num)'] = 'api/Staff/admin_student_semester_fees/$1';
$route['api/staff/debug_fee_assignment_info'] = 'api/Staff/admin_debug_fee_assignment_info';
$route['api/staff/assign_fees_to_all_students'] = 'api/Staff/admin_assign_fees_to_all_students';
$route['api/staff/assign_fees_to_student/(:num)'] = 'api/Staff/admin_assign_fees_to_student/$1';
$route['api/staff/test_student_creation'] = 'api/Staff/admin_test_student_creation';

// Student Attendance Routes
$route['api/admin/attendance'] = 'api/Admin/attendance';
$route['api/admin/class_attendance/(:num)/(:num)/(:any)'] = 'api/Admin/class_attendance/$1/$2/$3';
$route['api/admin/mark_attendance'] = 'api/Admin/mark_attendance';
$route['api/admin/attendance_stats'] = 'api/Admin/attendance_stats';
$route['api/admin/low_attendance_students'] = 'api/Admin/low_attendance_students';
$route['api/admin/attendance/(:num)'] = 'api/Admin/delete_attendance/$1';

// Staff Attendance Routes
$route['api/admin/staff_attendance_daily'] = 'api/Admin/staff_attendance_daily';
$route['api/admin/staff_attendance_history'] = 'api/Admin/staff_attendance_history';
$route['api/admin/mark_staff_attendance'] = 'api/Admin/mark_staff_attendance';
$route['api/admin/staff_attendance_stats'] = 'api/Admin/staff_attendance_stats';
$route['api/admin/low_attendance_staff'] = 'api/Admin/low_attendance_staff';
$route['api/admin/staff_attendance/(:num)'] = 'api/Admin/delete_staff_attendance/$1';

// Student Attendance (Staff managing students)
$route['api/staff/attendance'] = 'api/Staff/admin_attendance';
$route['api/staff/class_attendance/(:num)/(:num)/(:any)'] = 'api/Staff/admin_class_attendance/$1/$2/$3';
$route['api/staff/mark_attendance'] = 'api/Staff/admin_mark_attendance';
$route['api/staff/attendance_stats'] = 'api/Staff/admin_attendance_stats';
$route['api/staff/low_attendance_students'] = 'api/Staff/admin_low_attendance_students';
$route['api/staff/attendance/(:num)'] = 'api/Staff/admin_delete_attendance/$1';

// Staff's Own Attendance
$route['api/staff/check_in'] = 'api/Staff/check_in';
$route['api/staff/check_out'] = 'api/Staff/check_out';
$route['api/staff/my_attendance/(:any)'] = 'api/Staff/my_attendance/$1';
$route['api/staff/my_attendance_history'] = 'api/Staff/my_attendance_history';
$route['api/staff/my_attendance_stats'] = 'api/Staff/my_attendance_stats';

// Parent Routes (order matters - specific routes before general ones)
$route['api/parent/dashboard'] = 'api/Parents/dashboard';
$route['api/parent/students'] = 'api/Parents/students';
$route['api/parent/student_details/(:num)'] = 'api/Parents/student_details/$1';
$route['api/parent/academic_year'] = 'api/Parents/academic_year';

// Profile routes
$route['api/parent/profile'] = 'api/Parents/profile';
$route['api/parent/change-password'] = 'api/Parents/change_password';
$route['api/parent/upload-profile-picture'] = 'api/Parents/upload_profile_picture';
$route['api/parent/activity-log'] = 'api/Parents/activity_log';

// Support ticket routes
$route['api/parent/support-tickets'] = 'api/Parents/support_tickets';
$route['api/parent/support-ticket'] = 'api/Parents/support_ticket';

// Fee routes
$route['api/parent/fee_summary'] = 'api/Parents/fee_summary';
$route['api/parent/fee_payments/(:num)'] = 'api/Parents/fee_payments/$1';
$route['api/parent/fee_payments'] = 'api/Parents/fee_payments';
$route['api/parent/outstanding_fees/(:num)'] = 'api/Parents/outstanding_fees/$1';
$route['api/parent/outstanding_fees'] = 'api/Parents/outstanding_fees';
$route['api/parent/fees'] = 'api/Parents/fees';

// Complaint routes
$route['api/parent/complaints_stats'] = 'api/Parents/complaints_stats';
$route['api/parent/complaints/(:num)/comments'] = 'api/Parents/add_comment/$1';
$route['api/parent/complaints/(:num)'] = 'api/Parents/complaints/$1';
$route['api/parent/complaints'] = 'api/Parents/complaints';

// Announcement routes
$route['api/parent/announcements/(:num)/read'] = 'api/Parents/mark_announcement_read/$1';
$route['api/parent/announcements'] = 'api/Parents/announcements';