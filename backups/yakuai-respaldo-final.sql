-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: yakuai
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auditable_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_foreign` (`user_id`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crop_stages`
--

DROP TABLE IF EXISTS `crop_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crop_stages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `crop_id` bigint unsigned NOT NULL,
  `stage` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `days` int unsigned NOT NULL,
  `kc` decimal(4,2) NOT NULL,
  `root_depth_m` decimal(5,2) NOT NULL,
  `depletion_fraction` decimal(4,2) NOT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `crop_stages_crop_id_stage_version_unique` (`crop_id`,`stage`,`version`),
  CONSTRAINT `crop_stages_crop_id_foreign` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crop_stages`
--

LOCK TABLES `crop_stages` WRITE;
/*!40000 ALTER TABLE `crop_stages` DISABLE KEYS */;
INSERT INTO `crop_stages` VALUES (1,1,'ini',25,0.50,0.40,0.35,1,'2026-10-21 04:43:28','2026-10-21 04:43:28'),(2,1,'des',30,0.80,0.50,0.35,1,'2026-10-21 04:43:28','2026-10-21 04:43:28'),(3,1,'med',40,1.15,0.60,0.35,1,'2026-10-21 04:43:28','2026-10-21 04:43:28'),(4,1,'fin',30,0.75,0.60,0.35,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(5,2,'ini',25,0.30,1.00,0.55,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(6,2,'des',40,0.75,1.30,0.55,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(7,2,'med',45,1.20,1.70,0.55,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(8,2,'fin',30,0.35,1.70,0.55,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(9,3,'ini',20,0.50,0.50,0.45,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(10,3,'des',30,0.85,0.60,0.45,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(11,3,'med',35,1.15,0.70,0.45,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(12,3,'fin',15,0.30,0.70,0.45,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(13,4,'ini',20,0.70,0.50,0.35,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(14,4,'des',30,0.90,0.65,0.35,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(15,4,'med',50,1.05,0.80,0.35,1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(16,4,'fin',20,0.95,0.80,0.35,1,'2026-10-21 04:43:29','2026-10-21 04:43:29');
/*!40000 ALTER TABLE `crop_stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crops`
--

DROP TABLE IF EXISTS `crops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crops` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scientific_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `crops_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crops`
--

LOCK TABLES `crops` WRITE;
/*!40000 ALTER TABLE `crops` DISABLE KEYS */;
INSERT INTO `crops` VALUES (1,'papa','Papa','Solanum tuberosum',1,'2026-10-21 04:43:28','2026-10-21 04:43:28'),(2,'maiz','Maíz choclo','Zea mays',1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(3,'haba','Haba seca','Vicia faba',1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(4,'zanahoria','Zanahoria','Daucus carota',1,'2026-10-21 04:43:29','2026-10-21 04:43:29');
/*!40000 ALTER TABLE `crops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plot_id` bigint unsigned NOT NULL,
  `evaluated_at` datetime NOT NULL,
  `stage` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inputs_snapshot` json NOT NULL,
  `result` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_liters` decimal(10,2) DEFAULT NULL,
  `max_liters` decimal(10,2) DEFAULT NULL,
  `confidence` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `next_at` datetime DEFAULT NULL,
  `is_critical` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `evaluations_plot_id_evaluated_at_unique` (`plot_id`,`evaluated_at`),
  KEY `evaluations_plot_id_evaluated_at_index` (`plot_id`,`evaluated_at`),
  CONSTRAINT `evaluations_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farmers`
--

DROP TABLE IF EXISTS `farmers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmers`
--

LOCK TABLES `farmers` WRITE;
/*!40000 ALTER TABLE `farmers` DISABLE KEYS */;
INSERT INTO `farmers` VALUES (1,'Sim Félix Huamán','999111222',1,'2026-10-21 04:43:34','2026-10-21 04:43:34'),(2,'Sim María Poma','999333444',1,'2026-10-21 04:43:34','2026-10-21 04:43:34'),(3,'Sim Juan Quispe','999555666',1,'2026-10-21 04:43:34','2026-10-21 04:43:34');
/*!40000 ALTER TABLE `farmers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forecasts`
--

DROP TABLE IF EXISTS `forecasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forecasts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plot_id` bigint unsigned NOT NULL,
  `fetched_at` datetime NOT NULL,
  `issued_at` datetime DEFAULT NULL,
  `period_from` datetime NOT NULL,
  `period_to` datetime NOT NULL,
  `temp_max` decimal(5,2) DEFAULT NULL,
  `temp_min` decimal(5,2) DEFAULT NULL,
  `rain_mm` decimal(8,2) NOT NULL DEFAULT '0.00',
  `rain_prob` decimal(4,2) NOT NULL DEFAULT '0.00',
  `raw_json` json DEFAULT NULL,
  `origin` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'owm',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `forecasts_plot_id_fetched_at_index` (`plot_id`,`fetched_at`),
  CONSTRAINT `forecasts_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forecasts`
--

LOCK TABLES `forecasts` WRITE;
/*!40000 ALTER TABLE `forecasts` DISABLE KEYS */;
INSERT INTO `forecasts` VALUES (1,1,'2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 10:43:34',24.00,12.00,0.00,0.20,'{\"demo\": true, \"simulacion\": true}','demo','2026-10-21 04:43:34','2026-10-21 04:43:34'),(2,2,'2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 10:43:34',24.00,12.00,0.00,0.20,'{\"demo\": true, \"simulacion\": true}','demo','2026-10-21 04:43:34','2026-10-21 04:43:34'),(3,3,'2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 10:43:34',24.00,12.00,0.00,0.20,'{\"demo\": true, \"simulacion\": true}','demo','2026-10-21 04:43:34','2026-10-21 04:43:34'),(4,4,'2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 04:43:34','2026-10-21 10:43:34',24.00,12.00,0.00,0.20,'{\"demo\": true, \"simulacion\": true}','demo','2026-10-21 04:43:34','2026-10-21 04:43:34');
/*!40000 ALTER TABLE `forecasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `irrigations`
--

DROP TABLE IF EXISTS `irrigations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `irrigations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plot_id` bigint unsigned NOT NULL,
  `evaluation_id` bigint unsigned DEFAULT NULL,
  `supersedes_id` bigint unsigned DEFAULT NULL,
  `occurred_at` datetime NOT NULL,
  `recommended_liters` decimal(10,2) DEFAULT NULL,
  `applied_liters` decimal(10,2) NOT NULL,
  `origin` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `irrigations_evaluation_id_foreign` (`evaluation_id`),
  KEY `irrigations_supersedes_id_foreign` (`supersedes_id`),
  KEY `irrigations_plot_id_occurred_at_index` (`plot_id`,`occurred_at`),
  CONSTRAINT `irrigations_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `irrigations_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `irrigations_supersedes_id_foreign` FOREIGN KEY (`supersedes_id`) REFERENCES `irrigations` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `irrigations`
--

LOCK TABLES `irrigations` WRITE;
/*!40000 ALTER TABLE `irrigations` DISABLE KEYS */;
/*!40000 ALTER TABLE `irrigations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `measurements`
--

DROP TABLE IF EXISTS `measurements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `measurements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sensor_id` bigint unsigned NOT NULL,
  `plot_id` bigint unsigned NOT NULL,
  `measured_at` datetime NOT NULL,
  `raw_value` decimal(10,2) NOT NULL,
  `norm_value` decimal(8,2) DEFAULT NULL,
  `quality` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ok',
  `origin` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `measurements_sensor_id_measured_at_unique` (`sensor_id`,`measured_at`),
  KEY `measurements_plot_id_measured_at_index` (`plot_id`,`measured_at`),
  CONSTRAINT `measurements_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `measurements_sensor_id_foreign` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `measurements`
--

LOCK TABLES `measurements` WRITE;
/*!40000 ALTER TABLE `measurements` DISABLE KEYS */;
INSERT INTO `measurements` VALUES (1,1,1,'2026-10-21 04:00:00',550.00,67.14,'ok','demo','2026-10-21 04:43:34','2026-10-21 04:43:34'),(2,2,2,'2026-10-21 04:00:00',700.00,45.71,'ok','demo','2026-10-21 04:43:34','2026-10-21 04:43:34'),(3,3,3,'2026-10-21 04:00:00',450.00,81.43,'ok','demo','2026-10-21 04:43:34','2026-10-21 04:43:34'),(4,4,4,'2026-10-21 04:00:00',650.00,52.86,'ok','demo','2026-10-21 04:43:34','2026-10-21 04:43:34');
/*!40000 ALTER TABLE `measurements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_22_031514_create_personal_access_tokens_table',1),(5,'2026_09_22_031859_add_role_pin_active_to_users_table',1),(6,'2026_09_22_032020_create_crops_table',1),(7,'2026_09_22_032021_create_crop_stages_table',1),(8,'2026_09_22_032023_create_soil_textures_table',1),(9,'2026_09_22_032150_create_farmers_table',1),(10,'2026_09_22_032151_create_plots_table',1),(11,'2026_09_22_033053_create_sensors_table',1),(12,'2026_09_22_033054_create_measurements_table',1),(13,'2026_09_22_033553_create_forecasts_table',1),(14,'2026_09_22_034330_add_farmer_id_to_users_table',1),(15,'2026_09_22_035331_create_evaluations_table',1),(16,'2026_09_22_040630_create_irrigations_table',1),(17,'2026_09_28_000000_add_phone_to_users_table',1),(18,'2026_09_28_100000_create_audit_logs_table',1),(19,'2026_09_28_110000_add_backup_code_to_users_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'web','737cd39f71d45097898ccf0f9fac9a528173041fd8bda7050d3cb50c05dc709b','[\"*\"]','2026-10-21 03:16:10','2026-10-21 09:38:55','2026-10-21 01:38:55','2026-10-21 03:16:10'),(2,'App\\Models\\User',1,'web','00e7371dd6cfde5d8551fe44701a07954380963b7e81b15a041cff95ca3f4f92','[\"*\"]','2026-10-21 05:29:49','2026-10-21 12:41:53','2026-10-21 04:41:53','2026-10-21 05:29:49');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plots`
--

DROP TABLE IF EXISTS `plots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint unsigned NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `boundary` json DEFAULT NULL,
  `area_m2` decimal(10,2) NOT NULL,
  `area_origin` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dibujo',
  `crop_id` bigint unsigned NOT NULL,
  `sowing_date` date NOT NULL,
  `soil_texture_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irrigation_system` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irrigation_efficiency` decimal(4,2) NOT NULL,
  `flow_lpm` decimal(8,2) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `plots_farmer_id_foreign` (`farmer_id`),
  KEY `plots_crop_id_foreign` (`crop_id`),
  KEY `plots_soil_texture_code_foreign` (`soil_texture_code`),
  CONSTRAINT `plots_crop_id_foreign` FOREIGN KEY (`crop_id`) REFERENCES `crops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plots_farmer_id_foreign` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plots_soil_texture_code_foreign` FOREIGN KEY (`soil_texture_code`) REFERENCES `soil_textures` (`code`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plots`
--

LOCK TABLES `plots` WRITE;
/*!40000 ALTER TABLE `plots` DISABLE KEYS */;
INSERT INTO `plots` VALUES (1,1,'Sim Parcela Alta',-12.0667000,-75.2833000,NULL,100.00,'manual',1,'2026-08-12','franco','goteo',0.90,20.00,'activa','2026-10-21 04:43:34','2026-10-21 04:43:34'),(2,1,'Sim Parcela Baja',-12.0680000,-75.2845000,NULL,200.00,'manual',2,'2026-09-01','franco_arenoso','gravedad',0.60,20.00,'activa','2026-10-21 04:43:34','2026-10-21 04:43:34'),(3,2,'Sim Huerto Haba',-12.0650000,-75.2820000,NULL,150.00,'manual',3,'2026-09-11','franco_arcilloso','aspersion',0.75,20.00,'activa','2026-10-21 04:43:34','2026-10-21 04:43:34'),(4,3,'Sim Zanahoria Norte',-12.0700000,-75.2860000,NULL,120.00,'manual',4,'2026-09-21','franco','goteo',0.90,20.00,'activa','2026-10-21 04:43:34','2026-10-21 04:43:34');
/*!40000 ALTER TABLE `plots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensors`
--

DROP TABLE IF EXISTS `sensors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plot_id` bigint unsigned NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'YL-69',
  `pin` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dry_ref` int DEFAULT NULL,
  `wet_ref` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ok',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sensors_plot_id_foreign` (`plot_id`),
  CONSTRAINT `sensors_plot_id_foreign` FOREIGN KEY (`plot_id`) REFERENCES `plots` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensors`
--

LOCK TABLES `sensors` WRITE;
/*!40000 ALTER TABLE `sensors` DISABLE KEYS */;
INSERT INTO `sensors` VALUES (1,1,'humedad','YL-69','A0',1020,320,'ok',1,'2026-10-21 04:43:34','2026-10-21 04:43:34'),(2,2,'humedad','YL-69','A0',1020,320,'ok',1,'2026-10-21 04:43:34','2026-10-21 04:43:34'),(3,3,'humedad','YL-69','A0',1020,320,'ok',1,'2026-10-21 04:43:34','2026-10-21 04:43:34'),(4,4,'humedad','YL-69','A0',1020,320,'ok',1,'2026-10-21 04:43:34','2026-10-21 04:43:34');
/*!40000 ALTER TABLE `sensors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `soil_textures`
--

DROP TABLE IF EXISTS `soil_textures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soil_textures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_capacity` decimal(5,3) NOT NULL,
  `wilting_point` decimal(5,3) NOT NULL,
  `source` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FAO-56/Saxton-Rawls referencia',
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `soil_textures_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soil_textures`
--

LOCK TABLES `soil_textures` WRITE;
/*!40000 ALTER TABLE `soil_textures` DISABLE KEYS */;
INSERT INTO `soil_textures` VALUES (1,'arenoso','Arenoso',0.120,0.060,'FAO-56/Saxton-Rawls referencia',1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(2,'franco_arenoso','Franco arenoso',0.200,0.100,'FAO-56/Saxton-Rawls referencia',1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(3,'franco','Franco',0.270,0.120,'FAO-56/Saxton-Rawls referencia',1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(4,'franco_arcilloso','Franco arcilloso',0.320,0.180,'FAO-56/Saxton-Rawls referencia',1,'2026-10-21 04:43:29','2026-10-21 04:43:29'),(5,'arcilloso','Arcilloso',0.350,0.200,'FAO-56/Saxton-Rawls referencia',1,'2026-10-21 04:43:29','2026-10-21 04:43:29');
/*!40000 ALTER TABLE `soil_textures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tecnico',
  `pin_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `backup_code` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `farmer_id` bigint unsigned DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_farmer_id_foreign` (`farmer_id`),
  CONSTRAINT `users_farmer_id_foreign` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrador','admin@yakuai.local',NULL,'$2y$12$NwHhii2sqi3D1FmLkC6U0O1cAIegj1grSqazZuQrrD1xTcyX40E.G','admin',NULL,NULL,NULL,NULL,1,NULL,'2026-10-21 01:38:28','2026-10-21 01:38:28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'yakuai'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-22  4:05:13
