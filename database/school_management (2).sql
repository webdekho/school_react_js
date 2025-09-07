-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 07, 2025 at 12:10 PM
-- Server version: 11.7.2-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `school_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL COMMENT 'e.g., 2025-2026',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = Active, 0 = Inactive',
  `is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = Default Academic Year, 0 = Not Default',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`id`, `name`, `start_date`, `end_date`, `is_active`, `is_default`, `description`, `created_at`, `updated_at`) VALUES
(1, '2025-2026', '2025-04-01', '2026-03-31', 1, 1, 'sdafsdf', '2025-08-06 06:48:31', '2025-08-19 04:40:45'),
(3, '2026-2027', '2026-04-01', '2027-03-31', 1, 0, NULL, '2025-08-06 06:48:31', '2025-08-06 06:48:31');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `target_type` enum('all','grade','division','staff','parent','fee_due') NOT NULL,
  `target_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_ids`)),
  `notification_channels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_channels`)),
  `scheduled_at` datetime DEFAULT NULL,
  `status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `attachment_filename` varchar(255) DEFAULT NULL COMMENT 'Original filename of the attachment',
  `attachment_filepath` varchar(500) DEFAULT NULL COMMENT 'Server path to the uploaded file',
  `attachment_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `attachment_mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type of the attachment',
  `total_recipients` int(11) DEFAULT 0,
  `sent_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `target_type`, `target_ids`, `notification_channels`, `scheduled_at`, `status`, `created_by`, `created_at`, `updated_at`, `attachment_filename`, `attachment_filepath`, `attachment_size`, `attachment_mime_type`, `total_recipients`, `sent_count`, `failed_count`, `sent_at`) VALUES
(1, 'Welcome to the New Academic Year', 'Dear Parents and Students, Welcome to the new academic year! We are excited to begin this journey with you. Please ensure all admission formalities are completed by the end of this week.', 'all', NULL, '[\"whatsapp\", \"sms\"]', NULL, 'sent', 1, '2025-08-13 13:15:39', '2025-08-13 13:15:39', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(2, 'Fee Payment Reminder', 'This is a gentle reminder that the fee payment for this semester is due by the end of this month. Please visit the school office or use our online payment system.', 'fee_due', NULL, '[\"whatsapp\", \"email\"]', NULL, 'sent', 1, '2025-08-13 13:15:39', '2025-08-13 13:15:39', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(3, 'Parent-Teacher Meeting Schedule', 'Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.', 'all', '[]', '[\"whatsapp\",\"sms\",\"email\"]', '2025-08-13 00:00:00', 'sending', 1, '2025-08-13 13:15:39', '2025-08-13 10:50:29', 'test_attachment.txt', 'uploads/announcements/test_attachment.txt', 25, 'text/plain', 0, 0, 0, '2025-08-13 16:20:29'),
(4, 'Test', 'test message', 'all', '[]', '[\"sms\",\"email\",\"whatsapp\"]', '2025-08-15 00:00:00', 'scheduled', 1, '2025-08-13 10:04:46', '2025-08-13 10:04:46', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(5, 'Test Title', 'Test mmessage', 'parent', '[\"6\",\"3\",\"11\"]', '[\"whatsapp\",\"sms\",\"email\"]', '0000-00-00 00:00:00', 'scheduled', 1, '2025-08-13 10:29:51', '2025-08-13 10:29:51', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(6, '?? Monthly Fee Payment Reminder', 'Dear Parents, monthly fees are due by the 10th of each month. Please ensure timely payment to avoid late fee charges.', 'parent', '[]', '[\"whatsapp\", \"email\"]', NULL, 'sent', 1, '2025-08-24 13:00:26', '2025-08-24 13:00:26', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(7, '????? Monthly Staff Meeting', 'All staff are required to attend the monthly meeting on Friday at 4:00 PM in the conference hall.', 'staff', '[]', '[\"email\", \"sms\"]', NULL, 'sent', 1, '2025-08-23 13:00:26', '2025-08-23 13:00:26', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(8, '?? Sports Day Event', 'Annual sports day is scheduled for next Saturday. All students and parents are invited to participate and cheer for our young athletes.', 'all', '[]', '[\"whatsapp\", \"email\"]', NULL, 'sent', 1, '2025-08-25 08:01:39', '2025-08-25 08:01:39', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(9, '?? Library New Books', 'New collection of books has arrived in the library. Students can now borrow the latest educational and story books.', 'all', '[]', '[\"whatsapp\"]', NULL, 'sent', 1, '2025-08-25 10:01:39', '2025-08-25 10:01:39', NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
(10, '?? Bus Route Changes', 'Temporary changes in bus route 5 and 7 due to construction. Please check updated timings on the notice board.', 'parent', '[]', '[\"sms\", \"whatsapp\"]', NULL, 'sent', 1, '2025-08-25 07:01:39', '2025-08-25 07:01:39', NULL, NULL, NULL, NULL, 0, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `announcement_delivery_status`
--

CREATE TABLE `announcement_delivery_status` (
  `id` int(11) NOT NULL,
  `announcement_id` int(11) NOT NULL,
  `recipient_type` enum('parent','staff','student') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `channel` enum('whatsapp','sms','email') NOT NULL,
  `recipient_contact` varchar(100) NOT NULL,
  `status` enum('pending','sent','delivered','failed','read') DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('admin','staff','parent') NOT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `user_type`, `action`, `table_name`, `record_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:20:45'),
(2, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:20:53'),
(3, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:21:09'),
(4, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:21:16'),
(5, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:21:23'),
(6, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:21:40'),
(7, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:21:58'),
(8, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:22:38'),
(9, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:22:52'),
(10, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:23:03'),
(11, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:23:10'),
(12, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:24:18'),
(13, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:24:52'),
(14, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:25:16'),
(15, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:25:23'),
(16, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:26:03'),
(17, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:26:25'),
(18, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:26:29'),
(19, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:26:56'),
(20, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:27:42'),
(21, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:27:46'),
(22, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:27:51'),
(23, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:27:54'),
(24, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:28:23'),
(25, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:28:28'),
(26, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:29:15'),
(27, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:32:35'),
(28, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:32:58'),
(29, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:33:54'),
(30, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:34:25'),
(31, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:34:51'),
(32, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:35:11'),
(33, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:36:48'),
(34, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:37:15'),
(35, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:37:41'),
(36, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:37:55'),
(37, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:38:23'),
(38, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:38:39'),
(39, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-04 09:38:59'),
(40, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 09:43:13'),
(41, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 10:57:04'),
(42, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 11:01:06'),
(43, 2, 'admin', 'login', 'staff', 2, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-04 11:01:48'),
(44, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:06:08'),
(45, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:06:57'),
(46, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:15:59'),
(47, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:16:27'),
(48, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:16:44'),
(49, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:17:52'),
(50, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:19:33'),
(51, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:19:41'),
(52, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:42:22'),
(53, 1, 'admin', 'grade_created', 'grades', 4, NULL, '{\"name\":\"Class1\",\"description\":\"sdafsd\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 09:52:55'),
(54, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-05 10:30:33'),
(55, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-06 02:08:52'),
(56, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-06 03:25:15'),
(57, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-06 07:32:01'),
(58, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-06 07:51:50'),
(59, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-06 10:51:11'),
(60, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-06 10:54:47'),
(61, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-06 10:56:43'),
(62, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-06 11:00:37'),
(63, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:10:57'),
(64, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-07 00:14:20'),
(65, 1, 'admin', 'student_updated', 'students', 1, '{\"id\":\"1\",\"academic_year_id\":\"1\",\"student_name\":\"Aarav Kumar\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A001\",\"aadhaar_encrypted\":null,\"residential_address\":\"123 Main Street, Mumbai, Maharashtra\",\"pincode\":\"400001\",\"sam_samagrah_id\":null,\"aapar_id\":null,\"admission_date\":\"2025-04-01\",\"total_fees\":\"0.00\",\"parent_id\":\"1\",\"is_active\":\"1\",\"created_at\":\"2025-08-07 09:24:41\",\"updated_at\":\"2025-08-07 09:24:41\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"parent_name\":\"Rajesh Kumar\",\"parent_mobile\":\"9876543210\",\"parent_email\":\"rajesh.kumar@gmail.com\"}', '{\"student_name\":\"Aarav Kumar\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A001\",\"residential_address\":\"123 Main Street, Mumbai, Maharashtra\",\"pincode\":\"400001\",\"sam_samagrah_id\":\"\",\"aapar_id\":\"\",\"admission_date\":\"2025-04-01\",\"total_fees\":500,\"parent_id\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:29:26'),
(66, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:36:18'),
(67, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:53:06'),
(68, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:54:54'),
(69, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:55:13'),
(70, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 00:55:46'),
(71, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:31:51'),
(72, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:32:02'),
(73, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:32:24'),
(74, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:32:28'),
(75, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:32:29'),
(76, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:32:34'),
(77, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:33:03'),
(78, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:33:05'),
(79, 1, 'parent', 'login', 'parents', 1, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-07 04:34:25'),
(80, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '127.0.0.1', 'curl/8.1.2', '2025-08-07 04:34:33'),
(81, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:34:52'),
(82, 1, 'admin', 'role_created', 'roles', 5, NULL, '{\"name\":\"teacher\",\"description\":\"Teacher with class management permissions\",\"permissions\":[\"dashboard\",\"students.view\",\"grades.view\",\"divisions.view\",\"announcements.view\",\"announcements.create\",\"reports.students\"]}', '127.0.0.1', 'curl/8.1.2', '2025-08-07 04:50:55'),
(83, 1, 'admin', 'staff_updated', 'staff', 2, '{\"id\":\"2\",\"name\":\"Dr. Rajesh Kumar\",\"mobile\":\"9876543210\",\"email\":\"principal@school.com\",\"address\":\"456 Principal Residence\",\"pincode\":\"400002\",\"role_id\":\"2\",\"password_hash\":\"$2y$10$TcZry2IqQrd0SC32vbCpb.QkaDyPTEBBgtGsbepY2VIhMSJZDACvu\",\"is_active\":\"1\",\"created_at\":\"2025-08-04 18:06:20\",\"updated_at\":\"2025-08-04 18:20:34\",\"role_name\":\"admin\",\"permissions\":\"[\\\"dashboard\\\", \\\"academic_years\\\", \\\"grades\\\", \\\"divisions\\\", \\\"students\\\", \\\"parents\\\", \\\"staff\\\", \\\"roles\\\", \\\"fees\\\", \\\"announcements\\\", \\\"complaints\\\", \\\"reports\\\", \\\"search\\\", \\\"audit_logs\\\"]\",\"assigned_grades\":[],\"assigned_divisions\":[]}', '{\"name\":\"Dr. Rajesh Kumar\",\"mobile\":\"9876543210\",\"email\":\"principal@school.com\",\"role_id\":\"2\",\"address\":\"456 Principal Residence\",\"pincode\":\"400002\",\"grades\":[\"1\",\"2\"],\"divisions\":[\"1\",\"2\"]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 04:54:28'),
(84, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 05:38:16'),
(85, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 06:18:34'),
(86, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Kuma\",\"types\":[\"students\",\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":4,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:45:24'),
(87, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:45:25'),
(88, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:45:39'),
(89, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:31'),
(90, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:32'),
(91, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"parents\",\"staff\",\"complaints\",\"announcements\",\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:32'),
(92, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"staff\",\"complaints\",\"announcements\",\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:33'),
(93, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"staff\",\"complaints\",\"announcements\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:34'),
(94, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"staff\",\"complaints\",\"announcements\",\"parents\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:34'),
(95, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"complaints\",\"announcements\",\"parents\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:35'),
(96, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"complaints\",\"parents\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:36'),
(97, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"parents\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:36'),
(98, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:37'),
(99, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:38'),
(100, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:38'),
(101, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:45'),
(102, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:46:55'),
(103, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:03'),
(104, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:08'),
(105, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:16'),
(106, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:21'),
(107, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:31'),
(108, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:34'),
(109, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Aarav\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:47:42'),
(110, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Meera\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":2,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:50:54'),
(111, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"Meera Joshi\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":2,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 07:55:38'),
(112, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 08:36:10'),
(113, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 23:30:46'),
(114, 1, 'admin', 'parent_created', 'parents', 32, NULL, '{\"name\":\"Shaikh Shakeel Sir\",\"mobile\":\"9271431483\",\"email\":\"shahidhusen31@gmail.com\",\"password\":\"123456\",\"address\":\"dfkjsdklfjdklsj dhule\",\"pincode\":\"424001\",\"is_active\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-07 23:38:22'),
(115, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:16:39'),
(116, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:04'),
(117, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:20'),
(118, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:20'),
(119, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:21'),
(120, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\",\"parents\",\"staff\",\"complaints\",\"announcements\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:22'),
(121, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:23'),
(122, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\\t\",\"types\":[\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:27'),
(123, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\",\"types\":[\"students\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 11:17:28'),
(124, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-08 23:40:14'),
(125, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C4A003\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 00:32:08'),
(126, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C4A003\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 00:35:17'),
(127, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C4A003\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 00:35:35'),
(128, 1, 'admin', 'fee_collected', 'fee_collections', 5, NULL, '{\"student_id\":\"21\",\"amount\":2000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfsdfsdfs\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 01:13:45'),
(129, 1, 'admin', 'fee_collected', 'fee_collections', 6, NULL, '{\"student_id\":\"21\",\"amount\":2000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfsdfsdfs\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 01:14:13'),
(130, 1, 'admin', 'fee_collected', 'fee_collections', 7, NULL, '{\"student_id\":\"21\",\"amount\":2000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfsdfsdfs\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 01:14:38'),
(131, 1, 'admin', 'fee_collected', 'fee_collections', 8, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":\"Test for status check\",\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"Status test payment\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 01:18:12'),
(132, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 01:43:47'),
(133, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 01:54:09'),
(134, 1, 'admin', 'fee_collected', 'fee_collections', 9, NULL, '{\"student_id\":\"2\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"dsfad\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 03:13:16'),
(135, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:25:13'),
(136, 1, 'admin', 'fee_collected', 'fee_collections', 13, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:25:37'),
(137, 1, 'admin', 'fee_collected', 'fee_collections', 14, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:26:25'),
(138, 1, 'admin', 'fee_collected', 'fee_collections', 15, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:26:51'),
(139, 1, 'admin', 'fee_collected', 'fee_collections', 16, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:27:14'),
(140, 1, 'admin', 'fee_collected', 'fee_collections', 17, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:27:20'),
(141, 1, 'admin', 'fee_collected', 'fee_collections', 18, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:27:45'),
(142, 1, 'admin', 'fee_collected', 'fee_collections', 19, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:28:01'),
(143, 1, 'admin', 'fee_collected', 'fee_collections', 20, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:28:53'),
(144, 1, 'admin', 'fee_collected', 'fee_collections', 21, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:29:36'),
(145, 1, 'admin', 'fee_collected', 'fee_collections', 22, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:29:51'),
(146, 1, 'admin', 'fee_collected', 'fee_collections', 24, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:30:21'),
(147, 1, 'admin', 'fee_collected', 'fee_collections', 25, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdafsd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:30:44'),
(148, 1, 'admin', 'fee_collected', 'fee_collections', 26, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdafsd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:31:15'),
(149, 1, 'admin', 'fee_collected', 'fee_collections', 27, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfasd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', NULL, '2025-08-09 06:31:33'),
(150, 1, 'admin', 'fee_collected', 'fee_collections', 28, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdafsd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:32:09'),
(151, 1, 'admin', 'fee_collected', 'fee_collections', 29, NULL, '{\"student_id\":\"21\",\"amount\":3000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"6\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfafsd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:33:18'),
(152, 1, 'admin', 'fee_collected', 'fee_collections', 31, NULL, '{\"student_id\":\"21\",\"amount\":3000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"6\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfafsd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:33:46'),
(153, 1, 'admin', 'fee_collected', 'fee_collections', 32, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"API test\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:33:58'),
(154, 1, 'admin', 'fee_collected', 'fee_collections', 33, NULL, '{\"student_id\":\"21\",\"amount\":500,\"payment_method\":\"cash\",\"fee_category_id\":\"10\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:34:22'),
(155, 1, 'admin', 'fee_collected', 'fee_collections', 34, NULL, '{\"student_id\":\"21\",\"amount\":500,\"payment_method\":\"cash\",\"fee_category_id\":\"10\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:35:02'),
(156, 1, 'admin', 'fee_collected', 'fee_collections', 35, NULL, '{\"student_id\":\"21\",\"amount\":500,\"payment_method\":\"cash\",\"fee_category_id\":\"10\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:35:31'),
(157, 1, 'admin', 'fee_collected', 'fee_collections', 36, NULL, '{\"student_id\":\"21\",\"amount\":3000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"6\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdfafsd\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:35:52'),
(158, 1, 'admin', 'fee_collected', 'fee_collections', 37, NULL, '{\"student_id\":\"21\",\"amount\":3000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"6\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdadfdfds\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:36:19'),
(159, 1, 'admin', 'fee_collected', 'fee_collections', 38, NULL, '{\"student_id\":\"21\",\"amount\":3000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"6\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sdadfdfds\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:37:16'),
(160, 1, 'admin', 'fee_collected', 'fee_collections', 39, NULL, '{\"student_id\":21,\"amount\":500.5,\"payment_method\":\"cash\",\"remarks\":\"Test payment\",\"fee_category_id\":10,\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:37:43'),
(161, 1, 'admin', 'fee_collected', 'fee_collections', 40, NULL, '{\"student_id\":21,\"amount\":500,\"payment_method\":\"cash\",\"remarks\":\"Test\",\"fee_category_id\":10,\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:38:04'),
(162, 1, 'admin', 'fee_collected', 'fee_collections', 42, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sddfad\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:39:24'),
(163, 1, 'admin', 'fee_collected', 'fee_collections', 43, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sddfad\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:40:22'),
(164, 1, 'admin', 'fee_collected', 'fee_collections', 44, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sddfad\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:40:27'),
(165, 1, 'admin', 'fee_collected', 'fee_collections', 45, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sddfad\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:41:09'),
(166, 1, 'admin', 'fee_collected', 'fee_collections', 46, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"sddfad\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:42:33'),
(167, 1, 'admin', 'fee_collected', 'fee_collections', 47, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"dsafsdfsdafds\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:42:43'),
(168, 1, 'admin', 'fee_collected', 'fee_collections', 49, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"dsafsdfsdafds\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:44:02'),
(179, 1, 'admin', 'fee_collected', 'fee_collections', 62, NULL, '{\"student_id\":21,\"amount\":600,\"payment_method\":\"cash\",\"remarks\":\"Final API test\",\"fee_category_id\":10,\"is_direct_payment\":1,\"collected_by_staff_id\":1}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:48:12'),
(180, 1, 'admin', 'fee_collected', 'fee_collections', 63, NULL, '{\"student_id\":21,\"amount\":700,\"payment_method\":\"cash\",\"remarks\":\"Final successful test\",\"fee_category_id\":10,\"is_direct_payment\":1,\"collected_by_staff_id\":1}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:48:52'),
(181, 1, 'admin', 'fee_collected', 'fee_collections', 64, NULL, '{\"student_id\":21,\"amount\":800,\"payment_method\":\"cash\",\"remarks\":\"Success test\",\"fee_category_id\":10,\"is_direct_payment\":1,\"collected_by_staff_id\":1}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:49:13'),
(182, 1, 'admin', 'fee_collected', 'fee_collections', 65, NULL, '{\"student_id\":\"21\",\"amount\":5000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"2\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"dsafsdfsdafds\",\"is_direct_payment\":1,\"collected_by_staff_id\":1}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 06:49:18'),
(183, 1, 'admin', 'fee_collected', 'fee_collections', 66, NULL, '{\"student_id\":21,\"amount\":1000,\"payment_method\":\"online\",\"remarks\":\"Online payment test\",\"fee_category_id\":10,\"is_direct_payment\":1,\"collected_by_staff_id\":1}', '127.0.0.1', 'curl/8.1.2', '2025-08-09 06:49:47'),
(184, 1, 'admin', 'fee_collected', 'fee_collections', 67, NULL, '{\"student_id\":\"21\",\"amount\":1000,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"fee_category_id\":\"10\",\"direct_fee_due_date\":\"2025-08-09\",\"direct_fee_description\":\"asddsf\",\"is_direct_payment\":1,\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-09 07:12:40'),
(185, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 09:22:12'),
(186, 1, 'admin', 'announcement_created', 'announcements', 4, NULL, '{\"title\":\"Test\",\"message\":\"test message\",\"target_type\":\"all\",\"target_ids\":[],\"channels\":[\"sms\",\"email\",\"whatsapp\"],\"scheduled_at\":\"2025-08-15\",\"created_by_staff_id\":\"1\",\"status\":\"scheduled\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 10:04:46');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_type`, `action`, `table_name`, `record_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(187, 1, 'admin', 'announcement_updated', 'announcements', 3, '{\"id\":\"3\",\"title\":\"Parent-Teacher Meeting Schedule\",\"content\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"target_type\":\"all\",\"target_ids\":[],\"notification_channels\":\"[\\\"whatsapp\\\", \\\"sms\\\", \\\"email\\\"]\",\"scheduled_at\":null,\"status\":\"draft\",\"created_by\":\"1\",\"created_at\":\"2025-08-13 18:45:39\",\"updated_at\":\"2025-08-13 18:45:39\",\"attachment_filename\":null,\"attachment_filepath\":null,\"attachment_size\":null,\"attachment_mime_type\":null,\"created_by_name\":\"System Administrator\",\"message\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"created_by_staff_id\":\"1\",\"total_recipients\":0,\"sent_count\":0,\"failed_count\":0}', '{\"title\":\"Parent-Teacher Meeting Schedule\",\"message\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"target_type\":\"all\",\"target_ids\":[],\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"scheduled_at\":\"\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 10:10:50'),
(188, 1, 'admin', 'announcement_created', 'announcements', 5, NULL, '{\"title\":\"Test Title\",\"message\":\"Test mmessage\",\"target_type\":\"parent\",\"target_ids\":[\"6\",\"3\",\"11\"],\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"scheduled_at\":\"\",\"created_by_staff_id\":\"1\",\"status\":\"scheduled\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 10:29:51'),
(189, 1, 'admin', 'announcement_updated', 'announcements', 3, '{\"id\":\"3\",\"title\":\"Parent-Teacher Meeting Schedule\",\"content\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"target_type\":\"all\",\"target_ids\":[],\"notification_channels\":\"[\\\"whatsapp\\\",\\\"sms\\\",\\\"email\\\"]\",\"scheduled_at\":\"0000-00-00 00:00:00\",\"status\":\"draft\",\"created_by\":\"1\",\"created_at\":\"2025-08-13 18:45:39\",\"updated_at\":\"2025-08-13 19:12:42\",\"attachment_filename\":\"test_attachment.txt\",\"attachment_filepath\":\"uploads\\/announcements\\/test_attachment.txt\",\"attachment_size\":\"25\",\"attachment_mime_type\":\"text\\/plain\",\"created_by_name\":\"System Administrator\",\"message\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"created_by_staff_id\":\"1\",\"total_recipients\":0,\"sent_count\":0,\"failed_count\":0}', '{\"title\":\"Parent-Teacher Meeting Schedule\",\"message\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"target_type\":\"all\",\"target_ids\":[],\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"scheduled_at\":\"2025-08-13\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 10:42:18'),
(190, 1, 'admin', 'announcement_updated', 'announcements', 3, '{\"id\":\"3\",\"title\":\"Parent-Teacher Meeting Schedule\",\"content\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"target_type\":\"all\",\"target_ids\":[],\"notification_channels\":\"[\\\"whatsapp\\\",\\\"sms\\\",\\\"email\\\"]\",\"scheduled_at\":\"2025-08-13 00:00:00\",\"status\":\"draft\",\"created_by\":\"1\",\"created_at\":\"2025-08-13 18:45:39\",\"updated_at\":\"2025-08-13 16:12:18\",\"attachment_filename\":\"test_attachment.txt\",\"attachment_filepath\":\"uploads\\/announcements\\/test_attachment.txt\",\"attachment_size\":\"25\",\"attachment_mime_type\":\"text\\/plain\",\"created_by_name\":\"System Administrator\",\"message\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"created_by_staff_id\":\"1\",\"total_recipients\":0,\"sent_count\":0,\"failed_count\":0}', '{\"title\":\"Parent-Teacher Meeting Schedule\",\"message\":\"Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.\",\"target_type\":\"all\",\"target_ids\":[],\"channels\":[\"whatsapp\",\"sms\",\"email\"],\"scheduled_at\":\"2025-08-13\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 10:43:21'),
(191, 1, 'admin', 'complaint_created', 'complaints', 2, NULL, '{\"parent_id\":1,\"student_id\":1,\"subject\":\"Test Complaint\",\"description\":\"This is a test complaint to verify the system is working\",\"category\":\"other\",\"priority\":\"medium\",\"is_anonymous\":0,\"attachments\":[]}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 10:56:20'),
(192, 1, 'admin', 'complaint_assigned', 'complaints', 2, NULL, '{\"assigned_to\":1,\"assigned_by\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 11:01:55'),
(193, 1, 'admin', 'complaint_assigned', 'complaints', 2, NULL, '{\"assigned_to\":1,\"assigned_by\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 11:02:06'),
(194, 1, 'admin', 'complaint_assigned', 'complaints', 2, NULL, '{\"assigned_to\":1,\"assigned_by\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 11:02:19'),
(195, 1, 'admin', 'complaint_resolved', 'complaints', 2, NULL, '{\"resolution\":\"sdfasd\",\"resolved_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:04:03'),
(196, 1, 'admin', 'complaint_created', 'complaints', 5, NULL, '{\"parent_id\":\"3\",\"student_id\":null,\"subject\":\"safads\",\"description\":\"asdfadsf\",\"category\":\"other\",\"priority\":\"high\",\"is_anonymous\":1,\"attachments\":[]}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 11:06:03'),
(197, 1, 'admin', 'complaint_created', 'complaints', 6, NULL, '{\"parent_id\":\"3\",\"student_id\":null,\"subject\":\"safads\",\"description\":\"asdfadsf\",\"category\":\"other\",\"priority\":\"high\",\"is_anonymous\":1,\"attachments\":[]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:06:08'),
(198, 1, 'admin', 'complaint_assigned', 'complaints', 6, NULL, '{\"assigned_to\":\"2\",\"assigned_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:06:20'),
(199, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"complaints\",\"filters\":[],\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:10:02'),
(200, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"complaints\",\"filters\":[],\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:10:08'),
(201, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":[],\"generated_by\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 11:16:21'),
(202, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"complaints\",\"filters\":{\"start_date\":\"1990-05-01\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:17:06'),
(203, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":[],\"generated_by\":\"1\"}', '127.0.0.1', 'curl/8.1.2', '2025-08-13 11:17:22'),
(204, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:24:23'),
(205, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":[],\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:26:57'),
(206, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":[],\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:27:02'),
(207, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:27:08'),
(208, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"complaints\",\"filters\":[],\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:27:25'),
(209, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"sf\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-13 11:29:14'),
(210, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-08-14 00:34:56'),
(211, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-08-14 00:47:09'),
(212, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"ssdf\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 00:53:15'),
(213, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"category_id\":\"1\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:03:24'),
(214, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"category_id\":\"1\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:05:18'),
(215, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"category_id\":\"1\",\"start_date\":\"2023-01-01\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:05:43'),
(216, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"start_date\":\"2023-01-01\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:05:54'),
(217, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"status\":\"paid\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:06:20'),
(218, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":[],\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:14:11'),
(219, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"category_id\":\"15\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:14:16'),
(220, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"15\",\"overdue_only\":\"1\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:17:48'),
(221, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"15\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:23:22'),
(222, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"category_id\":\"15\",\"status\":\"new\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:24:22'),
(223, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"15\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:29:32'),
(224, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"15\",\"start_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:57:32'),
(225, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"start_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:57:40'),
(226, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"start_date\":\"2025-08-15\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 01:57:48'),
(227, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:04:03'),
(228, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"2\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:04:18'),
(229, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"6\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:04:25'),
(230, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"6\",\"staff_id\":\"2\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:04:30'),
(231, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"staff_id\":\"2\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:04:34'),
(232, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:04:38'),
(233, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:09:21'),
(234, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:10:09'),
(235, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:10:32'),
(236, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:10:48'),
(237, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:12:20'),
(238, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:13:59'),
(239, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:14:23'),
(240, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 02:15:09'),
(241, 1, 'staff', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 06:56:59'),
(242, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:06:35'),
(243, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:06:43'),
(244, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:08:12'),
(245, 1, 'admin', 'complaint_created', 'complaints', 7, NULL, '{\"parent_id\":\"3\",\"student_id\":null,\"subject\":\"dadsfdaf\",\"description\":\"sdafsd\",\"category\":\"other\",\"priority\":\"urgent\",\"is_anonymous\":1,\"attachments\":[]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:17:36'),
(246, 1, 'admin', 'complaint_assigned', 'complaints', 7, NULL, '{\"assigned_to\":\"3\",\"assigned_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:17:56'),
(247, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_collection\",\"filters\":{\"academic_year_id\":\"1\",\"category_id\":\"1\",\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:19:58'),
(248, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"fee_dues\",\"filters\":{\"academic_year_id\":\"1\",\"overdue_only\":\"0\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:20:18'),
(249, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"staff_collection\",\"filters\":{\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:20:28'),
(250, 1, 'admin', 'report_generated', 'reports', NULL, NULL, '{\"report_type\":\"complaints\",\"filters\":{\"start_date\":\"2025-07-14\",\"end_date\":\"2025-08-14\"},\"generated_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:20:39'),
(251, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:21:22'),
(252, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"C1A001\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":1,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:21:38'),
(253, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"asfd\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:28:48'),
(254, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"sadf\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:29:45'),
(255, 1, 'admin', 'global_search', 'search', NULL, NULL, '{\"query\":\"sadf\",\"types\":[\"students\",\"parents\",\"staff\"],\"total_results\":0,\"searched_by\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:33:40'),
(256, 1, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:44:05'),
(257, 1, 'admin', 'staff_updated', 'staff', 4, '{\"id\":\"4\",\"name\":\"Mr. Amit Patel\",\"mobile\":\"9876543212\",\"email\":\"amit.teacher@school.com\",\"address\":\"321 Teacher Colony\",\"pincode\":\"400004\",\"role_id\":\"3\",\"password_hash\":\"$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC\\/.og\\/at2.uheWG\\/igi\",\"is_active\":\"1\",\"created_at\":\"2025-08-04 18:06:20\",\"updated_at\":\"2025-08-04 18:06:20\",\"role_name\":\"staff\",\"permissions\":\"[\\\"dashboard\\\", \\\"students.view\\\", \\\"students.create\\\", \\\"students.update\\\", \\\"parents.view\\\", \\\"fees.view\\\", \\\"fees.collect\\\", \\\"announcements.view\\\", \\\"complaints.view\\\", \\\"reports.students\\\"]\",\"assigned_grades\":[],\"assigned_divisions\":[]}', '{\"name\":\"Mr. Amit Patel\",\"mobile\":\"9876543212\",\"email\":\"amit.teacher@school.com\",\"password\":\"9876543212\",\"role_id\":\"3\",\"address\":\"321 Teacher Colony\",\"pincode\":\"400004\",\"grades\":[],\"divisions\":[]}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:44:29'),
(258, 4, 'staff', 'login', 'staff', 4, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:44:38'),
(259, 4, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:44:42'),
(260, 4, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 09:50:32'),
(261, 4, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-14 10:10:51'),
(262, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:25:31'),
(263, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:29:54'),
(264, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:30:04'),
(265, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:32:30'),
(266, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:33:11'),
(267, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:33:46'),
(268, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:35:42'),
(269, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:37:15'),
(270, 1, 'admin', 'fee_structure_deleted', 'fee_structures', 249, '{\"id\":\"249\",\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"division_id\":null,\"semester\":\"Semester 1\",\"fee_category_id\":\"15\",\"amount\":\"200.00\",\"due_date\":null,\"late_fee_amount\":\"0.00\",\"late_fee_days\":\"0\",\"is_mandatory\":\"1\",\"installments_allowed\":\"0\",\"max_installments\":\"1\",\"description\":\"Mandatory Activity Fee for Semester 1\",\"item_photo\":null,\"item_size\":null,\"is_active\":\"1\",\"created_at\":\"2025-08-09 08:52:57\",\"updated_at\":\"2025-08-09 08:52:57\",\"academic_year_name\":\"2025-2026\",\"grade_name\":\"Class 1\",\"division_name\":null,\"category_name\":\"Activity Fee\",\"category_display_name\":\"Activity Fee\"}', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:37:33'),
(271, 1, 'admin', 'fee_category_created', 'fee_categories', 19, NULL, '{\"name\":\"Semester 1\",\"description\":\"Semester 1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:38:40'),
(272, 1, 'admin', 'fee_category_created', 'fee_categories', 20, NULL, '{\"name\":\"Semester 2\",\"description\":\"Semester 2\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:38:48'),
(273, 1, 'admin', 'fee_structure_created', 'fee_structures', 1, NULL, '{\"fee_category_id\":\"19\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000\",\"is_mandatory\":1,\"due_date\":\"2025-08-19\",\"late_fee_amount\":\"100\",\"late_fee_days\":\"1\",\"description\":\"sdfd\",\"item_size\":\"\",\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:39:36'),
(274, 1, 'admin', 'fee_structure_created', 'fee_structures', 1, NULL, '{\"fee_category_id\":\"19\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000\",\"is_mandatory\":1,\"due_date\":\"2025-08-19\",\"late_fee_amount\":\"100\",\"late_fee_days\":\"2\",\"description\":\"sdf\",\"item_size\":\"\",\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 06:53:37'),
(275, 1, 'admin', 'fee_structure_created', 'fee_structures', 3, NULL, '{\"fee_category_id\":\"19\",\"grade_id\":\"1\",\"division_id\":\"2\",\"amount\":\"5000\",\"is_mandatory\":1,\"due_date\":\"2025-08-18\",\"late_fee_amount\":\"100\",\"late_fee_days\":\"1\",\"description\":\"sdfds\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:01:17'),
(276, 1, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:08:18'),
(277, 1, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:08:24'),
(278, 1, 'admin', 'fee_structure_created', 'fee_structures', 5, NULL, '{\"fee_category_id\":\"1\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"100\",\"is_mandatory\":0,\"due_date\":\"2025-08-20\",\"late_fee_amount\":\"10\",\"late_fee_days\":\"10\",\"description\":\"sdfasd\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:13:26'),
(279, 1, 'admin', 'fee_collected', 'fee_collections', 68, NULL, '{\"student_id\":\"1\",\"amount\":2500,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"student_fee_assignment_id\":\"3\",\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:14:47'),
(280, 1, 'admin', 'fee_structure_created', 'fee_structures', 1, NULL, '{\"fee_category_id\":\"19\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"1000\",\"is_mandatory\":1,\"due_date\":\"2025-12-30\",\"late_fee_amount\":\"0\",\"late_fee_days\":\"1\",\"description\":\"sadf\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:19:44'),
(281, 1, 'admin', 'fee_structure_created', 'fee_structures', 3, NULL, '{\"fee_category_id\":\"20\",\"grade_id\":\"2\",\"division_id\":\"3\",\"amount\":\"100\",\"is_mandatory\":1,\"due_date\":\"2025-08-30\",\"late_fee_amount\":\"1\",\"late_fee_days\":\"1\",\"description\":\"sdfs\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:27:21'),
(282, 1, 'admin', 'fee_structure_updated', 'fee_structures', 3, '{\"id\":\"3\",\"academic_year_id\":\"1\",\"grade_id\":\"2\",\"division_id\":\"3\",\"semester\":null,\"fee_category_id\":\"20\",\"amount\":\"100.00\",\"due_date\":\"2025-08-30\",\"late_fee_amount\":\"1.00\",\"late_fee_days\":\"1\",\"is_mandatory\":\"1\",\"installments_allowed\":\"0\",\"max_installments\":\"1\",\"description\":\"sdfs\",\"item_photo\":null,\"item_size\":\"\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 12:57:21\",\"updated_at\":\"2025-08-18 12:57:21\",\"academic_year_name\":\"2025-2026\",\"grade_name\":\"Class 2\",\"division_name\":\"A\",\"category_name\":\"Semester 2\",\"category_display_name\":\"Semester 2\"}', '{\"fee_category_id\":\"20\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"100.00\",\"is_mandatory\":1,\"due_date\":\"2025-08-30\",\"late_fee_amount\":\"1.00\",\"late_fee_days\":\"1\",\"description\":\"sdfs\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:41:18'),
(283, 1, 'admin', 'fee_collected', 'fee_collections', 69, NULL, '{\"student_id\":\"1\",\"amount\":500,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"student_fee_assignment_id\":\"2\",\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:50:15'),
(284, 1, 'admin', 'fee_collected', 'fee_collections', 70, NULL, '{\"student_id\":\"1\",\"amount\":150,\"payment_method\":\"cash\",\"reference_number\":null,\"remarks\":null,\"student_fee_assignment_id\":\"1\",\"collected_by_staff_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:50:31'),
(285, 1, 'admin', 'student_updated', 'students', 1, '{\"id\":\"1\",\"academic_year_id\":\"1\",\"student_name\":\"Aarav Kumar\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A001\",\"aadhaar_encrypted\":null,\"residential_address\":\"123 Main Street, Mumbai, Maharashtra\",\"pincode\":\"400001\",\"sam_samagrah_id\":\"\",\"aapar_id\":\"\",\"admission_date\":\"2025-04-01\",\"total_fees\":\"500.00\",\"parent_id\":\"1\",\"is_active\":\"1\",\"created_at\":\"2025-08-07 09:24:41\",\"updated_at\":\"2025-08-07 05:59:26\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"parent_name\":\"Rajesh Kumar\",\"parent_mobile\":\"9876543210\",\"parent_email\":\"rajesh.kumar@gmail.com\"}', '{\"student_name\":\"Aarav Kumar\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A001\",\"residential_address\":\"123 Main Street, Mumbai, Maharashtra\",\"pincode\":\"400001\",\"sam_samagrah_id\":\"\",\"aapar_id\":\"\",\"admission_date\":\"2025-04-01\",\"parent_id\":1,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 07:55:10'),
(286, 1, 'admin', 'student_updated', 'students', 44, '{\"id\":\"44\",\"academic_year_id\":\"1\",\"student_name\":\"Test Studnet\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A200\",\"aadhaar_encrypted\":null,\"residential_address\":\"sdfdsfafdsafsdfds\",\"pincode\":\"424001\",\"sam_samagrah_id\":\"23423423\",\"aapar_id\":\"23432432\",\"admission_date\":\"2025-08-18\",\"total_fees\":\"0.00\",\"parent_id\":\"3\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 13:30:48\",\"updated_at\":\"2025-08-18 13:30:48\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"parent_name\":\"Amit Patel\",\"parent_mobile\":\"9876543214\",\"parent_email\":\"amit.patel@gmail.com\"}', '{\"student_name\":\"Test Studnet\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A200\",\"residential_address\":\"sdfdsfafdsafsdfds\",\"pincode\":\"424001\",\"sam_samagrah_id\":\"23423423\",\"aapar_id\":\"23432432\",\"admission_date\":\"2025-08-18\",\"parent_id\":3,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:03:01'),
(287, 1, 'admin', 'student_updated', 'students', 44, '{\"id\":\"44\",\"academic_year_id\":\"1\",\"student_name\":\"Test Studnet\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A200\",\"aadhaar_encrypted\":null,\"residential_address\":\"sdfdsfafdsafsdfds\",\"pincode\":\"424001\",\"sam_samagrah_id\":\"23423423\",\"aapar_id\":\"23432432\",\"admission_date\":\"2025-08-18\",\"total_fees\":\"0.00\",\"parent_id\":\"3\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 13:30:48\",\"updated_at\":\"2025-08-18 13:33:01\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"parent_name\":\"Amit Patel\",\"parent_mobile\":\"9876543214\",\"parent_email\":\"amit.patel@gmail.com\"}', '{\"student_name\":\"Test Studnet\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A200\",\"residential_address\":\"sdfdsfafdsafsdfds\",\"pincode\":\"424001\",\"sam_samagrah_id\":\"23423423\",\"aapar_id\":\"23432432\",\"admission_date\":\"2025-08-18\",\"parent_id\":3,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:03:26'),
(288, 1, 'admin', 'student_deleted', 'students', 44, '{\"id\":\"44\",\"academic_year_id\":\"1\",\"student_name\":\"Test Studnet\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A200\",\"aadhaar_encrypted\":null,\"residential_address\":\"sdfdsfafdsafsdfds\",\"pincode\":\"424001\",\"sam_samagrah_id\":\"23423423\",\"aapar_id\":\"23432432\",\"admission_date\":\"2025-08-18\",\"total_fees\":\"0.00\",\"parent_id\":\"3\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 13:30:48\",\"updated_at\":\"2025-08-18 13:33:26\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"parent_name\":\"Amit Patel\",\"parent_mobile\":\"9876543214\",\"parent_email\":\"amit.patel@gmail.com\"}', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:05:24'),
(289, 1, 'admin', 'student_deleted', 'students', 45, '{\"id\":\"45\",\"academic_year_id\":\"1\",\"student_name\":\"Test Studnet\",\"grade_id\":\"1\",\"division_id\":\"1\",\"roll_number\":\"C1A2222\",\"aadhaar_encrypted\":null,\"residential_address\":\"sdfdsfafdsafsdfds\",\"pincode\":\"424001\",\"sam_samagrah_id\":\"23423423\",\"aapar_id\":\"23432432\",\"admission_date\":\"2025-08-18\",\"total_fees\":\"0.00\",\"parent_id\":\"3\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 13:31:06\",\"updated_at\":\"2025-08-18 13:31:06\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"parent_name\":\"Amit Patel\",\"parent_mobile\":\"9876543214\",\"parent_email\":\"amit.patel@gmail.com\"}', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:05:29'),
(290, 1, 'admin', 'fee_structure_created', 'fee_structures', 6, NULL, '{\"fee_category_id\":\"1\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"100\",\"is_mandatory\":0,\"due_date\":\"2025-08-18\",\"late_fee_amount\":\"1\",\"late_fee_days\":\"1\",\"description\":\"sadfsd\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:15:28'),
(291, 1, 'admin', 'fee_structure_created', 'fee_structures', 1, NULL, '{\"fee_category_id\":\"19\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000\",\"is_mandatory\":1,\"due_date\":\"2025-12-18\",\"late_fee_amount\":\"0\",\"late_fee_days\":\"1\",\"description\":\"sadfasdfa\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:28:05'),
(292, 1, 'admin', 'fee_structure_created', 'fee_structures', 2, NULL, '{\"fee_category_id\":\"20\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000\",\"is_mandatory\":0,\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"description\":\"\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:32:34'),
(293, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-18 08:37:40'),
(294, 1, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-08-18 09:19:44'),
(295, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:08:23'),
(296, 1, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:08:24'),
(297, 1, 'admin', 'academic_year_updated', 'academic_years', 1, '{\"id\":\"1\",\"name\":\"2025-2026\",\"start_date\":\"2025-04-01\",\"end_date\":\"2026-03-31\",\"is_active\":\"1\",\"is_default\":\"1\",\"description\":null,\"created_at\":\"2025-08-06 12:18:31\",\"updated_at\":\"2025-08-06 12:18:31\"}', '{\"name\":\"2025-2026\",\"start_date\":\"2025-04-01\",\"end_date\":\"2026-03-31\",\"is_default\":1,\"description\":\"sdafsdf\",\"is_active\":1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:10:45'),
(298, 1, 'admin', 'grade_created', 'grades', 14, NULL, '{\"name\":\"Test Grade\",\"description\":\"sdfsdfsd\",\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:11:12'),
(299, 1, 'admin', 'grade_deleted', 'grades', 10, '{\"id\":\"10\",\"academic_year_id\":\"1\",\"name\":\"Test Grade 12\",\"description\":\"Test Grade for No Fees Scenario\",\"display_order\":\"12\",\"is_active\":\"1\",\"created_at\":\"2025-08-08 09:40:13\",\"updated_at\":\"2025-08-08 09:40:13\",\"division_count\":\"1\",\"student_count\":0}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:12:08'),
(300, 1, 'admin', 'grade_created', 'grades', 15, NULL, '{\"name\":\"Test Grade\",\"description\":\"sdfklasjdfksdjlf\",\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:12:21'),
(301, 1, 'admin', 'grade_deleted', 'grades', 14, '{\"id\":\"14\",\"academic_year_id\":\"1\",\"name\":\"Test Grade\",\"description\":\"sdfsdfsd\",\"display_order\":\"1\",\"is_active\":\"1\",\"created_at\":\"2025-08-19 06:41:12\",\"updated_at\":\"2025-08-19 06:41:12\",\"division_count\":\"0\",\"student_count\":0}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:22:10'),
(302, 1, 'admin', 'grade_created', 'grades', 16, NULL, '{\"name\":\"Test grade\",\"description\":\"sdfsdfasfsd\",\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:22:25'),
(303, 1, 'admin', 'division_created', 'divisions', 10, NULL, '{\"grade_id\":\"15\",\"name\":\"A\",\"capacity\":50}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:23:31'),
(304, 1, 'admin', 'fee_structure_updated', 'fee_structures', 2, '{\"id\":\"2\",\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"division_id\":\"1\",\"semester\":null,\"fee_category_id\":\"20\",\"amount\":\"5000.00\",\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"is_mandatory\":\"0\",\"installments_allowed\":\"0\",\"max_installments\":\"1\",\"description\":\"\",\"item_photo\":null,\"item_size\":\"\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 14:02:34\",\"updated_at\":\"2025-08-18 14:02:34\",\"academic_year_name\":\"2025-2026\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"category_name\":\"Semester 2\",\"category_display_name\":\"Semester 2\"}', '{\"fee_category_id\":\"20\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000.00\",\"is_mandatory\":1,\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"description\":\"\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:35:38'),
(305, 1, 'admin', 'fee_structure_updated', 'fee_structures', 2, '{\"id\":\"2\",\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"division_id\":\"1\",\"semester\":null,\"fee_category_id\":\"20\",\"amount\":\"5000.00\",\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"is_mandatory\":\"1\",\"installments_allowed\":\"0\",\"max_installments\":\"1\",\"description\":\"\",\"item_photo\":null,\"item_size\":\"\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 14:02:34\",\"updated_at\":\"2025-08-19 07:05:38\",\"academic_year_name\":\"2025-2026\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"category_name\":\"Semester 2\",\"category_display_name\":\"Semester 2\"}', '{\"fee_category_id\":\"20\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000.00\",\"is_mandatory\":0,\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"description\":\"\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:35:44'),
(306, 1, 'admin', 'fee_structure_created', 'fee_structures', 3, NULL, '{\"fee_category_id\":\"12\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"399.98\",\"is_mandatory\":0,\"due_date\":\"2025-08-19\",\"late_fee_amount\":\"10\",\"late_fee_days\":null,\"description\":\"sdfasdfsd\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:40:19');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_type`, `action`, `table_name`, `record_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(307, 1, 'admin', 'fee_structure_updated', 'fee_structures', 2, '{\"id\":\"2\",\"academic_year_id\":\"1\",\"grade_id\":\"1\",\"division_id\":\"1\",\"semester\":null,\"fee_category_id\":\"20\",\"amount\":\"5000.00\",\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"is_mandatory\":\"0\",\"installments_allowed\":\"0\",\"max_installments\":\"1\",\"description\":\"\",\"item_photo\":null,\"item_size\":\"\",\"is_active\":\"1\",\"created_at\":\"2025-08-18 14:02:34\",\"updated_at\":\"2025-08-19 07:05:44\",\"academic_year_name\":\"2025-2026\",\"grade_name\":\"Class 1\",\"division_name\":\"A\",\"category_name\":\"Semester 2\",\"category_display_name\":\"Semester 2\"}', '{\"fee_category_id\":\"20\",\"grade_id\":\"1\",\"division_id\":\"1\",\"amount\":\"5000.00\",\"is_mandatory\":1,\"due_date\":\"2025-12-18\",\"late_fee_amount\":null,\"late_fee_days\":null,\"description\":\"\",\"item_size\":\"\",\"semester\":null,\"academic_year_id\":\"1\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:41:05'),
(308, 1, 'admin', 'login', 'staff', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-19 01:52:54'),
(309, 10, 'admin', 'login', 'staff', 10, NULL, NULL, '::1', 'curl/8.12.1', '2025-08-25 08:10:54'),
(310, 11, 'staff', 'login', 'staff', 11, NULL, NULL, '::1', 'curl/8.12.1', '2025-08-25 08:11:01'),
(311, 33, 'parent', 'login', 'parents', 33, NULL, NULL, '::1', 'curl/8.12.1', '2025-08-25 08:11:09'),
(312, 10, 'admin', 'login', 'staff', 10, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:11:57'),
(313, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:11:58'),
(314, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:34'),
(315, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:34'),
(316, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:34'),
(317, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:34'),
(318, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:35'),
(319, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:35'),
(320, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:35'),
(321, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:35'),
(322, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:35'),
(323, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:36'),
(324, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:38'),
(325, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:38'),
(326, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:38'),
(327, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:39'),
(328, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:39'),
(329, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:39'),
(330, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:39'),
(331, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:39'),
(332, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:39'),
(333, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:12:40'),
(334, 10, 'admin', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:29:55'),
(335, 11, 'staff', 'login', 'staff', 11, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:30:06'),
(336, 11, 'staff', 'staff_updated', 'staff', 10, '{\"id\":\"10\",\"name\":\"Admin User\",\"mobile\":\"1111111111\",\"email\":\"admin@school.com\",\"address\":\"School Campus\",\"pincode\":null,\"role_id\":\"1\",\"password_hash\":\"$2y$10$UsH11wtKiUi4AkGCFkmCKucFIA\\/Nu2ayRjSvAvxP5APuIVixX4rPW\",\"is_active\":\"1\",\"created_at\":\"2025-08-25 17:05:06\",\"updated_at\":\"2025-08-25 17:10:45\",\"role_name\":\"super_admin\",\"permissions\":\"[\\\"*\\\"]\",\"assigned_grades\":[],\"assigned_divisions\":[]}', '{\"name\":\"Admin User\",\"mobile\":\"1111111111\",\"email\":\"admin@school.com\",\"role_id\":\"1\",\"address\":\"School Campus\",\"pincode\":\"\",\"grades\":[],\"divisions\":[]}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:30:20'),
(337, 10, 'admin', 'login', 'staff', 10, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:31:02'),
(338, 10, 'admin', 'staff_updated', 'staff', 5, '{\"id\":\"5\",\"name\":\"Ms. Sunita Joshi\",\"mobile\":\"9876543213\",\"email\":\"sunita.teacher@school.com\",\"address\":\"654 Staff Quarters\",\"pincode\":\"400005\",\"role_id\":\"3\",\"password_hash\":\"$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC\\/.og\\/at2.uheWG\\/igi\",\"is_active\":\"1\",\"created_at\":\"2025-08-04 18:06:20\",\"updated_at\":\"2025-08-04 18:06:20\",\"role_name\":\"staff\",\"permissions\":\"[\\\"dashboard\\\", \\\"students.view\\\", \\\"students.create\\\", \\\"students.update\\\", \\\"parents.view\\\", \\\"fees.view\\\", \\\"fees.collect\\\", \\\"announcements.view\\\", \\\"complaints.view\\\", \\\"reports.students\\\"]\",\"assigned_grades\":[],\"assigned_divisions\":[]}', '{\"name\":\"Ms. Sunita Joshi\",\"mobile\":\"9876543213\",\"email\":\"sunita.teacher@school.com\",\"password\":\"9876543213\",\"role_id\":\"3\",\"address\":\"654 Staff Quarters\",\"pincode\":\"400005\",\"grades\":[],\"divisions\":[]}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:33:21'),
(339, 5, 'staff', 'login', 'staff', 5, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:33:33'),
(340, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:33:48'),
(341, 11, 'staff', 'login', 'staff', 11, NULL, NULL, '::1', 'curl/8.12.1', '2025-08-25 09:38:01'),
(342, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:39:55'),
(343, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:43:54'),
(344, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:44:11'),
(345, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:44:47'),
(346, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:44:58'),
(347, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:45:12'),
(348, 10, 'admin', 'login', 'staff', 10, NULL, NULL, '::1', 'curl/8.12.1', '2025-08-25 09:46:18'),
(349, 12, 'staff', 'login', 'staff', 12, NULL, NULL, '::1', 'curl/8.12.1', '2025-08-25 09:51:44'),
(350, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:53:40'),
(351, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:53:58'),
(352, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:54:00'),
(353, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 10:53:14'),
(354, 5, 'staff', 'Dashboard Accessed', 'dashboard', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 11:06:10');

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('admin','staff','parent') NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_tokens`
--

INSERT INTO `auth_tokens` (`id`, `user_id`, `user_type`, `token_hash`, `expires_at`, `is_revoked`, `created_at`) VALUES
(1, 2, 'admin', '4439e14a3e87a7fe6d426f1c3394505240077b7085e1e56d880e7ea0f664081a', '2025-08-04 16:52:38', 0, '2025-08-04 09:22:38'),
(2, 2, 'admin', 'ab0bf3934c6c91c25a548e397b4b477c816c2cc98063949a2f7c15a6f8528193', '2025-08-04 16:52:52', 0, '2025-08-04 09:22:52'),
(3, 2, 'admin', 'c23bc83d14ded724cbacda854573b630b9d403b07b15a816771eba22d8fe314a', '2025-08-04 16:53:03', 0, '2025-08-04 09:23:03'),
(4, 2, 'admin', '36f6a5ebbb257a6ab8df353d34d1b760a8e043a87ef2c068d1c2b24b2a3602c5', '2025-08-04 16:53:10', 0, '2025-08-04 09:23:10'),
(5, 2, 'admin', '894dd5c4c94fd65ef07a6921f4eff0fb77c491ac0c4a947bedb1fdc1ccf3a463', '2025-08-04 16:54:18', 0, '2025-08-04 09:24:18'),
(6, 2, 'admin', 'eea7ee8d7fc39a32d478d384a3a91895f9d721ebf1b48bd781b657535e8488c0', '2025-08-04 16:54:52', 0, '2025-08-04 09:24:52'),
(7, 2, 'admin', 'e7faf1535d0fb35edf30fc8e4ec7a925829bcc3f20f731f1479c9509494d9e1b', '2025-08-04 16:55:16', 0, '2025-08-04 09:25:16'),
(8, 2, 'admin', 'a7c4aab8b9104504e2b7797f74b59e108d50f73ef5a16d225a81eca4fcdac480', '2025-08-04 16:55:23', 0, '2025-08-04 09:25:23'),
(9, 2, 'admin', '06108eb9675cbe4de0038149d3ac40a4f1718cacd8551fe9eda4f3638b555a9c', '2025-08-04 16:56:03', 0, '2025-08-04 09:26:03'),
(10, 2, 'admin', '2668a8e759721f246d520a0e7d0e4e8d00489e14d57bd7e257ca541e9399883f', '2025-08-04 16:56:25', 0, '2025-08-04 09:26:25'),
(11, 2, 'admin', '210b61df87efadfadb72309a3ae0a76cf34977122ba7246ff9180eaee19b1dc5', '2025-08-04 16:56:29', 0, '2025-08-04 09:26:29'),
(12, 2, 'admin', '791612e3ecf37a8c58a71f08532fe00cd24aa8d8e6bebc96aec7224ce8a32f86', '2025-08-04 16:56:56', 0, '2025-08-04 09:26:56'),
(13, 2, 'admin', '253222d61af9e8c659fd90e1c1a2feda70fe13aa3139555061c3431ec310950c', '2025-08-04 16:57:42', 0, '2025-08-04 09:27:42'),
(14, 2, 'admin', '5a8ed3ac33e074f180fde7b9e355cf52cd0536cc59fe3b6072036d83a1bd309b', '2025-08-04 16:57:46', 0, '2025-08-04 09:27:46'),
(15, 2, 'admin', '8ee70fde7c9ac1a84c74f711a6a767a91db01bb45e2233a3156d5673f313d43b', '2025-08-04 16:57:51', 0, '2025-08-04 09:27:51'),
(16, 2, 'admin', 'e3c5479e33f4f9ac88c431fa4f30f4f0ee38449003b71874cfb01d9cf963a1b2', '2025-08-04 16:57:54', 0, '2025-08-04 09:27:54'),
(17, 2, 'admin', 'b916cdc9cc2e428b6fe05d2408f02798e44e56a67522ceab162cdc6661396977', '2025-08-04 16:58:23', 0, '2025-08-04 09:28:23'),
(18, 2, 'admin', '6fea74351d86f63486f8b9f4faabfbbaeb5ad0b420f681d337a0598da0691612', '2025-08-04 16:58:28', 0, '2025-08-04 09:28:28'),
(19, 2, 'admin', '89d68c7ab36e992ea456fff34178b0cd8efb988e50299366428bfbf8fa528380', '2025-08-04 16:59:15', 0, '2025-08-04 09:29:15'),
(20, 2, 'admin', 'a5d82bad09b7fc03e666b1210a6bff21543a9626fea5ef99a13adb58cbce87f0', '2025-08-04 17:02:35', 0, '2025-08-04 09:32:35'),
(21, 2, 'admin', '503f2c31401eb1983c73cef13760a0f70cb8a01dfcc3b692a56f397b07cd562a', '2025-08-04 17:02:58', 0, '2025-08-04 09:32:58'),
(22, 2, 'admin', '1d0d4828a3f7656e18fc9131a9cfc8da75506f77a1fd21c80851670a89d78ecd', '2025-08-04 17:03:54', 0, '2025-08-04 09:33:54'),
(23, 2, 'admin', '5afb75a175d208d1ad5001f385de8f7181c05b2faa7d018cd24c1431d4d1a8ff', '2025-08-04 17:04:25', 0, '2025-08-04 09:34:25'),
(24, 2, 'admin', 'd026c19263efd1f1f8d81b167743200a2f11c78e58f8b88cc64484bf08f6911e', '2025-08-04 17:04:51', 0, '2025-08-04 09:34:51'),
(25, 2, 'admin', '46d1a19af4202bdf8027e210bb1ea5b45983efd06a6fafb43ee80f9f60afc9be', '2025-08-04 17:05:11', 0, '2025-08-04 09:35:11'),
(26, 2, 'admin', '4812f606cff4aeacc92bb7295a7cb74b4f6490e0369fb6eea53b41af9c7ac257', '2025-08-04 17:06:48', 0, '2025-08-04 09:36:48'),
(27, 2, 'admin', '332b45836e2627cb362ca36d5f2a3256a0d91e9f9252ea7a3670c0e4f4dc49d5', '2025-08-04 17:07:15', 0, '2025-08-04 09:37:15'),
(28, 2, 'admin', 'f1a2f51b16190f618f05d2eb148edcbafd2360aee91c65eb03d96c691bfcc199', '2025-08-04 17:07:41', 0, '2025-08-04 09:37:41'),
(29, 2, 'admin', 'fac46296e9854c309e004e84b45f67077939f3533137ff22c9ba2558b6664e8b', '2025-08-04 17:07:55', 0, '2025-08-04 09:37:55'),
(30, 2, 'admin', 'd035379a9f10bdd1e3411d4cb81fe26b7b5aa89127cd1dfa53c408eef1d85e2f', '2025-08-04 17:08:23', 0, '2025-08-04 09:38:23'),
(31, 2, 'admin', 'e3ee69e5a52de93bbba3ab13acc15f48ae28c045b721e735d3be252e6952e0cd', '2025-08-04 17:08:39', 0, '2025-08-04 09:38:39'),
(32, 2, 'admin', 'b4fefd6549d24d9882d4bb12fd1dbad296d7d723b31f01b07ee5d1cdd2f84d0f', '2025-08-04 17:08:59', 0, '2025-08-04 09:38:59'),
(33, 2, 'admin', '07233cb13681c210952ac1b8121339e2a1e790f2a3d308543fd158fa0a5310d9', '2025-08-04 17:13:13', 0, '2025-08-04 09:43:13'),
(34, 2, 'admin', '6b91046869cfed89dfaff6921fce118135f1dc7fbc205854a41c87b84c947d35', '2025-08-04 18:27:04', 0, '2025-08-04 10:57:04'),
(35, 2, 'admin', '146e665f26b59c4209a6ab55ea24a3ef2b6767cba7f57355a14054b0c7abe896', '2025-08-04 18:31:06', 0, '2025-08-04 11:01:06'),
(36, 2, 'admin', '4a4075fc0eedd978c5513f679446b744f473231948463f82922cb38f0cbd7266', '2025-08-04 18:31:48', 0, '2025-08-04 11:01:48'),
(37, 1, 'admin', 'f4a59b8e0a58f11276eec92a7999aadbcbaae741411e30b2b06b04d94c92c44d', '2025-08-05 16:36:08', 1, '2025-08-05 09:06:08'),
(38, 1, 'admin', '10d1b5e00c07d74cdf21bb55f5a737ceb9076e44f1357cef4f362291d5bac9ff', '2025-08-05 16:36:57', 1, '2025-08-05 09:06:57'),
(39, 1, 'admin', '5f7f8f0368deff8560710303d377e0116fb41686be0187f44a31f51d5fb958bc', '2025-08-05 16:45:59', 1, '2025-08-05 09:15:59'),
(40, 1, 'admin', '558dac5ab1547791c17710903d07533a4163b97b7d3e4c41954900fd32053382', '2025-08-05 16:46:27', 1, '2025-08-05 09:16:27'),
(41, 1, 'admin', 'b27e24fabb6827d856cff7f058e3bd40c5c12d3ec59c515c1f3b6f51a621e8c7', '2025-08-05 16:46:44', 1, '2025-08-05 09:16:44'),
(42, 1, 'admin', '22644b8ff75bf9d1fc9b0f2ca67268b56717587b401e1773c5f43d236625c333', '2025-08-05 16:47:52', 1, '2025-08-05 09:17:52'),
(43, 1, 'admin', 'd6e3d9bf69787dcb67a2c3681c339ecc4430bcfa4c9fc1b3c2751a7703af9dba', '2025-08-05 16:49:33', 1, '2025-08-05 09:19:33'),
(44, 1, 'admin', '5ac40338adf983219e14effbc341be266099b57e1961a33997c906f87748cce2', '2025-08-05 16:49:41', 1, '2025-08-05 09:19:41'),
(45, 1, 'admin', '691914c04247752d0101e47057077464ea8b97035e30a12e22e3cecd938ebf23', '2025-08-05 17:12:22', 1, '2025-08-05 09:42:22'),
(46, 1, 'admin', 'f53b0c0f296aa597dd3c1293ee046f2a4523d197c05ccc0e35b063aded25e7a9', '2025-08-05 18:00:33', 0, '2025-08-05 10:30:33'),
(47, 1, 'admin', '9399d8bba8192dfa0242b97e39faf3c3d5c7eabbca983c7d731a4b6cc2cf938e', '2025-08-06 09:38:52', 0, '2025-08-06 02:08:52'),
(48, 1, 'admin', '17584c3d67c7c0c8f7ae1c91d651bffb6db8b798bc7b18133aa94d4eecb5aa23', '2025-08-06 10:55:15', 0, '2025-08-06 03:25:15'),
(49, 1, 'admin', 'af472f2efc04f14450310401b3696f483a6d691697892c4671046564fb7ce1e8', '2025-08-06 15:02:01', 0, '2025-08-06 07:32:01'),
(50, 1, 'admin', '892f4a246e6cf37ef8a4405675204f6e2f55aa5ae9a775d3b7734c6c840338a2', '2025-08-06 15:21:50', 0, '2025-08-06 07:51:50'),
(51, 1, 'admin', 'e1fc80047beca5f66bcfa7a3bc691362a0742820300fcd08b2c8c29a0dedf85e', '2025-08-06 18:21:11', 0, '2025-08-06 10:51:11'),
(52, 1, 'admin', '5edade5fbf3c565508260d9bee9210aeff86e585575f430b80f8c4337142e0a6', '2025-08-06 18:24:47', 1, '2025-08-06 10:54:47'),
(53, 1, 'admin', '6ff94befd36dbbaeb4d07bff226e0a12f72ec3aff7dd89b92a2c236b7e43e841', '2025-08-06 18:26:43', 0, '2025-08-06 10:56:43'),
(54, 1, 'admin', 'ce281fab120f40d7e91719e6081a02f95dec15f04f14e1ee1497ba92e91208f1', '2025-08-06 18:30:37', 0, '2025-08-06 11:00:37'),
(55, 1, 'admin', '4c633336687e59b91fce4355d659aec63af922d7125a79d2abf4832cef4b0d33', '2025-08-07 07:40:57', 0, '2025-08-07 00:10:57'),
(56, 1, 'admin', '8147f8c98d7b50cd9278f604b80ce55ea8a27e32444b3020105d7ecf3ac456c2', '2025-08-07 07:44:20', 0, '2025-08-07 00:14:20'),
(57, 1, 'admin', 'a8e609c0a8caa6781c7d5565356916299899a40f60b9579e0b42f9e2c1cc00a3', '2025-08-07 08:06:18', 1, '2025-08-07 00:36:18'),
(58, 1, 'admin', 'ec05975e9b062a90115d41beaa90ab9b53cbd763177709eed377329cd208fd5e', '2025-08-07 08:23:06', 0, '2025-08-07 00:53:06'),
(59, 1, 'admin', 'c98a26b5973b6782d306234eee21311b523cba0d9be123e19d7bdae9a9a8fa1a', '2025-08-07 08:24:54', 0, '2025-08-07 00:54:54'),
(60, 1, 'admin', '7c9b932247eca61a70a6846d128a8c1970e6342e69fbff9f89ea82912016beae', '2025-08-07 08:25:13', 0, '2025-08-07 00:55:13'),
(61, 1, 'admin', '4137bf688713cf27744608fb67fc240c5113c0eea6fff1f5b4e40583f02dddb2', '2025-08-07 08:25:46', 0, '2025-08-07 00:55:46'),
(62, 1, 'admin', 'a3e1c34e89aca522f6e454214249ec65486a0082a09e12a9a20294532c90935d', '2025-08-07 12:01:51', 0, '2025-08-07 04:31:51'),
(63, 1, 'admin', 'fc6aad4e1c1dd605004d7a17fed23e8ef6dc9315841a750fa9e8b9356da744be', '2025-08-07 12:02:02', 0, '2025-08-07 04:32:02'),
(64, 1, 'admin', '161ea494a5ea50265738a0c7a331f24d98a6604febb606cb577127a30244dd59', '2025-08-07 12:02:24', 0, '2025-08-07 04:32:24'),
(65, 1, 'admin', 'b03108baefdec507bebfa1671c8a86ae66392499c058df59c89e0b0cd3778d70', '2025-08-07 12:02:28', 0, '2025-08-07 04:32:28'),
(66, 1, 'admin', '384292dc41e382b40c8454b95d8db9fdc879ee5c7cd3457faf4b53437196fb47', '2025-08-07 12:02:29', 0, '2025-08-07 04:32:29'),
(67, 1, 'admin', 'cb9b971da176471f8c869b5b3213383e119a97543c2b70c216da7a99e4054997', '2025-08-07 12:02:34', 0, '2025-08-07 04:32:34'),
(68, 1, 'admin', '00ef62a419fb77d5495fd7e91e4c7b925753102ac4f4010e98ab394ac464c430', '2025-08-07 12:03:03', 0, '2025-08-07 04:33:03'),
(69, 1, 'admin', '690ab1c96b194e0d057a84ec3e94970628c9f3f5ef19e544ebdf1f8e74e1af8d', '2025-08-07 12:03:05', 0, '2025-08-07 04:33:05'),
(70, 1, 'parent', '9cbafe1d8f27034f5812150a6c0720d530fa5cdc10724e58d2765b3d673803e0', '2025-08-07 12:04:25', 0, '2025-08-07 04:34:25'),
(71, 1, 'admin', '29052c5eff172926d31a65b7e4520d2b34079ae34f2a81c32b66e2caaf41c83e', '2025-08-07 12:04:33', 0, '2025-08-07 04:34:33'),
(72, 1, 'admin', '6dd0271f3a2a27fad00126519d4c1290aa72e7d056b3970d41ae564888f9250e', '2025-08-07 12:04:52', 1, '2025-08-07 04:34:52'),
(73, 1, 'admin', '9387325316b64665322532115d03f8db7f61f6192d89d80a3a1e2a87aff67c75', '2025-08-07 13:08:16', 1, '2025-08-07 05:38:16'),
(74, 1, 'admin', '50419f316499edcc36b5f36d03fbbd8a2dfcceedc3ad2ba1e0beb8cbcb3866dd', '2025-08-07 13:48:34', 0, '2025-08-07 06:18:34'),
(75, 1, 'admin', '0e35638bb5ff09bb16b4976774092d707554ca2333587db3b2b1a98e9c9794df', '2025-08-07 16:06:10', 0, '2025-08-07 08:36:10'),
(76, 1, 'admin', '74b819b69bd75620811104fdd8f0a05b47ad913b8b897c302fc82569f09ca6b0', '2025-08-08 07:00:46', 0, '2025-08-07 23:30:46'),
(77, 1, 'admin', '41d7e9f151b047ebf36bde2323ec48d8bbabaf3e2b9801a2ff2a4a107da878ed', '2025-08-08 18:46:39', 0, '2025-08-08 11:16:39'),
(78, 1, 'admin', 'c9290c7398cfe1ce74b03f2d16f23c465227fe262ab14861f9b0f395df31f846', '2025-08-09 07:10:14', 0, '2025-08-08 23:40:14'),
(79, 1, 'admin', 'b96960c43c621dca328831fc43f53acb1461d0122d33cc23ba21e7040bc1ceb0', '2025-08-09 09:13:47', 0, '2025-08-09 01:43:47'),
(80, 1, 'admin', '6401e0a750f9f5d2341ee129b13d5d8aa36465313b7fd9c5c1b70c7abf249f11', '2025-08-09 13:55:13', 0, '2025-08-09 06:25:13'),
(81, 1, 'admin', 'ed4f7ba4edef976e653b749d09c20c434e357c858561459afc14f6beba752982', '2025-08-13 16:52:12', 0, '2025-08-13 09:22:12'),
(82, 1, 'admin', '3d8d033047cd6b69d1775674da0407ad7c0648a22fadfca017861d08c1ecd368', '2025-08-13 18:54:23', 0, '2025-08-13 11:24:23'),
(83, 1, 'admin', '0b149afa09297ca8d4983db55582fb2cc5d609a4df771263606459ebb3d3779c', '2025-08-14 08:04:56', 0, '2025-08-14 00:34:56'),
(84, 1, 'admin', '34ed80687a8104bd9ef440ab0cfb07865360fa6c1e7fb6f7306b6a1ab717f962', '2025-08-14 08:17:09', 0, '2025-08-14 00:47:09'),
(85, 1, 'staff', 'c973f529d0dcb4179e84b5520d872cc02c0ec2426f96fce9daaee4518dfd0095', '2025-08-14 14:26:59', 0, '2025-08-14 06:56:59'),
(86, 1, 'admin', '6538ca17cbd0e0d0ba2ebdf128f3d09f7839a2daa888ab63ab26345551cc11c0', '2025-08-14 16:36:35', 1, '2025-08-14 09:06:35'),
(87, 1, 'admin', '0afb04146a3812ca952957e752b492582560cca62328ae42add90a5e1c24d45c', '2025-08-14 16:36:43', 1, '2025-08-14 09:06:43'),
(88, 1, 'admin', 'f7cc1c05a3622fcc2404a954d91ffc2d18d8a9d6a7a1653c47e600d10f3ff3c5', '2025-08-14 16:38:12', 1, '2025-08-14 09:08:12'),
(89, 4, 'staff', '9a662d4bdf9a836ff8f8df9f9403189a7e2c203e61bfaa9c52e3626dceaaade9', '2025-08-14 17:14:38', 1, '2025-08-14 09:44:38'),
(90, 1, 'admin', '7adea35641f5c417ffdf66493ec150c2802407b5c83f2b8bbc191638a1fc189a', '2025-08-18 14:07:15', 0, '2025-08-18 06:37:15'),
(91, 1, 'admin', '34cb122d9e3d7dc5d46dd391a6087349aa52c4e4d654f55e11a5d3709bbd7955', '2025-08-18 16:07:40', 0, '2025-08-18 08:37:40'),
(92, 1, 'admin', 'bd1a0d80d2039401a05f2fb7ee7937f1235842fe7dd5ff9d723e7f61d77e3500', '2025-08-19 08:38:23', 1, '2025-08-19 01:08:23'),
(93, 1, 'admin', '41c8facd9fc9dae2dcfc892e35f69e3d724204cfdf0a1566b7a304ea8e8c244d', '2025-08-19 09:22:54', 1, '2025-08-19 01:52:54'),
(94, 10, 'admin', '3f7cb7ff596e90b52b16588b35efb66ee61d96c9d147b84f627a2358fa429eb6', '2025-08-25 15:40:54', 0, '2025-08-25 08:10:54'),
(95, 11, 'staff', 'd33915b04d98812b80f50b3400f30cf2f480139d3f3827402be88a1103a9d952', '2025-08-25 15:41:01', 0, '2025-08-25 08:11:01'),
(96, 33, 'parent', 'd297b1af83be7ce85a652712f82e4b14a0c0ca673af3d10204af073f4fe0b7a3', '2025-08-25 15:41:09', 0, '2025-08-25 08:11:09'),
(97, 10, 'admin', '753a8e643c074b5a92e95d3853fd8d0f66cabc7f08407e86fdfbd27ac9d055c5', '2025-08-25 15:41:57', 1, '2025-08-25 08:11:57'),
(98, 11, 'staff', '1968fe0f368e09a4d9c9c7e1ad147699eabc6027e1c0bdd75bdd498c682ecba0', '2025-08-25 17:00:06', 1, '2025-08-25 09:30:06'),
(99, 10, 'admin', 'adab9076c7ccac54d16dc9b78b2a940527973f39c122bb319edeb0901413d81a', '2025-08-25 17:01:02', 1, '2025-08-25 09:31:02'),
(100, 5, 'staff', '487957845321a77d854069afd1e26ff9b3d133a40cd4e4f029bdd1e7f2f03b5b', '2025-08-25 17:03:33', 0, '2025-08-25 09:33:33'),
(101, 11, 'staff', '33cec3db76d97e3fc7e0a8361159ca888cf1c91736f340519cb786f076232bd8', '2025-08-25 17:08:01', 0, '2025-08-25 09:38:01'),
(102, 10, 'admin', '4908a8db724d779750af7f970dec4c472e5fc8ba1dcedf2d865bba91818fc071', '2025-08-25 17:16:18', 0, '2025-08-25 09:46:18'),
(103, 12, 'staff', '3b0c3c908f96564e53b8a5ce3d3ea52804c7f849870f24822914395dfab889f6', '2025-08-25 17:21:44', 0, '2025-08-25 09:51:44');

-- --------------------------------------------------------

--
-- Table structure for table `bus_routes`
--

CREATE TABLE `bus_routes` (
  `id` int(11) NOT NULL,
  `route_name` varchar(100) NOT NULL,
  `pickup_points` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pickup_points`)),
  `monthly_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `distance_km` decimal(5,2) DEFAULT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `driver_mobile` varchar(15) DEFAULT NULL,
  `bus_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bus_routes`
--

INSERT INTO `bus_routes` (`id`, `route_name`, `pickup_points`, `monthly_fee`, `distance_km`, `driver_name`, `driver_mobile`, `bus_number`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Route A - Main Road', NULL, '1200.00', '15.50', 'Raj Kumar', '9876543210', 'KA01AB1234', 1, '2025-08-07 03:43:50', '2025-08-07 03:43:50'),
(2, 'Route B - Station Road', NULL, '1000.00', '12.00', 'Suresh Babu', '9876543211', 'KA01AB5678', 1, '2025-08-07 03:43:50', '2025-08-07 03:43:50'),
(3, 'Route C - Market Road', NULL, '800.00', '8.50', 'Ramesh Singh', '9876543212', 'KA01AB9012', 1, '2025-08-07 03:43:50', '2025-08-07 03:43:50');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `complaint_number` varchar(50) DEFAULT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `category` enum('academic','transport','facility','staff','fee','other') DEFAULT 'other',
  `status` enum('new','open','in_progress','resolved','closed') DEFAULT 'new',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `response` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolution` text DEFAULT NULL,
  `assigned_to_staff_id` int(11) DEFAULT NULL,
  `resolved_by_staff_id` int(11) DEFAULT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaints`
--

INSERT INTO `complaints` (`id`, `complaint_number`, `parent_id`, `student_id`, `subject`, `description`, `category`, `status`, `priority`, `assigned_to`, `response`, `resolved_at`, `created_at`, `updated_at`, `resolution`, `assigned_to_staff_id`, `resolved_by_staff_id`, `is_anonymous`, `attachments`, `is_active`) VALUES
(2, 'CMP20250001', 1, 1, 'Test Complaint', 'This is a test complaint to verify the system is working', 'other', 'resolved', 'medium', NULL, NULL, '2025-08-13 16:34:03', '2025-08-13 10:56:20', '2025-08-13 11:04:03', 'sdfasd', 1, 1, 0, '[]', 1),
(5, 'CMP20250002', 3, NULL, 'safads', 'asdfadsf', 'other', 'new', 'high', NULL, NULL, NULL, '2025-08-13 11:06:03', '2025-08-13 11:06:03', NULL, NULL, NULL, 1, '[]', 1),
(6, 'CMP20250003', 3, NULL, 'safads', 'asdfadsf', 'other', 'in_progress', 'high', NULL, NULL, NULL, '2025-08-13 11:06:08', '2025-08-13 11:06:20', NULL, 2, NULL, 1, '[]', 1),
(7, 'CMP20250004', 3, NULL, 'dadsfdaf', 'sdafsd', 'other', 'in_progress', 'urgent', NULL, NULL, NULL, '2025-08-14 09:17:36', '2025-08-14 09:17:56', NULL, 3, NULL, 1, '[]', 1);

-- --------------------------------------------------------

--
-- Table structure for table `complaint_comments`
--

CREATE TABLE `complaint_comments` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `commented_by_type` enum('parent','staff','admin') NOT NULL,
  `commented_by_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaint_comments`
--

INSERT INTO `complaint_comments` (`id`, `complaint_id`, `commented_by_type`, `commented_by_id`, `comment`, `is_internal`, `attachments`, `created_at`) VALUES
(1, 2, 'staff', 1, 'Complaint assigned to staff member.', 1, '[]', '2025-08-13 11:01:55'),
(2, 2, 'staff', 1, 'Complaint assigned to staff member.', 1, '[]', '2025-08-13 11:02:06'),
(3, 2, 'staff', 1, 'Complaint assigned to staff member.', 1, '[]', '2025-08-13 11:02:19'),
(4, 2, 'staff', 1, 'Complaint resolved: sdfasd', 0, '[]', '2025-08-13 11:04:03'),
(5, 6, 'staff', 1, 'Complaint assigned to staff member.', 1, '[]', '2025-08-13 11:06:20'),
(6, 7, 'staff', 1, 'Complaint assigned to staff member.', 1, '[]', '2025-08-14 09:17:56');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL DEFAULT 1,
  `grade_id` int(11) NOT NULL,
  `name` varchar(10) NOT NULL,
  `capacity` int(11) DEFAULT 30,
  `display_order` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `divisions`
--

INSERT INTO `divisions` (`id`, `academic_year_id`, `grade_id`, `name`, `capacity`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'A', 30, 1, 1, '2025-08-04 13:08:50', '2025-08-04 13:08:50'),
(2, 1, 1, 'B', 30, 1, 1, '2025-08-04 13:08:50', '2025-08-04 13:08:50'),
(3, 1, 2, 'A', 35, 1, 1, '2025-08-04 13:08:50', '2025-08-04 13:08:50'),
(4, 1, 10, 'Test A', 30, 1, 1, '2025-08-08 04:10:27', '2025-08-08 04:10:27'),
(5, 1, 11, 'Science A', 30, 1, 1, '2025-08-08 04:15:33', '2025-08-08 04:15:33'),
(6, 1, 11, 'Science B', 30, 2, 1, '2025-08-08 04:15:33', '2025-08-08 04:15:33'),
(7, 1, 12, 'Commerce A', 30, 1, 1, '2025-08-08 04:15:33', '2025-08-08 04:15:33'),
(8, 1, 13, 'No Fee A', 30, 1, 1, '2025-08-08 04:16:57', '2025-08-08 04:16:57'),
(9, 1, 13, 'No Fee B', 30, 2, 1, '2025-08-08 04:16:57', '2025-08-08 04:16:57'),
(10, 1, 15, 'A', 50, 1, 1, '2025-08-19 01:23:31', '2025-08-19 01:23:31');

-- --------------------------------------------------------

--
-- Table structure for table `fee_categories`
--

CREATE TABLE `fee_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fee_categories`
--

INSERT INTO `fee_categories` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Bag', 'School bag and related accessories', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(2, 'Book', 'Textbooks and learning materials', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(3, 'Uniform/Shoes', 'School uniform, shoes and dress code items', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(4, 'General Payment', 'Miscellaneous payments and fees', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(5, 'Event Payment', 'School events, trips and activities', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(6, 'Bus Payment', 'School transportation fees', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(7, 'Penalty Charges', 'Late fees and penalty charges', 1, '2025-08-06 14:29:28', '2025-08-06 14:29:28'),
(8, 'Security Fee', 'Campus security charges', 1, '2025-08-08 03:59:56', '2025-08-08 03:59:56'),
(9, 'Development Fee', 'Infrastructure development', 1, '2025-08-08 03:59:56', '2025-08-08 03:59:56'),
(10, 'Admission Fee', 'One-time admission processing fee', 1, '2025-08-08 04:14:49', '2025-08-08 04:14:49'),
(11, 'Tuition Fee', 'Academic tuition charges per semester', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(12, 'Library Fee', 'Library maintenance and book access fees', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(13, 'Lab Fee', 'Laboratory usage and equipment fees', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(14, 'Sports Fee', 'Sports facilities and equipment fees', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(15, 'Activity Fee', 'Co-curricular activities and events', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(16, 'Computer Fee', 'Computer lab and IT infrastructure fees', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(17, 'Examination Fee', 'Semester examination charges', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(18, 'Registration Fee', 'Academic registration per semester', 1, '2025-08-09 03:22:57', '2025-08-09 03:22:57'),
(19, 'Semester 1', 'Semester 1', 1, '2025-08-18 06:38:40', '2025-08-18 06:38:40'),
(20, 'Semester 2', 'Semester 2', 1, '2025-08-18 06:38:48', '2025-08-18 06:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `fee_collections`
--

CREATE TABLE `fee_collections` (
  `id` int(11) NOT NULL,
  `academic_year_id` int(11) DEFAULT 1,
  `student_id` int(11) NOT NULL,
  `fee_type_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `collection_date` date NOT NULL,
  `collected_by` int(11) NOT NULL,
  `payment_method` enum('cash','online','cheque','dd') DEFAULT 'cash',
  `receipt_number` varchar(50) NOT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('pending','collected','cancelled') DEFAULT 'collected',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fee_collections`
--

INSERT INTO `fee_collections` (`id`, `academic_year_id`, `student_id`, `fee_type_id`, `amount`, `collection_date`, `collected_by`, `payment_method`, `receipt_number`, `remarks`, `status`, `created_at`) VALUES
(4, 1, 21, 1, '2000.00', '2025-08-09', 1, 'cash', 'RCP202508090001', NULL, 'collected', '2025-08-09 04:43:29'),
(5, 1, 21, 1, '2000.00', '2025-08-09', 1, 'cash', 'RCP202508090002', NULL, 'collected', '2025-08-09 04:43:45'),
(6, 1, 21, 1, '2000.00', '2025-08-09', 1, 'cash', 'RCP202508090003', NULL, 'collected', '2025-08-09 04:44:13'),
(7, 1, 21, 1, '2000.00', '2025-08-09', 1, 'cash', 'RCP202508090004', NULL, 'collected', '2025-08-09 04:44:38'),
(8, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090005', 'Test for status check', 'collected', '2025-08-09 04:48:12'),
(9, 1, 2, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508090006', NULL, 'collected', '2025-08-09 06:43:16'),
(10, 1, 1, 1, '500.00', '2025-08-09', 1, 'cash', 'TEST20250809113404', 'Test wallet integration', 'collected', '2025-08-09 09:34:04'),
(11, 1, 1, 1, '500.00', '2025-08-09', 1, 'cash', 'TEST20250809113408', 'Test wallet integration', 'collected', '2025-08-09 09:34:08'),
(12, 1, 1, 1, '500.00', '2025-08-09', 1, 'cash', 'TEST20250809115214', 'Test wallet integration', 'collected', '2025-08-09 09:52:14'),
(13, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090007', NULL, 'collected', '2025-08-09 09:55:37'),
(14, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090008', NULL, 'collected', '2025-08-09 09:56:25'),
(15, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090009', NULL, 'collected', '2025-08-09 09:56:51'),
(16, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090010', NULL, 'collected', '2025-08-09 09:57:14'),
(17, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090011', NULL, 'collected', '2025-08-09 09:57:20'),
(18, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090012', NULL, 'collected', '2025-08-09 09:57:45'),
(19, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090013', NULL, 'collected', '2025-08-09 09:58:01'),
(20, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090014', NULL, 'collected', '2025-08-09 09:58:53'),
(21, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090015', NULL, 'collected', '2025-08-09 09:59:36'),
(22, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090016', NULL, 'collected', '2025-08-09 09:59:51'),
(23, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'TEST_DIRECT_20250809120004', 'Direct payment test', 'collected', '2025-08-09 06:30:04'),
(24, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090017', NULL, 'collected', '2025-08-09 10:00:21'),
(25, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090018', NULL, 'collected', '2025-08-09 10:00:44'),
(26, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090019', NULL, 'collected', '2025-08-09 10:01:15'),
(27, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090020', NULL, 'collected', '2025-08-09 10:01:33'),
(28, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508090021', NULL, 'collected', '2025-08-09 10:02:09'),
(29, 1, 21, 1, '3000.00', '2025-08-09', 1, 'cash', 'RCP202508090022', NULL, 'collected', '2025-08-09 10:03:18'),
(30, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508093962', NULL, 'collected', '2025-08-09 06:33:36'),
(31, 1, 21, 1, '3000.00', '2025-08-09', 1, 'cash', 'RCP202508093963', NULL, 'collected', '2025-08-09 10:03:46'),
(32, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508093964', NULL, 'collected', '2025-08-09 10:03:58'),
(33, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508093965', NULL, 'collected', '2025-08-09 10:04:22'),
(34, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508093966', NULL, 'collected', '2025-08-09 10:05:02'),
(35, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508093967', NULL, 'collected', '2025-08-09 10:05:31'),
(36, 1, 21, 1, '3000.00', '2025-08-09', 1, 'cash', 'RCP202508093968', NULL, 'collected', '2025-08-09 10:05:52'),
(37, 1, 21, 1, '3000.00', '2025-08-09', 1, 'cash', 'RCP202508093969', NULL, 'collected', '2025-08-09 10:06:19'),
(38, 1, 21, 1, '3000.00', '2025-08-09', 1, 'cash', 'RCP202508093970', NULL, 'collected', '2025-08-09 10:07:16'),
(39, 1, 21, 1, '500.50', '2025-08-09', 1, 'cash', 'RCP202508093971', 'Test payment', 'collected', '2025-08-09 10:07:43'),
(40, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508093972', 'Test', 'collected', '2025-08-09 10:08:04'),
(41, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508099073', 'Test', 'collected', '2025-08-09 06:38:47'),
(42, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508099074', NULL, 'collected', '2025-08-09 10:09:24'),
(43, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508099075', NULL, 'collected', '2025-08-09 10:10:22'),
(44, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508099076', NULL, 'collected', '2025-08-09 10:10:27'),
(45, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508099077', NULL, 'collected', '2025-08-09 10:11:09'),
(46, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508099078', NULL, 'collected', '2025-08-09 10:12:33'),
(47, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508099079', NULL, 'collected', '2025-08-09 10:12:43'),
(48, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508098306', 'Test', 'collected', '2025-08-09 06:43:26'),
(49, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508098307', NULL, 'collected', '2025-08-09 10:14:02'),
(60, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508098308', 'Clean model test', 'collected', '2025-08-09 10:17:22'),
(61, 1, 21, 1, '500.00', '2025-08-09', 1, 'cash', 'RCP202508098309', 'Fixed API test', 'collected', '2025-08-09 10:17:55'),
(62, 1, 21, 1, '600.00', '2025-08-09', 1, 'cash', 'RCP202508098310', 'Final API test', 'collected', '2025-08-09 10:18:12'),
(63, 1, 21, 1, '700.00', '2025-08-09', 1, 'cash', 'RCP202508098311', 'Final successful test', 'collected', '2025-08-09 10:18:52'),
(64, 1, 21, 1, '800.00', '2025-08-09', 1, 'cash', 'RCP202508098312', 'Success test', 'collected', '2025-08-09 10:19:13'),
(65, 1, 21, 1, '5000.00', '2025-08-09', 1, 'cash', 'RCP202508098313', NULL, 'collected', '2025-08-09 10:19:18'),
(66, 1, 21, 1, '1000.00', '2025-08-09', 1, 'online', 'RCP202508098314', 'Online payment test', 'collected', '2025-08-09 10:19:47'),
(67, 1, 21, 1, '1000.00', '2025-08-09', 1, 'cash', 'RCP202508098315', NULL, 'collected', '2025-08-09 10:42:40'),
(68, 1, 1, 1, '2500.00', '2025-08-18', 1, 'cash', 'RCP202508180001', NULL, 'collected', '2025-08-18 10:44:47'),
(69, 1, 1, 1, '500.00', '2025-08-18', 1, 'cash', 'RCP202508180002', NULL, 'collected', '2025-08-18 11:20:15'),
(70, 1, 1, 1, '150.00', '2025-08-18', 1, 'cash', 'RCP202508180003', NULL, 'collected', '2025-08-18 11:20:31');

-- --------------------------------------------------------

--
-- Table structure for table `fee_structures`
--

CREATE TABLE `fee_structures` (
  `id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `grade_id` int(11) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL,
  `semester` enum('Semester 1','Semester 2') DEFAULT NULL,
  `fee_category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_date` date DEFAULT NULL,
  `late_fee_amount` decimal(10,2) DEFAULT 0.00,
  `late_fee_days` int(11) DEFAULT 0,
  `is_mandatory` tinyint(1) DEFAULT 1,
  `installments_allowed` tinyint(1) DEFAULT 0,
  `max_installments` int(11) DEFAULT 1,
  `description` text DEFAULT NULL,
  `item_photo` varchar(255) DEFAULT NULL COMMENT 'Photo file path for Bag items',
  `item_size` varchar(50) DEFAULT NULL COMMENT 'Size field for Shoes/Uniform items (S, M, L, XL or shoe sizes)',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fee_structures`
--

INSERT INTO `fee_structures` (`id`, `academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `late_fee_amount`, `late_fee_days`, `is_mandatory`, `installments_allowed`, `max_installments`, `description`, `item_photo`, `item_size`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, NULL, 19, '5000.00', '2025-12-18', '0.00', 1, 1, 0, 1, 'sadfasdfa', NULL, '', 1, '2025-08-18 08:28:05', '2025-08-18 08:28:05'),
(2, 1, 1, 1, NULL, 20, '5000.00', '2025-12-18', NULL, NULL, 1, 0, 1, '', NULL, '', 1, '2025-08-18 08:32:34', '2025-08-19 01:41:04'),
(3, 1, 1, 1, NULL, 12, '399.98', '2025-08-19', '10.00', NULL, 0, 0, 1, 'sdfasdfsd', NULL, '', 1, '2025-08-19 01:40:19', '2025-08-19 01:40:19');

-- --------------------------------------------------------

--
-- Table structure for table `fee_types`
--

CREATE TABLE `fee_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fee_types`
--

INSERT INTO `fee_types` (`id`, `name`, `description`, `is_active`, `created_at`) VALUES
(1, 'Bag', 'School bag fees', 1, '2025-08-04 12:25:46'),
(2, 'Book', 'Book and study material fees', 1, '2025-08-04 12:25:46'),
(3, 'Uniform', 'Uniform and shoe fees', 1, '2025-08-04 12:25:46'),
(4, 'Payment Sam', 'Sam payment fees', 1, '2025-08-04 12:25:46'),
(5, 'Event Payment', 'Event participation fees', 1, '2025-08-04 12:25:46'),
(6, 'Bus Payment', 'Bus transportation fees', 1, '2025-08-04 12:25:46'),
(7, 'Penalty', 'Late payment penalty', 1, '2025-08-04 12:25:46');

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grades`
--

INSERT INTO `grades` (`id`, `academic_year_id`, `name`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Class 1', 'First Grade', 1, 1, '2025-08-04 13:08:45', '2025-08-04 13:08:45'),
(2, 1, 'Class 2', 'Second Grade', 1, 1, '2025-08-04 13:08:45', '2025-08-04 13:08:45'),
(3, 1, 'Class 3', 'Third Grade', 1, 1, '2025-08-04 13:08:45', '2025-08-04 13:08:45'),
(4, 1, 'Class1', 'sdafsd', 1, 1, '2025-08-05 09:52:55', '2025-08-05 09:52:55'),
(5, 1, 'Class 4', 'Fourth Grade', 1, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(6, 1, 'Class 5', 'Fifth Grade', 1, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(7, 1, 'Class 6', 'Sixth Grade', 1, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(8, 1, 'Class 7', 'Seventh Grade', 1, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(9, 1, 'Class 8', 'Eighth Grade', 1, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(10, 1, 'Test Grade 12', 'Test Grade for No Fees Scenario', 12, 0, '2025-08-08 04:10:13', '2025-08-19 01:12:08'),
(11, 1, 'Grade 11 Science', NULL, 11, 1, '2025-08-08 04:15:33', '2025-08-08 04:15:33'),
(12, 1, 'Grade 12 Commerce', NULL, 12, 1, '2025-08-08 04:15:33', '2025-08-08 04:15:33'),
(13, 1, 'Grade 99 No Fees', NULL, 99, 1, '2025-08-08 04:16:57', '2025-08-08 04:16:57'),
(14, 1, 'Test Grade', 'sdfsdfsd', 1, 0, '2025-08-19 01:11:12', '2025-08-19 01:22:10'),
(15, 1, 'Test Grade', 'sdfklasjdfksdjlf', 1, 1, '2025-08-19 01:12:21', '2025-08-19 01:12:21'),
(16, 1, 'Test grade', 'sdfsdfasfsd', 1, 1, '2025-08-19 01:22:25', '2025-08-19 01:22:25');

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `address` text DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`id`, `name`, `mobile`, `address`, `pincode`, `email`, `password_hash`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Rajesh Kumar', '9876543210', '123 Main Street, Mumbai, Maharashtra', '400001', 'rajesh.kumar@gmail.com', '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, '2025-08-07 03:52:28', '2025-08-07 08:04:21'),
(2, 'Priya Sharma', '9876543212', '456 Park Avenue, Mumbai, Maharashtra', '400002', 'priya.sharma@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(3, 'Amit Patel', '9876543214', '789 Garden Road, Mumbai, Maharashtra', '400003', 'amit.patel@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(4, 'Sunita Verma', '9876543216', '321 Lake View, Mumbai, Maharashtra', '400004', 'sunita.verma@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(5, 'Vikram Singh', '9876543218', '654 Hill Street, Mumbai, Maharashtra', '400005', 'vikram.singh@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(6, 'Anita Desai', '9876543220', '987 Beach Road, Mumbai, Maharashtra', '400006', 'anita.desai@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(7, 'Rohit Gupta', '9876543222', '147 Market Street, Mumbai, Maharashtra', '400007', 'rohit.gupta@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(8, 'Kavita Reddy', '9876543224', '258 Temple Road, Mumbai, Maharashtra', '400008', 'kavita.reddy@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(9, 'Suresh Nair', '9876543226', '369 College Road, Mumbai, Maharashtra', '400009', 'suresh.nair@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(10, 'Meera Joshi', '9876543228', '741 Station Road, Mumbai, Maharashtra', '400010', 'meera.joshi@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(11, 'Arjun Mehta', '9876543230', '852 River View, Mumbai, Maharashtra', '400011', 'arjun.mehta@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(12, 'Deepa Kulkarni', '9876543232', '963 Forest Avenue, Mumbai, Maharashtra', '400012', 'deepa.kulkarni@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(13, 'Ravi Krishnan', '9876543234', '159 City Center, Mumbai, Maharashtra', '400013', 'ravi.krishnan@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(14, 'Shalini Iyer', '9876543236', '753 Mall Road, Mumbai, Maharashtra', '400014', 'shalini.iyer@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(15, 'Karan Malhotra', '9876543238', '486 Sports Complex, Mumbai, Maharashtra', '400015', 'karan.malhotra@gmail.com', '$2y$10$8V5kPvH5xR3X3cKp5hqNYeKQxX3fVZcYGhTjMwNEanvQMqKJZHXbS', 1, '2025-08-07 03:52:28', '2025-08-07 03:52:28'),
(32, 'Shaikh Shakeel Sir', '9271431483', 'dfkjsdklfjdklsj dhule', '424001', 'shahidhusen31@gmail.com', '$2y$10$etgSDSsWGcR3tKznoNNk9OMt2xn79G8MjzGVf4kEcThb0sxGjrZpO', 1, '2025-08-07 23:38:22', '2025-08-07 23:38:22'),
(33, 'Parent User', '3333333333', 'Parent Address, City', '123456', 'parent@school.com', '$2y$10$UsH11wtKiUi4AkGCFkmCKucFIA/Nu2ayRjSvAvxP5APuIVixX4rPW', 1, '2025-08-25 11:35:26', '2025-08-25 11:40:45');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `created_at`, `updated_at`) VALUES
(1, 'super_admin', 'Super Administrator with full access', '[\"*\"]', '2025-08-04 12:25:46', '2025-08-04 12:25:46'),
(2, 'admin', 'Administrator with full operational access', '[\"dashboard\", \"academic_years\", \"grades\", \"divisions\", \"students\", \"parents\", \"staff\", \"roles\", \"fees\", \"announcements\", \"complaints\", \"reports\", \"search\", \"audit_logs\"]', '2025-08-04 12:25:46', '2025-08-07 08:22:34'),
(3, 'staff', 'General staff member with student and fee management access', '[\"dashboard\", \"students.view\", \"students.create\", \"students.update\", \"parents.view\", \"fees.view\", \"fees.collect\", \"announcements.view\", \"complaints.view\", \"reports.students\"]', '2025-08-04 12:25:46', '2025-08-07 08:22:34'),
(4, 'parent', 'Parent with access to their children\'s information', '[\"dashboard\", \"students.view\", \"fees.view\", \"announcements.view\", \"complaints.create\", \"complaints.view\"]', '2025-08-04 12:25:46', '2025-08-07 08:22:34'),
(5, 'teacher', 'Teacher with class management permissions', '[\"dashboard\",\"students.view\",\"grades.view\",\"divisions.view\",\"announcements.view\",\"announcements.create\",\"reports.students\"]', '2025-08-07 04:50:55', '2025-08-07 08:20:55'),
(6, 'principal', 'School Principal with administrative oversight', '[\"dashboard\", \"academic_years.view\", \"grades\", \"divisions\", \"students\", \"parents\", \"staff.view\", \"fees\", \"announcements\", \"complaints\", \"reports\", \"search\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(7, 'vice_principal', 'Vice Principal with delegated administrative duties', '[\"dashboard\", \"academic_years.view\", \"grades.view\", \"divisions.view\", \"students\", \"parents.view\", \"staff.view\", \"fees.view\", \"fees.structure\", \"announcements\", \"complaints.view\", \"complaints.assign\", \"reports\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(8, 'academic_coordinator', 'Manages academic programs and curriculum', '[\"dashboard\", \"academic_years\", \"grades\", \"divisions\", \"students.view\", \"staff.view\", \"announcements.create\", \"announcements.send\", \"reports.students\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(9, 'class_teacher', 'Class teacher with access to their class students', '[\"dashboard\", \"grades.view\", \"divisions.view\", \"students.view\", \"students.update\", \"parents.view\", \"announcements.view\", \"announcements.create\", \"complaints.view\", \"reports.students\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(10, 'subject_teacher', 'Subject teacher with limited class access', '[\"dashboard\", \"grades.view\", \"divisions.view\", \"students.view\", \"announcements.view\", \"reports.students\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(11, 'accountant', 'Financial officer managing fees and payments', '[\"dashboard\", \"students.view\", \"parents.view\", \"fees\", \"reports.fees\", \"reports.export\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(12, 'fee_collector', 'Staff member responsible for fee collection', '[\"dashboard\", \"students.view\", \"parents.view\", \"fees.view\", \"fees.collect\", \"reports.fees\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(13, 'admission_officer', 'Handles student admissions and enrollment', '[\"dashboard\", \"academic_years.view\", \"grades.view\", \"divisions.view\", \"students.create\", \"students.view\", \"students.update\", \"parents.create\", \"parents.view\", \"parents.update\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(14, 'hr_manager', 'Human Resources manager for staff administration', '[\"dashboard\", \"staff\", \"roles.view\", \"announcements.create\", \"announcements.send\", \"reports.export\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(15, 'receptionist', 'Front desk staff with basic information access', '[\"dashboard\", \"students.view\", \"parents.view\", \"staff.view\", \"announcements.view\", \"complaints.create\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(16, 'librarian', 'Library staff with student information access', '[\"dashboard\", \"students.view\", \"announcements.view\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(17, 'it_admin', 'IT staff managing system and user accounts', '[\"dashboard\", \"staff\", \"roles\", \"settings\", \"audit_logs\", \"announcements\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(18, 'transport_coordinator', 'Manages school transportation', '[\"dashboard\", \"students.view\", \"parents.view\", \"announcements.create\", \"complaints.view\", \"complaints.resolve\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(19, 'exam_officer', 'Manages examinations and results', '[\"dashboard\", \"academic_years.view\", \"grades.view\", \"divisions.view\", \"students.view\", \"announcements.create\", \"reports.students\", \"reports.export\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(20, 'counselor', 'Student counselor with confidential access', '[\"dashboard\", \"students.view\", \"parents.view\", \"complaints.view\", \"complaints.create\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34'),
(21, 'guest', 'Limited view-only access for visitors', '[\"dashboard\", \"announcements.view\"]', '2025-08-07 08:22:34', '2025-08-07 08:22:34');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `name`, `mobile`, `email`, `address`, `pincode`, `role_id`, `password_hash`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', '9999999999', 'admin@school.com', '123 School Admin Office', '400001', 1, '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, '2025-08-04 12:36:20', '2025-08-07 08:04:29'),
(2, 'Dr. Rajesh Kumar', '9876543210', 'principal@school.com', '456 Principal Residence', '400002', 2, '$2y$10$TcZry2IqQrd0SC32vbCpb.QkaDyPTEBBgtGsbepY2VIhMSJZDACvu', 1, '2025-08-04 12:36:20', '2025-08-07 04:54:28'),
(3, 'Mrs. Priya Sharma', '9876543211', 'vp@school.com', '789 VP Quarters', '400003', 2, '$2y$10$TcZry2IqQrd0SC32vbCpb.QkaDyPTEBBgtGsbepY2VIhMSJZDACvu', 1, '2025-08-04 12:36:20', '2025-08-04 12:50:34'),
(4, 'Mr. Amit Patel', '9876543212', 'amit.teacher@school.com', '321 Teacher Colony', '400004', 3, '$2y$10$oSdyVykTgsuuQhidgy65Nua3jlq7hHv1vx5m3tKK.I319dvhNB9NW', 1, '2025-08-04 12:36:20', '2025-08-14 09:44:29'),
(5, 'Ms. Sunita Joshi', '9876543213', 'sunita.teacher@school.com', '654 Staff Quarters', '400005', 3, '$2y$10$cfFwL9K36/M9eKKXIhB0S.oEh6tiZ9z8Hw5d01YI5LuQlgsRvnehO', 1, '2025-08-04 12:36:20', '2025-08-25 09:33:21'),
(6, 'Mr. Vikram Singh', '9876543214', 'vikram.teacher@school.com', '987 Teachers Block', '400006', 3, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '2025-08-04 12:36:20', '2025-08-04 12:36:20'),
(7, 'Mrs. Kavita Reddy', '9876543215', 'kavita.teacher@school.com', '147 Faculty Housing', '400007', 3, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '2025-08-04 12:36:20', '2025-08-04 12:36:20'),
(8, 'Mr. Arjun Gupta', '9876543216', 'arjun.teacher@school.com', '258 Teacher Residence', '400008', 3, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '2025-08-04 12:36:20', '2025-08-04 12:36:20'),
(10, 'Admin User', '1111111111', 'admin@school.com', 'School Campus', '', 1, '$2y$10$UsH11wtKiUi4AkGCFkmCKucFIA/Nu2ayRjSvAvxP5APuIVixX4rPW', 1, '2025-08-25 11:35:06', '2025-08-25 09:30:20'),
(11, 'Staff User', '2222222222', 'staff@school.com', 'School Campus', NULL, 2, '$2y$10$UsH11wtKiUi4AkGCFkmCKucFIA/Nu2ayRjSvAvxP5APuIVixX4rPW', 1, '2025-08-25 11:35:16', '2025-08-25 11:40:45'),
(12, 'Test Teacher', '4444444444', 'teacher@school.com', 'School Campus', NULL, 5, '$2y$10$7EN1Yh4bzM6snS6VgYJ07.C.ysfLdK1A4WaW3C7fruTQq1NjtxmUG', 1, '2025-08-25 13:20:29', '2025-08-25 13:21:35');

-- --------------------------------------------------------

--
-- Table structure for table `staff_assignments`
--

CREATE TABLE `staff_assignments` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `grade_id` int(11) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL,
  `academic_year_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_divisions`
--

CREATE TABLE `staff_divisions` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_divisions`
--

INSERT INTO `staff_divisions` (`id`, `staff_id`, `division_id`, `created_at`) VALUES
(1, 2, 1, '2025-08-07 04:54:28'),
(2, 2, 2, '2025-08-07 04:54:28');

-- --------------------------------------------------------

--
-- Table structure for table `staff_grades`
--

CREATE TABLE `staff_grades` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `grade_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_grades`
--

INSERT INTO `staff_grades` (`id`, `staff_id`, `grade_id`, `created_at`) VALUES
(1, 2, 1, '2025-08-07 04:54:28'),
(2, 2, 2, '2025-08-07 04:54:28');

-- --------------------------------------------------------

--
-- Table structure for table `staff_ledger`
--

CREATE TABLE `staff_ledger` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `transaction_type` enum('collection','transfer','adjustment') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_ledger`
--

INSERT INTO `staff_ledger` (`id`, `staff_id`, `transaction_type`, `amount`, `balance`, `reference_id`, `reference_type`, `description`, `transaction_date`, `created_at`) VALUES
(1, 1, 'collection', '500.00', '1500.00', 12, 'fee_collection', 'Fee collection - Receipt: TEST20250809115214', '2025-08-09', '2025-08-09 09:52:14'),
(2, 1, 'collection', '1000.00', '2500.00', 13, 'fee_collection', 'Fee collection - Receipt: RCP202508090007', '2025-08-09', '2025-08-09 06:25:37'),
(3, 1, 'collection', '1000.00', '3500.00', 14, 'fee_collection', 'Fee collection - Receipt: RCP202508090008', '2025-08-09', '2025-08-09 06:26:25'),
(4, 1, 'collection', '1000.00', '4500.00', 15, 'fee_collection', 'Fee collection - Receipt: RCP202508090009', '2025-08-09', '2025-08-09 06:26:51'),
(5, 1, 'collection', '1000.00', '5500.00', 16, 'fee_collection', 'Fee collection - Receipt: RCP202508090010', '2025-08-09', '2025-08-09 06:27:14'),
(6, 1, 'collection', '1000.00', '6500.00', 17, 'fee_collection', 'Fee collection - Receipt: RCP202508090011', '2025-08-09', '2025-08-09 06:27:20'),
(7, 1, 'collection', '1000.00', '7500.00', 18, 'fee_collection', 'Fee collection - Receipt: RCP202508090012', '2025-08-09', '2025-08-09 06:27:45'),
(8, 1, 'collection', '1000.00', '8500.00', 19, 'fee_collection', 'Fee collection - Receipt: RCP202508090013', '2025-08-09', '2025-08-09 06:28:01'),
(9, 1, 'collection', '1000.00', '9500.00', 20, 'fee_collection', 'Fee collection - Receipt: RCP202508090014', '2025-08-09', '2025-08-09 06:28:53'),
(10, 1, 'collection', '1000.00', '10500.00', 21, 'fee_collection', 'Fee collection - Receipt: RCP202508090015', '2025-08-09', '2025-08-09 06:29:36'),
(11, 1, 'collection', '1000.00', '11500.00', 22, 'fee_collection', 'Fee collection - Receipt: RCP202508090016', '2025-08-09', '2025-08-09 06:29:51'),
(12, 1, 'collection', '1000.00', '12500.00', 23, 'fee_collection', 'Fee collection - Receipt: TEST_DIRECT_20250809120004', '2025-08-09', '2025-08-09 10:00:04'),
(13, 1, 'collection', '1000.00', '13500.00', 24, 'fee_collection', 'Fee collection - Receipt: RCP202508090017', '2025-08-09', '2025-08-09 06:30:21'),
(14, 1, 'collection', '1000.00', '14500.00', 25, 'fee_collection', 'Fee collection - Receipt: RCP202508090018', '2025-08-09', '2025-08-09 06:30:44'),
(15, 1, 'collection', '1000.00', '15500.00', 26, 'fee_collection', 'Fee collection - Receipt: RCP202508090019', '2025-08-09', '2025-08-09 06:31:15'),
(16, 1, 'collection', '1000.00', '16500.00', 27, 'fee_collection', 'Fee collection - Receipt: RCP202508090020', '2025-08-09', '2025-08-09 06:31:33'),
(17, 1, 'collection', '1000.00', '17500.00', 28, 'fee_collection', 'Fee collection - Receipt: RCP202508090021', '2025-08-09', '2025-08-09 06:32:09'),
(18, 1, 'collection', '3000.00', '20500.00', 29, 'fee_collection', 'Fee collection - Receipt: RCP202508090022', '2025-08-09', '2025-08-09 06:33:18'),
(19, 1, 'collection', '1000.00', '21500.00', 30, 'fee_collection', 'Fee collection - Receipt: RCP202508093962', '2025-08-09', '2025-08-09 10:03:36'),
(20, 1, 'collection', '3000.00', '24500.00', 31, 'fee_collection', 'Fee collection - Receipt: RCP202508093963', '2025-08-09', '2025-08-09 06:33:46'),
(21, 1, 'collection', '1000.00', '25500.00', 32, 'fee_collection', 'Fee collection - Receipt: RCP202508093964', '2025-08-09', '2025-08-09 06:33:58'),
(22, 1, 'collection', '500.00', '26000.00', 33, 'fee_collection', 'Fee collection - Receipt: RCP202508093965', '2025-08-09', '2025-08-09 06:34:22'),
(23, 1, 'collection', '500.00', '26500.00', 34, 'fee_collection', 'Fee collection - Receipt: RCP202508093966', '2025-08-09', '2025-08-09 06:35:02'),
(24, 1, 'collection', '500.00', '27000.00', 35, 'fee_collection', 'Fee collection - Receipt: RCP202508093967', '2025-08-09', '2025-08-09 06:35:31'),
(25, 1, 'collection', '3000.00', '30000.00', 36, 'fee_collection', 'Fee collection - Receipt: RCP202508093968', '2025-08-09', '2025-08-09 06:35:52'),
(26, 1, 'collection', '3000.00', '33000.00', 37, 'fee_collection', 'Fee collection - Receipt: RCP202508093969', '2025-08-09', '2025-08-09 06:36:19'),
(27, 1, 'collection', '3000.00', '36000.00', 38, 'fee_collection', 'Fee collection - Receipt: RCP202508093970', '2025-08-09', '2025-08-09 06:37:16'),
(28, 1, 'collection', '500.50', '36500.50', 39, 'fee_collection', 'Fee collection - Receipt: RCP202508093971', '2025-08-09', '2025-08-09 06:37:43'),
(29, 1, 'collection', '500.00', '37000.50', 40, 'fee_collection', 'Fee collection - Receipt: RCP202508093972', '2025-08-09', '2025-08-09 06:38:04'),
(30, 1, 'collection', '5000.00', '42000.50', 42, 'fee_collection', 'Fee collection - Receipt: RCP202508099074', '2025-08-09', '2025-08-09 06:39:24'),
(31, 1, 'collection', '5000.00', '47000.50', 43, 'fee_collection', 'Fee collection - Receipt: RCP202508099075', '2025-08-09', '2025-08-09 06:40:22'),
(32, 1, 'collection', '5000.00', '52000.50', 44, 'fee_collection', 'Fee collection - Receipt: RCP202508099076', '2025-08-09', '2025-08-09 06:40:27'),
(33, 1, 'collection', '5000.00', '57000.50', 45, 'fee_collection', 'Fee collection - Receipt: RCP202508099077', '2025-08-09', '2025-08-09 06:41:09'),
(34, 1, 'collection', '5000.00', '62000.50', 46, 'fee_collection', 'Fee collection - Receipt: RCP202508099078', '2025-08-09', '2025-08-09 06:42:33'),
(35, 1, 'collection', '5000.00', '67000.50', 47, 'fee_collection', 'Fee collection - Receipt: RCP202508099079', '2025-08-09', '2025-08-09 06:42:43'),
(36, 1, 'collection', '5000.00', '72000.50', 49, 'fee_collection', 'Fee collection - Receipt: RCP202508098307', '2025-08-09', '2025-08-09 06:44:02'),
(47, 1, 'collection', '500.00', '72500.50', 61, 'fee_collection', 'Fee collection - Receipt: RCP202508098309', '2025-08-09', '2025-08-09 06:47:55'),
(48, 1, 'collection', '600.00', '73100.50', 62, 'fee_collection', 'Fee collection - Receipt: RCP202508098310', '2025-08-09', '2025-08-09 06:48:12'),
(49, 1, 'collection', '700.00', '73800.50', 63, 'fee_collection', 'Fee collection - Receipt: RCP202508098311', '2025-08-09', '2025-08-09 06:48:52'),
(50, 1, 'collection', '800.00', '74600.50', 64, 'fee_collection', 'Fee collection - Receipt: RCP202508098312', '2025-08-09', '2025-08-09 06:49:13'),
(51, 1, 'collection', '5000.00', '79600.50', 65, 'fee_collection', 'Fee collection - Receipt: RCP202508098313', '2025-08-09', '2025-08-09 06:49:18'),
(52, 1, 'collection', '1000.00', '80600.50', 66, 'fee_collection', 'Fee collection - Receipt: RCP202508098314', '2025-08-09', '2025-08-09 06:49:47'),
(53, 1, 'collection', '1000.00', '81600.50', 67, 'fee_collection', 'Fee collection - Receipt: RCP202508098315', '2025-08-09', '2025-08-09 07:12:40'),
(54, 1, '', '-100.00', '81500.50', NULL, 'admin_withdrawal', 'dfaddsfd', '2025-08-09', '2025-08-09 07:33:13'),
(55, 1, 'collection', '2500.00', '84000.50', 68, 'fee_collection', 'Fee collection - Receipt: RCP202508180001', '2025-08-18', '2025-08-18 07:14:47'),
(56, 1, 'collection', '500.00', '84500.50', 69, 'fee_collection', 'Fee collection - Receipt: RCP202508180002', '2025-08-18', '2025-08-18 07:50:15'),
(57, 1, 'collection', '150.00', '84650.50', 70, 'fee_collection', 'Fee collection - Receipt: RCP202508180003', '2025-08-18', '2025-08-18 07:50:31');

-- --------------------------------------------------------

--
-- Table structure for table `staff_wallets`
--

CREATE TABLE `staff_wallets` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `current_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_collected` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_withdrawn` decimal(10,2) NOT NULL DEFAULT 0.00,
  `last_transaction_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `staff_wallets`
--

INSERT INTO `staff_wallets` (`id`, `staff_id`, `current_balance`, `total_collected`, `total_withdrawn`, `last_transaction_at`, `created_at`, `updated_at`) VALUES
(1, 1, '84650.50', '84750.50', '100.00', '2025-08-18 07:50:31', '2025-08-09 06:48:51', '2025-08-18 07:50:31'),
(2, 2, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51'),
(3, 3, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51'),
(4, 4, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51'),
(5, 5, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51'),
(6, 6, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51'),
(7, 7, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51'),
(8, 8, '0.00', '0.00', '0.00', NULL, '2025-08-09 06:48:51', '2025-08-09 06:48:51');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL DEFAULT 1,
  `student_name` varchar(100) NOT NULL,
  `grade_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `roll_number` varchar(20) NOT NULL,
  `aadhaar_encrypted` text DEFAULT NULL,
  `residential_address` text DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `sam_samagrah_id` varchar(50) DEFAULT NULL,
  `aapar_id` varchar(50) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `total_fees` decimal(10,2) DEFAULT 0.00,
  `parent_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `academic_year_id`, `student_name`, `grade_id`, `division_id`, `roll_number`, `aadhaar_encrypted`, `residential_address`, `pincode`, `sam_samagrah_id`, `aapar_id`, `admission_date`, `total_fees`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Aarav Kumar', 1, 1, 'C1A001', NULL, '123 Main Street, Mumbai, Maharashtra', '400001', '', '', '2025-04-01', '500.00', 1, 1, '2025-08-07 03:54:41', '2025-08-18 07:55:10'),
(2, 1, 'Ananya Sharma', 1, 1, 'C1A002', NULL, '456 Park Avenue, Mumbai, Maharashtra', '400002', NULL, NULL, '2025-04-01', '0.00', 2, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(3, 1, 'Aryan Patel', 1, 1, 'C1A003', NULL, '789 Garden Road, Mumbai, Maharashtra', '400003', NULL, NULL, '2025-04-01', '0.00', 3, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(4, 1, 'Diya Verma', 1, 2, 'C1B001', NULL, '321 Lake View, Mumbai, Maharashtra', '400004', NULL, NULL, '2025-04-01', '0.00', 4, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(5, 1, 'Dev Singh', 1, 2, 'C1B002', NULL, '654 Hill Street, Mumbai, Maharashtra', '400005', NULL, NULL, '2025-04-01', '0.00', 5, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(6, 1, 'Ishani Desai', 1, 2, 'C1B003', NULL, '987 Beach Road, Mumbai, Maharashtra', '400006', NULL, NULL, '2025-04-01', '0.00', 6, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(7, 1, 'Krishna Gupta', 2, 1, 'C2A001', NULL, '147 Market Street, Mumbai, Maharashtra', '400007', NULL, NULL, '2024-04-01', '0.00', 7, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(8, 1, 'Kavya Reddy', 2, 1, 'C2A002', NULL, '258 Temple Road, Mumbai, Maharashtra', '400008', NULL, NULL, '2024-04-01', '0.00', 8, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(9, 1, 'Kabir Nair', 2, 1, 'C2A003', NULL, '369 College Road, Mumbai, Maharashtra', '400009', NULL, NULL, '2024-04-01', '0.00', 9, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(10, 1, 'Meera Joshi', 2, 2, 'C2B001', NULL, '741 Station Road, Mumbai, Maharashtra', '400010', NULL, NULL, '2024-04-01', '0.00', 10, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(11, 1, 'Mohit Mehta', 2, 2, 'C2B002', NULL, '852 River View, Mumbai, Maharashtra', '400011', NULL, NULL, '2024-04-01', '0.00', 11, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(12, 1, 'Maya Kulkarni', 2, 2, 'C2B003', NULL, '963 Forest Avenue, Mumbai, Maharashtra', '400012', NULL, NULL, '2024-04-01', '0.00', 12, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(13, 1, 'Rohan Krishnan', 3, 1, 'C3A001', NULL, '159 City Center, Mumbai, Maharashtra', '400013', NULL, NULL, '2023-04-01', '0.00', 13, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(14, 1, 'Riya Iyer', 3, 1, 'C3A002', NULL, '753 Mall Road, Mumbai, Maharashtra', '400014', NULL, NULL, '2023-04-01', '0.00', 14, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(15, 1, 'Rahul Malhotra', 3, 1, 'C3A003', NULL, '486 Sports Complex, Mumbai, Maharashtra', '400015', NULL, NULL, '2023-04-01', '0.00', 15, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(16, 1, 'Sanya Kumar', 3, 2, 'C3B001', NULL, '123 Main Street, Mumbai, Maharashtra', '400001', NULL, NULL, '2023-04-01', '0.00', 1, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(17, 1, 'Sahil Sharma', 3, 2, 'C3B002', NULL, '456 Park Avenue, Mumbai, Maharashtra', '400002', NULL, NULL, '2023-04-01', '0.00', 2, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(18, 1, 'Sara Patel', 3, 2, 'C3B003', NULL, '789 Garden Road, Mumbai, Maharashtra', '400003', NULL, NULL, '2023-04-01', '0.00', 3, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(19, 1, 'Vivaan Verma', 5, 1, 'C4A001', NULL, '321 Lake View, Mumbai, Maharashtra', '400004', NULL, NULL, '2022-04-01', '0.00', 4, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(20, 1, 'Vanya Singh', 5, 1, 'C4A002', NULL, '654 Hill Street, Mumbai, Maharashtra', '400005', NULL, NULL, '2022-04-01', '0.00', 5, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(21, 1, 'Vedant Desai', 5, 1, 'C4A003', NULL, '987 Beach Road, Mumbai, Maharashtra', '400006', NULL, NULL, '2022-04-01', '0.00', 6, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(22, 1, 'Zara Gupta', 5, 2, 'C4B001', NULL, '147 Market Street, Mumbai, Maharashtra', '400007', NULL, NULL, '2022-04-01', '0.00', 7, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(23, 1, 'Zain Reddy', 5, 2, 'C4B002', NULL, '258 Temple Road, Mumbai, Maharashtra', '400008', NULL, NULL, '2022-04-01', '0.00', 8, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(24, 1, 'Zoya Nair', 5, 2, 'C4B003', NULL, '369 College Road, Mumbai, Maharashtra', '400009', NULL, NULL, '2022-04-01', '0.00', 9, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(25, 1, 'Aditya Joshi', 6, 1, 'C5A001', NULL, '741 Station Road, Mumbai, Maharashtra', '400010', NULL, NULL, '2021-04-01', '0.00', 10, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(26, 1, 'Aditi Mehta', 6, 1, 'C5A002', NULL, '852 River View, Mumbai, Maharashtra', '400011', NULL, NULL, '2021-04-01', '0.00', 11, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(27, 1, 'Arnav Kulkarni', 6, 1, 'C5A003', NULL, '963 Forest Avenue, Mumbai, Maharashtra', '400012', NULL, NULL, '2021-04-01', '0.00', 12, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(28, 1, 'Avni Krishnan', 6, 2, 'C5B001', NULL, '159 City Center, Mumbai, Maharashtra', '400013', NULL, NULL, '2021-04-01', '0.00', 13, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(29, 1, 'Ayush Iyer', 6, 2, 'C5B002', NULL, '753 Mall Road, Mumbai, Maharashtra', '400014', NULL, NULL, '2021-04-01', '0.00', 14, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(30, 1, 'Anvi Malhotra', 6, 2, 'C5B003', NULL, '486 Sports Complex, Mumbai, Maharashtra', '400015', NULL, NULL, '2021-04-01', '0.00', 15, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(44, 1, 'Test Studnet', 1, 1, 'C1A200', NULL, 'sdfdsfafdsafsdfds', '424001', '23423423', '23432432', '2025-08-18', '0.00', 3, 0, '2025-08-18 08:00:48', '2025-08-18 08:05:24'),
(45, 1, 'Test Studnet', 1, 1, 'C1A2222', NULL, 'sdfdsfafdsafsdfds', '424001', '23423423', '23432432', '2025-08-18', '0.00', 3, 0, '2025-08-18 08:01:06', '2025-08-18 08:05:29'),
(46, 1, 'Test Student Debug', 1, 1, 'TEST_1755517083', NULL, NULL, NULL, NULL, NULL, '2025-08-18', '0.00', 1, 1, '2025-08-18 08:08:03', '2025-08-18 08:08:03'),
(47, 1, 'Test Student Debug', 1, 1, 'TEST_1755517113', NULL, NULL, NULL, NULL, NULL, '2025-08-18', '0.00', 1, 1, '2025-08-18 08:08:33', '2025-08-18 08:08:33'),
(48, 1, 'Test Student Debug', 1, 1, 'TEST_1755517159', NULL, NULL, NULL, NULL, NULL, '2025-08-18', '0.00', 1, 1, '2025-08-18 08:09:19', '2025-08-18 08:09:19'),
(49, 1, 'Test Student Debug', 1, 1, 'TEST_1755517223', NULL, NULL, NULL, NULL, NULL, '2025-08-18', '0.00', 1, 1, '2025-08-18 08:10:23', '2025-08-18 08:10:23'),
(50, 1, 'Test Student Debug', 1, 1, 'TEST_1755517273', NULL, NULL, NULL, NULL, NULL, '2025-08-18', '0.00', 1, 1, '2025-08-18 08:11:13', '2025-08-18 08:11:13');

-- --------------------------------------------------------

--
-- Table structure for table `student_fee_assignments`
--

CREATE TABLE `student_fee_assignments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `fee_structure_id` int(11) NOT NULL,
  `semester` enum('Semester 1','Semester 2') NOT NULL DEFAULT 'Semester 1',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pending_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','partial','paid','overdue') DEFAULT 'pending',
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `discount_reason` varchar(200) DEFAULT NULL,
  `late_fee_applied` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_fee_assignments`
--

INSERT INTO `student_fee_assignments` (`id`, `student_id`, `fee_structure_id`, `semester`, `total_amount`, `paid_amount`, `pending_amount`, `due_date`, `status`, `discount_amount`, `discount_reason`, `late_fee_applied`, `notes`, `is_active`, `assigned_at`, `updated_at`) VALUES
(1, 1, 1, 'Semester 1', '1500.00', '150.00', '1350.00', '2025-06-30', 'overdue', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-18 11:20:31'),
(2, 1, 2, 'Semester 1', '5000.00', '500.00', '4500.00', '2025-05-31', 'overdue', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-18 11:20:15'),
(3, 1, 3, 'Semester 1', '2500.00', '2500.00', '0.00', '2025-06-30', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-18 10:44:47'),
(4, 1, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(5, 1, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(6, 2, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(7, 2, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(8, 2, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(9, 2, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(10, 2, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(11, 3, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(12, 3, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(13, 3, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(14, 3, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(15, 3, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(16, 4, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(17, 4, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(18, 4, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(19, 4, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(20, 4, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(21, 5, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(22, 5, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(23, 5, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(24, 5, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(25, 5, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(26, 6, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(27, 6, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(28, 6, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(29, 6, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(30, 6, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(31, 7, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(32, 7, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(33, 7, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(34, 7, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(35, 7, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(36, 8, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(37, 8, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(38, 8, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(39, 8, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(40, 8, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(41, 9, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(42, 9, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(43, 9, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(44, 9, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(45, 9, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(46, 10, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(47, 10, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(48, 10, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(49, 10, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(50, 10, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(51, 11, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(52, 11, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(53, 11, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(54, 11, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(55, 11, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(56, 12, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(57, 12, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(58, 12, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(59, 12, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(60, 12, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(61, 13, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(62, 13, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(63, 13, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(64, 13, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(65, 13, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(66, 14, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(67, 14, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(68, 14, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(69, 14, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(70, 14, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(71, 15, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(72, 15, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(73, 15, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(74, 15, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(75, 15, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(76, 16, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(77, 16, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(78, 16, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(79, 16, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(80, 16, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(81, 17, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(82, 17, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(83, 17, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(84, 17, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(85, 17, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(86, 18, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(87, 18, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(88, 18, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(89, 18, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(90, 18, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(91, 19, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(92, 19, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(93, 19, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(94, 19, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(95, 19, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(96, 20, 1, 'Semester 1', '1500.00', '0.00', '1500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(97, 20, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-05-31', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(98, 20, 3, 'Semester 1', '2500.00', '0.00', '2500.00', '2025-06-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(99, 20, 4, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-04-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(100, 20, 5, 'Semester 1', '1200.00', '0.00', '1200.00', NULL, 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-07 03:54:41', '2025-08-07 03:54:41'),
(153, 21, 536, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:10:52', '2025-08-09 04:40:52'),
(154, 21, 538, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:11:10', '2025-08-09 04:41:10'),
(155, 21, 540, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:11:48', '2025-08-09 04:41:48'),
(156, 21, 542, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:12:02', '2025-08-09 04:42:02'),
(157, 21, 544, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:12:20', '2025-08-09 04:42:20'),
(158, 21, 546, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:12:34', '2025-08-09 04:42:34'),
(159, 21, 548, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:12:56', '2025-08-09 04:42:56'),
(160, 21, 550, '', '2000.00', '0.00', '2000.00', '2025-08-09', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:13:11', '2025-08-09 04:43:11'),
(161, 21, 552, '', '2000.00', '2000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:13:29', '2025-08-09 01:13:29'),
(162, 21, 554, '', '2000.00', '2000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:13:45', '2025-08-09 01:13:45'),
(163, 21, 556, '', '2000.00', '2000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:14:13', '2025-08-09 01:14:13'),
(164, 21, 558, '', '2000.00', '2000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:14:38', '2025-08-09 01:14:38'),
(165, 21, 560, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 01:18:12', '2025-08-09 04:48:12'),
(166, 2, 562, '', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 03:13:16', '2025-08-09 06:43:16'),
(167, 21, 564, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:25:37', '2025-08-09 09:55:37'),
(168, 21, 566, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:26:25', '2025-08-09 09:56:25'),
(169, 21, 568, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:26:51', '2025-08-09 09:56:51'),
(170, 21, 570, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:27:14', '2025-08-09 09:57:14'),
(171, 21, 572, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:27:20', '2025-08-09 09:57:20'),
(172, 21, 574, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:27:45', '2025-08-09 09:57:45'),
(173, 21, 576, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:28:01', '2025-08-09 09:58:01'),
(174, 21, 578, '', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:28:53', '2025-08-09 09:58:53'),
(175, 21, 580, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:29:36', '2025-08-09 09:59:36'),
(176, 21, 582, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:29:51', '2025-08-09 09:59:51'),
(177, 21, 583, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:30:04', '2025-08-09 10:00:04'),
(178, 21, 585, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:30:21', '2025-08-09 10:00:21'),
(179, 21, 587, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:30:44', '2025-08-09 10:00:44'),
(180, 21, 589, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:31:15', '2025-08-09 10:01:15'),
(181, 21, 591, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:31:33', '2025-08-09 10:01:33'),
(182, 21, 593, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:32:09', '2025-08-09 10:02:09'),
(183, 21, 595, 'Semester 1', '3000.00', '3000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:33:18', '2025-08-09 10:03:18'),
(184, 21, 596, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:33:36', '2025-08-09 10:03:36'),
(185, 21, 598, 'Semester 1', '3000.00', '3000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:33:46', '2025-08-09 10:03:46'),
(186, 21, 600, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:33:58', '2025-08-09 10:03:58'),
(187, 21, 602, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:34:22', '2025-08-09 10:04:22'),
(188, 21, 604, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:35:02', '2025-08-09 10:05:02'),
(189, 21, 606, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:35:31', '2025-08-09 10:05:31'),
(190, 21, 608, 'Semester 1', '3000.00', '3000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:35:52', '2025-08-09 10:05:52'),
(191, 21, 610, 'Semester 1', '3000.00', '3000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:36:19', '2025-08-09 10:06:19'),
(192, 21, 612, 'Semester 1', '3000.00', '3000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:37:16', '2025-08-09 10:07:16'),
(193, 21, 614, 'Semester 1', '500.50', '500.50', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:37:43', '2025-08-09 10:07:43'),
(194, 21, 616, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:38:04', '2025-08-09 10:08:04'),
(195, 21, 617, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:38:47', '2025-08-09 10:08:47'),
(196, 21, 619, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:39:24', '2025-08-09 10:09:24'),
(197, 21, 621, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:40:22', '2025-08-09 10:10:22'),
(198, 21, 623, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:40:27', '2025-08-09 10:10:27'),
(199, 21, 625, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:41:09', '2025-08-09 10:11:09'),
(200, 21, 627, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:42:33', '2025-08-09 10:12:33'),
(201, 21, 629, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:42:43', '2025-08-09 10:12:43'),
(202, 21, 630, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:43:26', '2025-08-09 10:13:26'),
(203, 21, 632, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:44:02', '2025-08-09 10:14:02'),
(214, 21, 643, 'Semester 1', '500.00', '500.00', '-500.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:47:22', '2025-08-09 10:17:22'),
(215, 21, 644, 'Semester 1', '500.00', '500.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:47:55', '2025-08-09 10:17:55'),
(216, 21, 645, 'Semester 1', '600.00', '600.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:48:12', '2025-08-09 10:18:12'),
(217, 21, 646, 'Semester 1', '700.00', '700.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:48:52', '2025-08-09 10:18:52'),
(218, 21, 647, 'Semester 1', '800.00', '800.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:49:13', '2025-08-09 10:19:13'),
(219, 21, 648, 'Semester 1', '5000.00', '5000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:49:18', '2025-08-09 10:19:18'),
(220, 21, 649, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 06:49:47', '2025-08-09 10:19:47'),
(221, 21, 650, 'Semester 1', '1000.00', '1000.00', '0.00', '2025-08-09', 'paid', '0.00', NULL, '0.00', NULL, 1, '2025-08-09 07:12:40', '2025-08-09 10:42:40'),
(250, 50, 1, 'Semester 1', '1000.00', '0.00', '1000.00', '2025-12-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:11:13', '2025-08-18 11:41:13'),
(251, 50, 2, 'Semester 2', '1000.00', '0.00', '1000.00', '2025-12-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:11:13', '2025-08-18 11:41:13'),
(252, 50, 3, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-30', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:11:13', '2025-08-18 11:41:13'),
(253, 1, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(254, 2, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(255, 3, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(256, 46, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(257, 47, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(258, 48, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(259, 49, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(260, 50, 6, 'Semester 1', '100.00', '0.00', '100.00', '2025-08-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:15:28', '2025-08-18 11:45:28'),
(261, 46, 1, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:28:05', '2025-08-18 11:58:05'),
(262, 47, 1, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:28:05', '2025-08-18 11:58:05'),
(263, 48, 1, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:28:05', '2025-08-18 11:58:05'),
(264, 49, 1, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:28:05', '2025-08-18 11:58:05'),
(265, 46, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:32:34', '2025-08-18 12:02:34'),
(266, 47, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:32:34', '2025-08-18 12:02:34'),
(267, 48, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:32:34', '2025-08-18 12:02:34'),
(268, 49, 2, 'Semester 1', '5000.00', '0.00', '5000.00', '2025-12-18', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-18 08:32:34', '2025-08-18 12:02:34'),
(269, 46, 3, 'Semester 1', '399.98', '0.00', '399.98', '2025-08-19', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-19 01:40:19', '2025-08-19 05:10:19'),
(270, 47, 3, 'Semester 1', '399.98', '0.00', '399.98', '2025-08-19', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-19 01:40:19', '2025-08-19 05:10:19'),
(271, 48, 3, 'Semester 1', '399.98', '0.00', '399.98', '2025-08-19', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-19 01:40:19', '2025-08-19 05:10:19'),
(272, 49, 3, 'Semester 1', '399.98', '0.00', '399.98', '2025-08-19', 'pending', '0.00', NULL, '0.00', NULL, 1, '2025-08-19 01:40:19', '2025-08-19 05:10:19');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES
(1, 'school_name', 'ABC School', 'string', 'Name of the school', NULL, '2025-08-04 12:25:46'),
(2, 'school_logo', '', 'string', 'School logo file path', NULL, '2025-08-04 12:25:46'),
(3, 'academic_year', '2024-25', 'string', 'Current academic year', NULL, '2025-08-04 12:25:46'),
(4, 'default_theme', 'light', 'string', 'Default theme for the application', NULL, '2025-08-04 12:25:46'),
(5, 'sms_enabled', '0', 'boolean', 'Enable SMS notifications', NULL, '2025-08-04 12:25:46'),
(6, 'email_enabled', '0', 'boolean', 'Enable email notifications', NULL, '2025-08-04 12:25:46'),
(7, 'whatsapp_enabled', '0', 'boolean', 'Enable WhatsApp notifications', NULL, '2025-08-04 12:25:46');

-- --------------------------------------------------------

--
-- Table structure for table `todos`
--

CREATE TABLE `todos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('admin','staff','parent') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `due_date` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `todos`
--

INSERT INTO `todos` (`id`, `user_id`, `user_type`, `title`, `description`, `priority`, `status`, `due_date`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', 'Review pending fee collections', 'Check and follow up on overdue student fees for the current term', 'high', 'pending', '2025-08-26 17:18:12', '2025-08-25 17:18:12', '2025-08-25 17:18:12'),
(2, 1, 'admin', 'Update academic year settings', 'Configure new academic year parameters and fee structures', 'medium', 'pending', '2025-09-01 17:18:12', '2025-08-25 17:18:12', '2025-08-25 17:18:12'),
(3, 1, 'admin', 'Staff meeting preparation', 'Prepare agenda for monthly staff meeting and performance reviews', 'medium', 'pending', '2025-08-28 17:18:12', '2025-08-25 17:18:12', '2025-08-25 17:18:12');

-- --------------------------------------------------------

--
-- Table structure for table `user_announcement_reads`
--

CREATE TABLE `user_announcement_reads` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('admin','staff','parent') NOT NULL,
  `announcement_id` int(11) NOT NULL,
  `is_read` tinyint(1) DEFAULT 1,
  `read_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `user_announcement_reads`
--

INSERT INTO `user_announcement_reads` (`id`, `user_id`, `user_type`, `announcement_id`, `is_read`, `read_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', 1, 1, '2025-08-25 14:46:43', '2025-08-25 14:46:43', '2025-08-25 14:46:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_is_default` (`is_default`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_target_type` (`target_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_announcements_created_at` (`created_at`),
  ADD KEY `idx_attachment` (`attachment_filename`);

--
-- Indexes for table `announcement_delivery_status`
--
ALTER TABLE `announcement_delivery_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_announcement` (`announcement_id`),
  ADD KEY `idx_recipient` (`recipient_type`,`recipient_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_channel` (`channel`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_action` (`user_id`,`user_type`,`action`),
  ADD KEY `idx_table_record` (`table_name`,`record_id`);

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token_hash` (`token_hash`),
  ADD KEY `idx_user_type` (`user_id`,`user_type`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexes for table `bus_routes`
--
ALTER TABLE `bus_routes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `route_name` (`route_name`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `complaint_number` (`complaint_number`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_parent` (`parent_id`),
  ADD KEY `idx_complaints_created_at` (`created_at`);

--
-- Indexes for table `complaint_comments`
--
ALTER TABLE `complaint_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_complaint` (`complaint_id`),
  ADD KEY `idx_commenter` (`commented_by_type`,`commented_by_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_grade_division` (`grade_id`,`name`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`);

--
-- Indexes for table `fee_categories`
--
ALTER TABLE `fee_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `fee_collections`
--
ALTER TABLE `fee_collections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `fee_type_id` (`fee_type_id`),
  ADD KEY `collected_by` (`collected_by`),
  ADD KEY `idx_student_fee` (`student_id`,`fee_type_id`),
  ADD KEY `idx_collection_date` (`collection_date`),
  ADD KEY `idx_receipt` (`receipt_number`),
  ADD KEY `idx_fee_collections_date_collector` (`collection_date`,`collected_by`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`);

--
-- Indexes for table `fee_structures`
--
ALTER TABLE `fee_structures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_academic_year` (`academic_year_id`),
  ADD KEY `idx_grade_division` (`grade_id`,`division_id`),
  ADD KEY `idx_category` (`fee_category_id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_grade_division_semester` (`grade_id`,`division_id`,`semester`,`academic_year_id`);

--
-- Indexes for table `fee_types`
--
ALTER TABLE `fee_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD KEY `idx_mobile` (`mobile`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `idx_mobile` (`mobile`);

--
-- Indexes for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_staff_id` (`staff_id`),
  ADD KEY `idx_grade_id` (`grade_id`),
  ADD KEY `idx_division_id` (`division_id`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`);

--
-- Indexes for table `staff_divisions`
--
ALTER TABLE `staff_divisions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_staff_division` (`staff_id`,`division_id`),
  ADD KEY `division_id` (`division_id`);

--
-- Indexes for table `staff_grades`
--
ALTER TABLE `staff_grades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_staff_grade` (`staff_id`,`grade_id`),
  ADD KEY `grade_id` (`grade_id`);

--
-- Indexes for table `staff_ledger`
--
ALTER TABLE `staff_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_staff_date` (`staff_id`,`transaction_date`);

--
-- Indexes for table `staff_wallets`
--
ALTER TABLE `staff_wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_staff_wallet` (`staff_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_roll_grade_division` (`roll_number`,`grade_id`,`division_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `idx_student_name` (`student_name`),
  ADD KEY `idx_roll_number` (`roll_number`),
  ADD KEY `idx_students_grade_division` (`grade_id`,`division_id`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`);

--
-- Indexes for table `student_fee_assignments`
--
ALTER TABLE `student_fee_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_fee_unique` (`student_id`,`fee_structure_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_fee_structure` (`fee_structure_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_student_semester_status` (`student_id`,`semester`,`status`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`,`user_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `user_announcement_reads`
--
ALTER TABLE `user_announcement_reads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_announcement` (`user_id`,`user_type`,`announcement_id`),
  ADD KEY `idx_user` (`user_id`,`user_type`),
  ADD KEY `idx_announcement` (`announcement_id`),
  ADD KEY `idx_read_status` (`is_read`),
  ADD KEY `idx_read_at` (`read_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `announcement_delivery_status`
--
ALTER TABLE `announcement_delivery_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=355;

--
-- AUTO_INCREMENT for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `bus_routes`
--
ALTER TABLE `bus_routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `complaint_comments`
--
ALTER TABLE `complaint_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `fee_categories`
--
ALTER TABLE `fee_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `fee_collections`
--
ALTER TABLE `fee_collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `fee_structures`
--
ALTER TABLE `fee_structures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `fee_types`
--
ALTER TABLE `fee_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_divisions`
--
ALTER TABLE `staff_divisions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `staff_grades`
--
ALTER TABLE `staff_grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `staff_ledger`
--
ALTER TABLE `staff_ledger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `staff_wallets`
--
ALTER TABLE `staff_wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `student_fee_assignments`
--
ALTER TABLE `student_fee_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=273;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `todos`
--
ALTER TABLE `todos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_announcement_reads`
--
ALTER TABLE `user_announcement_reads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`);

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`),
  ADD CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`);

--
-- Constraints for table `divisions`
--
ALTER TABLE `divisions`
  ADD CONSTRAINT `divisions_ibfk_1` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `divisions_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_divisions_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `fee_collections`
--
ALTER TABLE `fee_collections`
  ADD CONSTRAINT `fee_collections_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `fee_collections_ibfk_2` FOREIGN KEY (`fee_type_id`) REFERENCES `fee_types` (`id`),
  ADD CONSTRAINT `fee_collections_ibfk_3` FOREIGN KEY (`collected_by`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_fee_collections_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `grades`
--
ALTER TABLE `grades`
  ADD CONSTRAINT `fk_grades_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  ADD CONSTRAINT `staff_assignments_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_assignments_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_assignments_ibfk_3` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_assignments_ibfk_4` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff_divisions`
--
ALTER TABLE `staff_divisions`
  ADD CONSTRAINT `staff_divisions_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_divisions_ibfk_2` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff_grades`
--
ALTER TABLE `staff_grades`
  ADD CONSTRAINT `staff_grades_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_grades_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff_ledger`
--
ALTER TABLE `staff_ledger`
  ADD CONSTRAINT `staff_ledger_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`),
  ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`),
  ADD CONSTRAINT `students_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`),
  ADD CONSTRAINT `students_ibfk_4` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
