-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for kaja
CREATE DATABASE IF NOT EXISTS `kaja` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `kaja`;

-- Dumping structure for table kaja.auth_group
DROP TABLE IF EXISTS `auth_group`;
CREATE TABLE IF NOT EXISTS `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.auth_group: ~0 rows (approximately)

-- Dumping structure for table kaja.auth_group_permissions
DROP TABLE IF EXISTS `auth_group_permissions`;
CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.auth_group_permissions: ~0 rows (approximately)

-- Dumping structure for table kaja.auth_permission
DROP TABLE IF EXISTS `auth_permission`;
CREATE TABLE IF NOT EXISTS `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.auth_permission: ~28 rows (approximately)
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
	(1, 'Can add log entry', 1, 'add_logentry'),
	(2, 'Can change log entry', 1, 'change_logentry'),
	(3, 'Can delete log entry', 1, 'delete_logentry'),
	(4, 'Can view log entry', 1, 'view_logentry'),
	(5, 'Can add permission', 3, 'add_permission'),
	(6, 'Can change permission', 3, 'change_permission'),
	(7, 'Can delete permission', 3, 'delete_permission'),
	(8, 'Can view permission', 3, 'view_permission'),
	(9, 'Can add group', 2, 'add_group'),
	(10, 'Can change group', 2, 'change_group'),
	(11, 'Can delete group', 2, 'delete_group'),
	(12, 'Can view group', 2, 'view_group'),
	(13, 'Can add user', 4, 'add_user'),
	(14, 'Can change user', 4, 'change_user'),
	(15, 'Can delete user', 4, 'delete_user'),
	(16, 'Can view user', 4, 'view_user'),
	(17, 'Can add content type', 5, 'add_contenttype'),
	(18, 'Can change content type', 5, 'change_contenttype'),
	(19, 'Can delete content type', 5, 'delete_contenttype'),
	(20, 'Can view content type', 5, 'view_contenttype'),
	(21, 'Can add session', 6, 'add_session'),
	(22, 'Can change session', 6, 'change_session'),
	(23, 'Can delete session', 6, 'delete_session'),
	(24, 'Can view session', 6, 'view_session'),
	(25, 'Can add producto', 7, 'add_producto'),
	(26, 'Can change producto', 7, 'change_producto'),
	(27, 'Can delete producto', 7, 'delete_producto'),
	(28, 'Can view producto', 7, 'view_producto');

-- Dumping structure for table kaja.auth_user
DROP TABLE IF EXISTS `auth_user`;
CREATE TABLE IF NOT EXISTS `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.auth_user: ~1 rows (approximately)
INSERT INTO `auth_user` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`) VALUES
	(1, 'pbkdf2_sha256$1200000$7QkaP6kBznmFpwIDzTteYH$mdE37+uZ8Y/2PLrt/vWBDnUWLWeBzdnnJh6vJW0Iv1w=', '2026-07-20 17:51:01.977136', 1, 'admin', '', '', 'admin@kaja.com', 1, 1, '2026-07-20 17:49:41.954236');

-- Dumping structure for table kaja.auth_user_groups
DROP TABLE IF EXISTS `auth_user_groups`;
CREATE TABLE IF NOT EXISTS `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.auth_user_groups: ~0 rows (approximately)

-- Dumping structure for table kaja.auth_user_user_permissions
DROP TABLE IF EXISTS `auth_user_user_permissions`;
CREATE TABLE IF NOT EXISTS `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.auth_user_user_permissions: ~0 rows (approximately)

-- Dumping structure for table kaja.django_admin_log
DROP TABLE IF EXISTS `django_admin_log`;
CREATE TABLE IF NOT EXISTS `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.django_admin_log: ~2 rows (approximately)
INSERT INTO `django_admin_log` (`id`, `action_time`, `object_id`, `object_repr`, `action_flag`, `change_message`, `content_type_id`, `user_id`) VALUES
	(1, '2026-07-20 17:52:49.991858', '1', 'Mouse Logitech G203', 1, '[{"added": {}}]', 7, 1),
	(2, '2026-07-20 17:55:03.878093', '1', 'Mouse Logitech G203', 3, '', 7, 1),
	(3, '2026-07-20 18:10:32.848315', '2', 'Mouse Logitech G203', 1, '[{"added": {}}]', 7, 1);

-- Dumping structure for table kaja.django_content_type
DROP TABLE IF EXISTS `django_content_type`;
CREATE TABLE IF NOT EXISTS `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.django_content_type: ~6 rows (approximately)
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
	(1, 'admin', 'logentry'),
	(2, 'auth', 'group'),
	(3, 'auth', 'permission'),
	(4, 'auth', 'user'),
	(5, 'contenttypes', 'contenttype'),
	(7, 'productos', 'producto'),
	(6, 'sessions', 'session');

-- Dumping structure for table kaja.django_migrations
DROP TABLE IF EXISTS `django_migrations`;
CREATE TABLE IF NOT EXISTS `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.django_migrations: ~18 rows (approximately)
INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
	(1, 'contenttypes', '0001_initial', '2026-07-20 17:41:01.401910'),
	(2, 'auth', '0001_initial', '2026-07-20 17:41:02.028522'),
	(3, 'admin', '0001_initial', '2026-07-20 17:41:02.182058'),
	(4, 'admin', '0002_logentry_remove_auto_add', '2026-07-20 17:41:02.189339'),
	(5, 'admin', '0003_logentry_add_action_flag_choices', '2026-07-20 17:41:02.197304'),
	(6, 'contenttypes', '0002_remove_content_type_name', '2026-07-20 17:41:02.276897'),
	(7, 'auth', '0002_alter_permission_name_max_length', '2026-07-20 17:41:02.398465'),
	(8, 'auth', '0003_alter_user_email_max_length', '2026-07-20 17:41:02.420585'),
	(9, 'auth', '0004_alter_user_username_opts', '2026-07-20 17:41:02.427566'),
	(10, 'auth', '0005_alter_user_last_login_null', '2026-07-20 17:41:02.488714'),
	(11, 'auth', '0006_require_contenttypes_0002', '2026-07-20 17:41:02.493900'),
	(12, 'auth', '0007_alter_validators_add_error_messages', '2026-07-20 17:41:02.501751'),
	(13, 'auth', '0008_alter_user_username_max_length', '2026-07-20 17:41:02.576594'),
	(14, 'auth', '0009_alter_user_last_name_max_length', '2026-07-20 17:41:02.647780'),
	(15, 'auth', '0010_alter_group_name_max_length', '2026-07-20 17:41:02.668857'),
	(16, 'auth', '0011_update_proxy_permissions', '2026-07-20 17:41:02.676252'),
	(17, 'auth', '0012_alter_user_first_name_max_length', '2026-07-20 17:41:02.744106'),
	(18, 'sessions', '0001_initial', '2026-07-20 17:41:02.785005'),
	(19, 'productos', '0001_initial', '2026-07-20 17:44:50.537734');

-- Dumping structure for table kaja.django_session
DROP TABLE IF EXISTS `django_session`;
CREATE TABLE IF NOT EXISTS `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.django_session: ~1 rows (approximately)
INSERT INTO `django_session` (`session_key`, `session_data`, `expire_date`) VALUES
	('4zazsze0jz8ryqpe6fumrnwk9k8x2dnn', '.eJxVjDsOwjAQRO_iGlnrv6Gk5wzW2rvBAeRIcVIh7o4spYBqpHlv5i0S7ltNe-c1zSQuQonTb5exPLkNQA9s90WWpW3rnOVQ5EG7vC3Er-vh_h1U7HWsg7VojAOTQfkpFq2tQo6BY3QcrC8E7EiTiVAMTmWkzg7An102KD5fyiU3Xg:1wls8r:k3Zc6LPGVYbC1NHFdeIDzJaxOggDXtvGRq_BxpPT5JE', '2026-08-03 17:51:01.981430');

-- Dumping structure for table kaja.empresas
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE IF NOT EXISTS `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `nit` varchar(50) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_empresas_nit` (`nit`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.empresas: ~0 rows (approximately)
INSERT INTO `empresas` (`id`, `nombre`, `nit`, `activo`, `fecha_creacion`) VALUES
	(1, 'KAJA Empresa Principal', '900000001-1', 1, '2026-08-31 18:33:18');

-- Dumping structure for table kaja.productos_producto
DROP TABLE IF EXISTS `productos_producto`;
CREATE TABLE IF NOT EXISTS `productos_producto` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `empresa_id` int DEFAULT NULL,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` longtext NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_EMPRESA_CODIGO` (`empresa_id`,`codigo`),
  CONSTRAINT `fk_productos_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.productos_producto: ~18 rows (approximately)
INSERT INTO `productos_producto` (`id`, `empresa_id`, `codigo`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `fecha_creacion`) VALUES
	(27, 1, 'P003', 'Monitor Samsung 24', '', 520000.00, 13, 1, '2026-08-31 19:05:12.286571'),
	(28, 1, 'P004', 'Memoria USB Kingston 32GB', '', 28000.00, 40, 1, '2026-08-31 19:05:12.286571'),
	(29, 1, 'P005', 'Disco SSD Kingston 480GB', '', 180000.00, 12, 1, '2026-08-31 19:05:12.286571'),
	(30, 1, 'P006', 'Disco Duro Seagate 1TB', '', 160000.00, 10, 1, '2026-08-31 19:05:12.286571'),
	(31, 1, 'P007', 'Memoria RAM DDR4 8GB', '', 95000.00, 20, 1, '2026-08-31 19:05:12.286571'),
	(32, 1, 'P008', 'Cable HDMI Premium', '', 18000.00, 35, 1, '2026-08-31 19:05:12.286571'),
	(33, 1, 'P010', 'Webcam HD 1080P', '', 120000.00, 11, 1, '2026-08-31 19:05:12.286571'),
	(34, 1, 'P011', 'Impresora HP Multifuncional', '', 650000.00, 5, 1, '2026-08-31 19:05:12.286571'),
	(35, 1, 'P012', 'Router TP-Link', '', 130000.00, 9, 1, '2026-08-31 19:05:12.286571'),
	(36, 1, 'P013', 'Cable USB Tipo C', '', 15000.00, 40, 1, '2026-08-31 19:05:12.286571'),
	(37, 1, 'P014', 'Cargador Universal', '', 35000.00, 30, 1, '2026-08-31 19:05:12.286571'),
	(38, 1, 'P015', 'Parlante Bluetooth', '', 90000.00, 14, 1, '2026-08-31 19:05:12.286571'),
	(39, 1, 'P017', 'Laptop Lenovo IdeaPad', '', 1800000.00, 3, 1, '2026-08-31 19:05:12.286571'),
	(40, 1, 'P018', 'Mouse Gamer RGB', '', 110000.00, 15, 1, '2026-08-31 19:05:12.286571'),
	(41, 1, 'P019', 'Teclado Mecánico RGB', '', 220000.00, 6, 1, '2026-08-31 19:05:12.286571'),
	(42, 1, 'P021', 'SOPORTE PANTALLA', '', 45000.00, 17, 1, '2026-08-31 19:05:12.286571'),
	(43, 1, 'P022', 'Mouse Logitech', '', 90000.00, 10, 1, '2026-08-31 19:05:12.286571'),
	(44, 1, 'P030', 'Monitor LG 27', '', 780000.00, 5, 1, '2026-08-31 19:05:12.286571'),
	(45, NULL, 'TEST001', 'Producto de prueba KAJA', 'Producto para validar multiempresa', 10000.00, 5, 1, '2026-09-05 18:16:59.000000'),
	(46, 1, 'TEST002', 'Producto de prueba KAJA 2', 'Prueba de empresa_id', 15000.00, 5, 1, '2026-09-05 18:23:08.000000'),
	(55, 1, 'TEST004', 'Prueba de rol', 'Prueba de permisos ADMINISTRADOR', 10000.00, 1, 1, '2026-09-05 20:15:58.000000');

-- Dumping structure for table kaja.productos_producto_backup
DROP TABLE IF EXISTS `productos_producto_backup`;
CREATE TABLE IF NOT EXISTS `productos_producto_backup` (
  `id` bigint NOT NULL DEFAULT '0',
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` longtext NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.productos_producto_backup: ~18 rows (approximately)
INSERT INTO `productos_producto_backup` (`id`, `codigo`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `fecha_creacion`) VALUES
	(5, 'P003', 'Monitor Samsung 24', 'Monitor LED Full HD', 520000.00, 13, 1, '2026-07-20 14:28:54.000000'),
	(6, 'P004', 'Memoria USB Kingston 32GB', 'Unidad flash USB 3.0', 28000.00, 40, 1, '2026-07-20 14:28:54.000000'),
	(7, 'P005', 'Disco SSD Kingston 480GB', 'Unidad almacenamiento SSD', 180000.00, 12, 1, '2026-07-20 14:28:54.000000'),
	(8, 'P006', 'Disco Duro Seagate 1TB', 'Disco mecánico SATA', 160000.00, 10, 1, '2026-07-20 14:28:54.000000'),
	(9, 'P007', 'Memoria RAM DDR4 8GB', 'Memoria para computador', 95000.00, 20, 1, '2026-07-20 14:28:54.000000'),
	(10, 'P008', 'Cable HDMI 2 metros', 'Cable video alta definición', 18000.00, 35, 1, '2026-07-20 14:28:54.000000'),
	(12, 'P010', 'Webcam HD 1080P', 'Cámara para videollamadas', 120000.00, 11, 1, '2026-07-20 14:28:54.000000'),
	(13, 'P011', 'Impresora HP Multifuncional', 'Impresora tinta continua', 650000.00, 5, 1, '2026-07-20 14:28:54.000000'),
	(14, 'P012', 'Router TP-Link', 'Router inalámbrico WiFi', 130000.00, 9, 1, '2026-07-20 14:28:54.000000'),
	(15, 'P013', 'Cable USB Tipo C', 'Cable carga rápida', 15000.00, 40, 1, '2026-07-20 14:28:54.000000'),
	(16, 'P014', 'Cargador Universal', 'Adaptador corriente', 35000.00, 30, 1, '2026-07-20 14:28:54.000000'),
	(17, 'P015', 'Parlante Bluetooth', 'Altavoz portátil', 90000.00, 14, 1, '2026-07-20 14:28:54.000000'),
	(19, 'P017', 'Laptop Lenovo IdeaPad', 'Computador portátil', 1800000.00, 3, 1, '2026-07-20 14:28:54.000000'),
	(20, 'P018', 'Mouse Gamer RGB', 'Mouse gaming iluminación', 110000.00, 15, 1, '2026-07-20 14:28:54.000000'),
	(21, 'P019', 'Teclado Mecánico RGB', 'Teclado gamer mecánico', 220000.00, 6, 1, '2026-07-20 14:28:54.000000'),
	(23, 'P021', 'SOPORTE PANTALLA', 'Soporte para pantalla o monitor', 45000.00, 17, 1, '2026-07-20 19:53:57.731740'),
	(24, 'P022', 'Mouse Logitech', 'Mouse inalámbrico', 90000.00, 10, 1, '2026-07-26 22:25:20.000000'),
	(25, 'P030', 'Monitor LG 27', 'Monitor IPS 27 pulgadas', 780000.00, 5, 1, '2026-07-26 22:56:43.000000');

-- Dumping structure for table kaja.usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int DEFAULT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMINISTRADOR','CAJERO') NOT NULL DEFAULT 'CAJERO',
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `fk_usuarios_empresa` (`empresa_id`),
  CONSTRAINT `fk_usuarios_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table kaja.usuarios: ~1 rows (approximately)
INSERT INTO `usuarios` (`id`, `empresa_id`, `usuario`, `password`, `rol`, `activo`) VALUES
	(1, 1, 'admin', '$2b$10$sRgGqRmvOlA1z6QMTwIji.kW794M54WgMX7A4869qqDDqTrAzv8tO', 'ADMINISTRADOR', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
