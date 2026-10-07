-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 07, 2026 at 04:20 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vet_clinic_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `dog_id` int(10) UNSIGNED NOT NULL,
  `service_id` int(10) UNSIGNED NOT NULL,
  `staff_id` int(10) UNSIGNED DEFAULT NULL,
  `slot_id` int(10) UNSIGNED DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status_id` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `owner_id`, `dog_id`, `service_id`, `staff_id`, `slot_id`, `appointment_date`, `appointment_time`, `status_id`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, NULL, NULL, '2026-09-29', '17:30:00', 2, NULL, '2026-09-29 04:13:15', '2026-09-29 04:38:27'),
(2, 1, 2, 1, NULL, NULL, '2026-11-04', '08:00:00', 2, NULL, '2026-10-03 17:51:56', '2026-10-06 07:09:25'),
(3, 2, 1, 2, NULL, NULL, '2026-12-05', '16:00:00', 4, NULL, '2026-10-06 07:09:00', '2026-10-06 07:37:24'),
(4, 1, 2, 3, NULL, NULL, '2026-10-06', '15:30:00', 2, NULL, '2026-10-06 07:17:40', '2026-10-06 07:18:01');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_status`
--

CREATE TABLE `appointment_status` (
  `status_id` tinyint(3) UNSIGNED NOT NULL,
  `status_name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointment_status`
--

INSERT INTO `appointment_status` (`status_id`, `status_name`) VALUES
(4, 'Cancelled'),
(3, 'Completed'),
(2, 'Confirmed'),
(5, 'No-show'),
(1, 'Requested');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba', 'i:2;', 1791271157),
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1791271157;', 1791271157),
('laravel-cache-firebase.public-keys', 'a:1:{s:4:\"keys\";a:4:{i:0;a:6:{s:1:\"e\";s:4:\"AQAB\";s:1:\"n\";s:342:\"nuMAOlWEfqN32QfV9KGO90Nnx86CK0IKbf6rMtige3rpT1bkvkxYcjYe8FRADMPloIqOPD3g6ZtKAC2GbwdMm845timNthK9k04vkXIJaLajVJQ28QX-brErTJWNRJ4SoAqYdw_gDvnWmRQbua6QjAP7UR8oiUgk-GSOeeWYkgVdMzZtgBNQ4Mn4mSVLBHvD3-0DmPST7W2gktxbrD-ynCLHbyt5EjX5gqQxlSdKtDmx6qtEdRQwEwHkt0C4DzF6A7N4qy4HVCaZhWC8BEqOXY8N9xS0HrsnbB6KcnslFSXPSXm5ZSN2_5eHyI1UCcm-zadhXXASZ4t0CwNacwZRHQ\";s:3:\"kty\";s:3:\"RSA\";s:3:\"alg\";s:5:\"RS256\";s:3:\"kid\";s:40:\"801d4a207307b4f356acdb85ca717ee7ba0dbf7e\";s:3:\"use\";s:3:\"sig\";}i:1;a:6:{s:1:\"e\";s:4:\"AQAB\";s:1:\"n\";s:342:\"xjqmMMlV0qnLXojG6X2RtTKGkxUniG8tzhjdim96rGb_gDjxrhm1uQHxcfGLJGZc7Vi2CES_tcB4ANUVR_XqbjDhAW0oHr-x3WcWr50cVbWXjcPlt8LR19IUtAWA856fDcLRL3THgbvkbWDQlw3oQJjWkxRA1UUGunE-LLMJgbhyta4OCftfikZV4T6AVY8olPupEoCkfaAXd4n_BVDRw6S3lKvOwvDk3NzyaKCid-WIqVBICVrJ2pj3SZF-OG11C47AVqprsYl9FDdY9hCBehbahRQ74bYx23j-htoOld1s2vvKde7Ig81nHoZhcMbUzIwDCRRGFPRFnWYCYkDtTQ\";s:3:\"kid\";s:40:\"ad5e98c04148bd50dd025ff2e5bde7abdaacce11\";s:3:\"use\";s:3:\"sig\";s:3:\"alg\";s:5:\"RS256\";s:3:\"kty\";s:3:\"RSA\";}i:2;a:6:{s:3:\"alg\";s:5:\"RS256\";s:1:\"e\";s:4:\"AQAB\";s:1:\"n\";s:342:\"22q04PsB_qjo1bTqdpfXmf3UOOP0GFivY8NTX3B8cTM1gVxHL4bpJw20Lrl2a5fJteO1zbKMx3UKShYKQlB5lgIgStDh9QSuLtt5vVCWFFIIdHW1ssm7622F5qRT973-JGxVLLPPkJlOjoqbgawQ7Q0MKJZM8CBwoepwoCv4loMBnlQhrQqG6MHv5L1i1D5_y1neOILobbFPCfoxdO0Xg1vGKqeU0ohdcU7V3IT1OZ45XkznsCEffVCm91WwmjWuRrZh1xJ3Zsy5euHn0EPB68PsUe11SpZsNMszfB1WCb7luDade3i_u8K2azaxfwnEUqm1eS07re9CQQOnKY7wxw\";s:3:\"kty\";s:3:\"RSA\";s:3:\"kid\";s:40:\"904b0f91be6eb0867dabbaab587dfc2e33f00a24\";s:3:\"use\";s:3:\"sig\";}i:3;a:6:{s:3:\"kty\";s:3:\"RSA\";s:3:\"alg\";s:5:\"RS256\";s:3:\"use\";s:3:\"sig\";s:3:\"kid\";s:40:\"6f7de798eee8a24ebade6f228411220c8669010d\";s:1:\"e\";s:4:\"AQAB\";s:1:\"n\";s:342:\"4o6lOQoZ-McfWfLlklcpqDrd5aD1G9WV9jdKApQuKnibAzUe4IhjRpihcR0p1UWBL_6Y848N9JKNxhuXX_5BNkfSYGKpq0iBAZ6A1_mdoiQX2N1LFrNhKE_xyCM6RFyRoV2sy8Rr-Y047nBOToAQxtRH5XUzxq44CKp4AY69NOBs4mVtEH025_MjxZvKxsQ9G2CoNhj1bFdyu6SRpx5xixouSPSrLXgNNle3Tw0H5mVicdDb6qgSjfeUwybruCkFM97ea7gv0Ktn2oPHMftaozP7vMZ4D0WoPDIy71Q40T5KxuzFg3p23DXa8LVLq54DN0aBYI5MHyeMEC-StgnSAw\";}}}', 1791274339),
('laravel-cache-frontdesk@example.com|127.0.0.1', 'i:1;', 1791382659),
('laravel-cache-frontdesk@example.com|127.0.0.1:timer', 'i:1791382659;', 1791382659),
('laravel-cache-justinekylenecesario5@gmail.com|127.0.0.1', 'i:3;', 1791263589),
('laravel-cache-justinekylenecesario5@gmail.com|127.0.0.1:timer', 'i:1791263589;', 1791263589);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clinic_info`
--

CREATE TABLE `clinic_info` (
  `clinic_id` int(10) UNSIGNED NOT NULL,
  `clinic_name` varchar(150) NOT NULL,
  `address_line` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email` varchar(150) NOT NULL,
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  `days_open` varchar(100) NOT NULL DEFAULT 'Monday-Saturday',
  `logo_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clinic_info`
--

INSERT INTO `clinic_info` (`clinic_id`, `clinic_name`, `address_line`, `city`, `province`, `zip_code`, `contact_number`, `email`, `opening_time`, `closing_time`, `days_open`, `logo_url`, `created_at`, `updated_at`) VALUES
(1, 'MyVet Animal Clinic', '1 Bark Street', 'Polomolok', 'South Cotabato', '9504', '09170000000', 'hello@myvet.test', '08:00:00', '18:00:00', 'Monday-Saturday', NULL, '2026-09-28 17:21:07', '2026-10-06 06:37:56');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `complaint_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `appointment_id` int(10) UNSIGNED DEFAULT NULL,
  `subject` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `status` enum('Open','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  `assigned_to` int(10) UNSIGNED DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dogs`
--

CREATE TABLE `dogs` (
  `dog_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `dog_name` varchar(100) NOT NULL,
  `breed_id` smallint(5) UNSIGNED DEFAULT NULL,
  `sex` enum('Male','Female','Unknown') NOT NULL DEFAULT 'Unknown',
  `birth_date` date DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `is_vaccinated` tinyint(1) NOT NULL DEFAULT 0,
  `photo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dogs`
--

INSERT INTO `dogs` (`dog_id`, `owner_id`, `dog_name`, `breed_id`, `sex`, `birth_date`, `weight_kg`, `color`, `is_vaccinated`, `photo_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 'Rex', 5, 'Male', NULL, NULL, NULL, 0, NULL, 1, '2026-09-28 17:21:10', '2026-09-28 17:21:10'),
(2, 1, 'Rex', NULL, 'Unknown', NULL, NULL, NULL, 0, NULL, 1, '2026-10-03 17:51:18', '2026-10-03 17:51:18');

-- --------------------------------------------------------

--
-- Table structure for table `dog_breeds`
--

CREATE TABLE `dog_breeds` (
  `breed_id` smallint(5) UNSIGNED NOT NULL,
  `breed_name` varchar(100) NOT NULL,
  `size_category` enum('Toy','Small','Medium','Large','Giant') NOT NULL DEFAULT 'Medium'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dog_breeds`
--

INSERT INTO `dog_breeds` (`breed_id`, `breed_name`, `size_category`) VALUES
(1, 'Aspin (Mixed Breed)', 'Medium'),
(2, 'Chihuahua', 'Toy'),
(3, 'Shih Tzu', 'Small'),
(4, 'Poodle', 'Small'),
(5, 'Labrador Retriever', 'Large'),
(6, 'Golden Retriever', 'Large'),
(7, 'German Shepherd', 'Large'),
(8, 'Great Dane', 'Giant');

-- --------------------------------------------------------

--
-- Table structure for table `dog_owners`
--

CREATE TABLE `dog_owners` (
  `owner_id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `profile_photo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dog_owners`
--

INSERT INTO `dog_owners` (`owner_id`, `first_name`, `last_name`, `email`, `password_hash`, `phone_number`, `address`, `profile_photo_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Justine', 'Kyle Necesario', 'justinekylenecesario5@gmail.com', '$2y$12$HUjZuoVK1DT.8rpyUHIzTu6PvQtBjIa1UGrLNEM3TgPA/1N7pNZue', '09856031595', 'french street', NULL, 1, '2026-09-28 17:20:37', '2026-10-03 17:50:49'),
(2, 'Kevin', 'Owner', 'owner@example.com', '$2y$12$8v8Lfoi0TVKOL6jibnNWEOMtsVtKd0T1OEqOVqcRwqdy5P9/mlIUG', '09171234567', '1 Bark Street', NULL, 1, '2026-09-28 17:21:10', '2026-10-06 07:34:33');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `faq_id` int(10) UNSIGNED NOT NULL,
  `faq_category_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED DEFAULT NULL,
  `question` varchar(255) NOT NULL,
  `answer` text NOT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faq_categories`
--

CREATE TABLE `faq_categories` (
  `faq_category_id` int(10) UNSIGNED NOT NULL,
  `category_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faq_categories`
--

INSERT INTO `faq_categories` (`faq_category_id`, `category_name`) VALUES
(4, 'Account'),
(2, 'Billing'),
(1, 'Bookings'),
(3, 'Visits');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_sessions_and_password_reset_tokens_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_09_21_000001_create_clinic_info_table', 1),
(5, '2026_09_21_000002_create_appointment_status_table', 1),
(6, '2026_09_21_000003_create_dog_breeds_table', 1),
(7, '2026_09_21_000004_create_service_categories_table', 1),
(8, '2026_09_21_000005_create_payment_methods_table', 1),
(9, '2026_09_21_000006_create_faq_categories_table', 1),
(10, '2026_09_21_000007_create_staff_table', 1),
(11, '2026_09_21_000008_create_dog_owners_table', 1),
(12, '2026_09_21_000009_create_services_table', 1),
(13, '2026_09_21_000010_create_time_slots_table', 1),
(14, '2026_09_21_000011_create_dogs_table', 1),
(15, '2026_09_21_000012_create_appointments_table', 1),
(16, '2026_09_21_000013_create_payments_table', 1),
(17, '2026_09_21_000014_create_notifications_table', 1),
(18, '2026_09_21_000015_create_ratings_feedback_table', 1),
(19, '2026_09_21_000016_create_complaints_table', 1),
(20, '2026_09_21_000017_create_faqs_table', 1),
(21, '2026_09_21_000018_create_reports_table', 1),
(22, '2026_10_06_000001_add_image_path_to_services_and_staff', 2),
(23, '2026_10_07_000001_update_staff_profiles_and_faq_ownership', 3);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `appointment_id` int(10) UNSIGNED DEFAULT NULL,
  `channel` enum('SMS','Email','Push') NOT NULL DEFAULT 'SMS',
  `message` varchar(320) NOT NULL,
  `status` enum('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(10) UNSIGNED NOT NULL,
  `appointment_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `method_id` tinyint(3) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status` enum('Pending','Paid','Refunded','Failed') NOT NULL DEFAULT 'Pending',
  `gateway_reference` varchar(150) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `method_id` tinyint(3) UNSIGNED NOT NULL,
  `method_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`method_id`, `method_name`) VALUES
(4, 'Bank Transfer'),
(2, 'Card'),
(1, 'Cash'),
(3, 'GCash');

-- --------------------------------------------------------

--
-- Table structure for table `ratings_feedback`
--

CREATE TABLE `ratings_feedback` (
  `feedback_id` int(10) UNSIGNED NOT NULL,
  `appointment_id` int(10) UNSIGNED NOT NULL,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `staff_id` int(10) UNSIGNED DEFAULT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `report_id` int(10) UNSIGNED NOT NULL,
  `generated_by` int(10) UNSIGNED NOT NULL,
  `report_type` enum('Appointments','Revenue','Services','Notifications','Custom') NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `service_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `service_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` smallint(5) UNSIGNED NOT NULL DEFAULT 30,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`service_id`, `category_id`, `service_name`, `description`, `price`, `duration_minutes`, `is_active`, `created_at`, `updated_at`, `image_path`) VALUES
(1, 2, 'Vaccination for worms', 'Protect your pet from internal parasites with our comprehensive deworming treatments.', 5000.00, 30, 1, '2026-09-29 04:12:17', '2026-10-06 06:32:14', NULL),
(2, 3, 'Hair Cut', 'Keep your pet looking and feeling their best with our professional grooming services. Our experienced stylists provide custom haircuts tailored to your pet\'s breed and coat type, along with a soothing bath, nail trim, and ear cleaning', 800.00, 60, 1, '2026-10-06 05:15:01', '2026-10-06 06:31:58', NULL),
(3, 3, 'Bath and Dry', 'Cleans the coat with pet-safe shampoo and dries it to remove dirt, loose hair, and odors.', 500.00, 30, 1, '2026-10-06 06:28:06', '2026-10-06 06:28:06', NULL),
(4, 3, 'Nail Trimming', 'Cuts or files claws to a healthy length to prevent cracking, splitting, and painful overgrowth.', 900.00, 30, 1, '2026-10-06 06:28:34', '2026-10-06 06:28:34', NULL),
(5, 2, 'Anti-Rabies Vaccination', 'Administration of immunizations to protect pets from fatal, contagious viral diseases like rabies, parvovirus, and distemper.', 1200.00, 15, 1, '2026-10-06 06:29:37', '2026-10-06 06:29:37', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `category_id` int(10) UNSIGNED NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Consultation', 'Check-ups and general visits'),
(2, 'Vaccination', 'Immunisation and boosters'),
(3, 'Grooming', 'Bathing, trimming, and nail care'),
(4, 'Surgery', 'Procedures performed under anaesthesia'),
(5, 'Diagnostics', 'Laboratory work and imaging');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('2PByfzgoalu27ZwlTePfTY2ymIsFZU91cyjqolXI', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUjR5MnJzUnk3MzNFRFJSSUp1OGJEQnp5bDN2Z3FEV0lLSFJ6MWJiViI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9yZWdpc3RlciI7czo1OiJyb3V0ZSI7czo4OiJyZWdpc3RlciI7fX0=', 1791273206),
('bfSrRycWSkioYwwiOhM4jVyzlo6z37Y83CxMNbEP', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiS2lHMXoyVGhrYWdudGxnM0VlWVdSTXlDbWQxcERXUllEbDd4VEhLTSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbiI7czo1OiJyb3V0ZSI7czoxNToiYWRtaW4uZGFzaGJvYXJkIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MjoibG9naW5fc3RhZmZfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToxO30=', 1791382795),
('dKazV6Al0XIniaNQKBP4NPD4y1b8IwvXidsklnSQ', 2, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiZDluSHk2MGJYZk5DWk13bm1nRjNBRXlNajBwV09iWWRtaDY5eDlrZSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9wb3J0YWwvc2VydmljZXMiO3M6NToicm91dGUiO3M6MjA6Im93bmVyLnNlcnZpY2VzLmluZGV4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MjoibG9naW5fb3duZXJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToyO30=', 1791273162),
('LAzJpomG3D6gGVVyCB8pTjgCeGzli2nmcoDfzil2', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVUJyWk5qV0cyZTlhbDY0RmRtOUhFYXVwYnFlV1ZXd1lRTDIxbXZKZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODEyMyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1791266944),
('sG38y8vVnxUPkinGRkt4iLGqHP4ojBC0RiQrZVHr', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiekthSTBVSmcwTFhYSW9SYXlMa203dW8yanVtamJsV2ZaT0VlTWhVNCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NTI6ImxvZ2luX293bmVyXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTt9', 1791271097),
('YaJRKsB5gvTqr0qpleoGr9uI0kXBJcfyY9qhiRSv', NULL, '127.0.0.1', 'curl/8.7.1', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoieFJSNXRwWjdOR0ZvS3lsdzJEcEI4NjhHMmo3bEh5cW9nR0JIQWIwWSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODEyMyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1791266903);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(10) UNSIGNED NOT NULL,
  `clinic_id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `role` enum('veterinarian','admin','groomer') NOT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `background` text DEFAULT NULL,
  `experience_years` smallint(5) UNSIGNED DEFAULT NULL,
  `qualifications` text DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `clinic_id`, `first_name`, `last_name`, `email`, `password_hash`, `phone_number`, `role`, `specialization`, `background`, `experience_years`, `qualifications`, `license_number`, `is_active`, `created_at`, `updated_at`, `image_path`) VALUES
(1, 1, 'Clinic', 'Administrator', 'admin@example.com', '$2y$12$OtswBVe8ZoGIMStfV8j9JeKbEqrX9bJJvKvxdVRk30f7T3xKDISMi', NULL, 'admin', NULL, NULL, NULL, NULL, NULL, 1, '2026-09-28 17:21:08', '2026-09-28 17:21:08', NULL),
(2, 1, 'Front', 'Desk', 'frontdesk@example.com', '$2y$12$kjySHf4jBUdLp6GReQeVPubBU0195aVUP.4Rf8fKdC/wAbA8qnGpO', NULL, '', NULL, NULL, NULL, NULL, NULL, 1, '2026-09-28 17:21:09', '2026-09-28 17:21:09', NULL),
(3, 1, 'Vet', 'Oncalla', 'vet@example.com', '$2y$12$9DqPIPGCYCsVoydwe6f8F.VyCU7tgdk3CLpwReYlrQQkIc7HcHvSS', NULL, 'veterinarian', NULL, NULL, NULL, NULL, NULL, 1, '2026-09-28 17:21:09', '2026-09-28 17:21:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `time_slots`
--

CREATE TABLE `time_slots` (
  `slot_id` int(10) UNSIGNED NOT NULL,
  `staff_id` int(10) UNSIGNED NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `idx_appt_date` (`appointment_date`),
  ADD KEY `idx_appt_owner` (`owner_id`),
  ADD KEY `idx_appt_status` (`status_id`),
  ADD KEY `appointments_dog_id_foreign` (`dog_id`),
  ADD KEY `appointments_service_id_foreign` (`service_id`),
  ADD KEY `appointments_slot_id_foreign` (`slot_id`),
  ADD KEY `appointments_staff_id_foreign` (`staff_id`);

--
-- Indexes for table `appointment_status`
--
ALTER TABLE `appointment_status`
  ADD PRIMARY KEY (`status_id`),
  ADD UNIQUE KEY `appointment_status_status_name_unique` (`status_name`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `clinic_info`
--
ALTER TABLE `clinic_info`
  ADD PRIMARY KEY (`clinic_id`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`complaint_id`),
  ADD KEY `idx_complaint_priority` (`priority`),
  ADD KEY `idx_complaint_status` (`status`),
  ADD KEY `complaints_appointment_id_foreign` (`appointment_id`),
  ADD KEY `complaints_assigned_to_foreign` (`assigned_to`),
  ADD KEY `complaints_owner_id_foreign` (`owner_id`);

--
-- Indexes for table `dogs`
--
ALTER TABLE `dogs`
  ADD PRIMARY KEY (`dog_id`),
  ADD KEY `idx_dog_owner` (`owner_id`),
  ADD KEY `dogs_breed_id_foreign` (`breed_id`);

--
-- Indexes for table `dog_breeds`
--
ALTER TABLE `dog_breeds`
  ADD PRIMARY KEY (`breed_id`),
  ADD UNIQUE KEY `dog_breeds_breed_name_unique` (`breed_name`);

--
-- Indexes for table `dog_owners`
--
ALTER TABLE `dog_owners`
  ADD PRIMARY KEY (`owner_id`),
  ADD UNIQUE KEY `dog_owners_email_unique` (`email`),
  ADD KEY `idx_owner_phone` (`phone_number`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`faq_id`),
  ADD KEY `faqs_faq_category_id_foreign` (`faq_category_id`),
  ADD KEY `faqs_owner_id_foreign` (`owner_id`);

--
-- Indexes for table `faq_categories`
--
ALTER TABLE `faq_categories`
  ADD PRIMARY KEY (`faq_category_id`),
  ADD UNIQUE KEY `faq_categories_category_name_unique` (`category_name`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notif_status` (`status`),
  ADD KEY `notifications_appointment_id_foreign` (`appointment_id`),
  ADD KEY `notifications_owner_id_foreign` (`owner_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `payments_appointment_id_foreign` (`appointment_id`),
  ADD KEY `payments_method_id_foreign` (`method_id`),
  ADD KEY `payments_owner_id_foreign` (`owner_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`method_id`),
  ADD UNIQUE KEY `payment_methods_method_name_unique` (`method_name`);

--
-- Indexes for table `ratings_feedback`
--
ALTER TABLE `ratings_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD UNIQUE KEY `uq_feedback_appt` (`appointment_id`),
  ADD KEY `idx_feedback_rating` (`rating`),
  ADD KEY `ratings_feedback_owner_id_foreign` (`owner_id`),
  ADD KEY `ratings_feedback_staff_id_foreign` (`staff_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `reports_generated_by_foreign` (`generated_by`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`service_id`),
  ADD KEY `services_category_id_foreign` (`category_id`);

--
-- Indexes for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `service_categories_category_name_unique` (`category_name`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `staff_email_unique` (`email`),
  ADD KEY `staff_clinic_id_foreign` (`clinic_id`);

--
-- Indexes for table `time_slots`
--
ALTER TABLE `time_slots`
  ADD PRIMARY KEY (`slot_id`),
  ADD UNIQUE KEY `uq_staff_slot` (`staff_id`,`slot_date`,`start_time`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `appointment_status`
--
ALTER TABLE `appointment_status`
  MODIFY `status_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `clinic_info`
--
ALTER TABLE `clinic_info`
  MODIFY `clinic_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `complaint_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dogs`
--
ALTER TABLE `dogs`
  MODIFY `dog_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dog_breeds`
--
ALTER TABLE `dog_breeds`
  MODIFY `breed_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `dog_owners`
--
ALTER TABLE `dog_owners`
  MODIFY `owner_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `faq_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faq_categories`
--
ALTER TABLE `faq_categories`
  MODIFY `faq_category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `method_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ratings_feedback`
--
ALTER TABLE `ratings_feedback`
  MODIFY `feedback_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `service_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `time_slots`
--
ALTER TABLE `time_slots`
  MODIFY `slot_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_dog_id_foreign` FOREIGN KEY (`dog_id`) REFERENCES `dogs` (`dog_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`service_id`),
  ADD CONSTRAINT `appointments_slot_id_foreign` FOREIGN KEY (`slot_id`) REFERENCES `time_slots` (`slot_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `appointment_status` (`status_id`);

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `complaints_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `complaints_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE CASCADE;

--
-- Constraints for table `dogs`
--
ALTER TABLE `dogs`
  ADD CONSTRAINT `dogs_breed_id_foreign` FOREIGN KEY (`breed_id`) REFERENCES `dog_breeds` (`breed_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dogs_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE CASCADE;

--
-- Constraints for table `faqs`
--
ALTER TABLE `faqs`
  ADD CONSTRAINT `faqs_faq_category_id_foreign` FOREIGN KEY (`faq_category_id`) REFERENCES `faq_categories` (`faq_category_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `faqs_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_method_id_foreign` FOREIGN KEY (`method_id`) REFERENCES `payment_methods` (`method_id`),
  ADD CONSTRAINT `payments_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE CASCADE;

--
-- Constraints for table `ratings_feedback`
--
ALTER TABLE `ratings_feedback`
  ADD CONSTRAINT `ratings_feedback_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_feedback_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `dog_owners` (`owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_feedback_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE;

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`category_id`);

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_clinic_id_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `clinic_info` (`clinic_id`) ON DELETE CASCADE;

--
-- Constraints for table `time_slots`
--
ALTER TABLE `time_slots`
  ADD CONSTRAINT `time_slots_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
