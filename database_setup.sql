SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
CREATE DATABASE church;
USE church;
CREATE USER 'church'@'localhost' IDENTIFIED BY 'church';
FLUSH PRIVILEGES;
ALTER USER 'church'@'localhost' IDENTIFIED WITH mysql_native_password BY 'church';
FLUSH PRIVILEGES;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;


CREATE TABLE `authors` (
  `id` int NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `books` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `carriers` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `events` (
  `id` int NOT NULL,
  `title` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_member_private` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `make_a_meal` (
  `id` int NOT NULL,
  `request_id` int NOT NULL,
  `uuid` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `date` date NOT NULL,
  `details` varchar(500) COLLATE utf8_bin NOT NULL,
  `first_name` varchar(500) COLLATE utf8_bin DEFAULT NULL,
  `last_name` varchar(500) COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `make_a_meal_request` (
  `id` int NOT NULL,
  `uuid` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `first_name` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `last_name` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `phone` varchar(250) COLLATE utf8_bin DEFAULT NULL COMMENT 'Recipients Phone',
  `address` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT 'Recipients Address',
  `allergies` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT 'Food Allergies',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `passage` (
  `id` int NOT NULL,
  `book_id` int NOT NULL,
  `chapter` int NOT NULL,
  `verse` int NOT NULL,
  `start` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `pass_reset` (
  `id` int NOT NULL,
  `uuid` varchar(200) COLLATE utf8_bin NOT NULL,
  `token` varchar(250) COLLATE utf8_bin NOT NULL,
  `expiration_date` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `prayer_requests` (
  `id` int NOT NULL,
  `uuid` varchar(100) COLLATE utf8_bin NOT NULL,
  `first_name` varchar(10000) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `last_name` varchar(10000) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `request` text CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `is_private` tinyint(1) NOT NULL,
  `notification_sent` tinyint(1) NOT NULL COMMENT 'Indicates that notification for the prayer request has been sent.',
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `prayer_request_interactions` (
  `id` int NOT NULL,
  `prayer_request_id` int NOT NULL,
  `uuid` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `reading` (
  `id` int NOT NULL,
  `authors_id` int NOT NULL,
  `title` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `link` varchar(3096) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `series` (
  `id` int NOT NULL,
  `name` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sermon` (
  `id` int NOT NULL,
  `speaker_id` int NOT NULL,
  `service_id` int NOT NULL,
  `series_id` int NOT NULL,
  `video_id` int DEFAULT NULL,
  `passage_start_id` int DEFAULT NULL,
  `passage_end_id` int DEFAULT NULL,
  `title` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `date` date NOT NULL,
  `file` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `count` int DEFAULT NULL,
  `duration` varchar(10) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `service` (
  `id` int NOT NULL,
  `name` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `expires` int UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8 COLLATE utf8_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sm_registration` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `number_of_registrants` int NOT NULL,
  `registration_max_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sm_registration_max` (
  `id` int NOT NULL,
  `max_registrations` int NOT NULL,
  `remaining_registrations` int NOT NULL,
  `attendance_date` date NOT NULL,
  `type` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sm_registration_type` (
  `id` int NOT NULL,
  `type` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `speaker` (
  `id` int NOT NULL,
  `first_name` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `last_name` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `users` (
  `id` int NOT NULL,
  `first_name` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `last_name` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `phone` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `carrier_id` int DEFAULT NULL,
  `email` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `password` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `text_alerts` tinyint(1) NOT NULL,
  `is_admin` tinyint(1) NOT NULL,
  `is_approved` int NOT NULL COMMENT '0 - Pending, 1 - Approved, 2 - Disapproved',
  `alerts` tinyint(1) NOT NULL,
  `uuid` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `videos` (
  `id` int NOT NULL,
  `url` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `embedded_url` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `title` varchar(500) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `livestream` tinyint(1) DEFAULT NULL,
  `private` tinyint(1) DEFAULT NULL,
  `daily_devo_id` int DEFAULT NULL,
  `tag` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `videos_daily_devos` (
  `id` int NOT NULL,
  `name` varchar(350) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `videos_tag` (
  `id` int NOT NULL,
  `tag` varchar(250) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


ALTER TABLE `authors`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `carriers`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `make_a_meal`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `make_a_meal_request`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `passage`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `pass_reset`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `prayer_requests`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `prayer_request_interactions`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `reading`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `series`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sermon`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `service`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

ALTER TABLE `sm_registration`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sm_registration_max`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sm_registration_type`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `speaker`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `videos_daily_devos`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `videos_tag`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `authors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `books`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `carriers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `events`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `make_a_meal`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `make_a_meal_request`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `passage`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `pass_reset`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `prayer_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `prayer_request_interactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `reading`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `series`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `sermon`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `service`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `sm_registration`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `sm_registration_max`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `sm_registration_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `speaker`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `videos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `videos_daily_devos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `videos_tag`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
  
GRANT ALL PRIVILEGES ON church.* TO 'church'@'localhost';
FLUSH PRIVILEGES;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;