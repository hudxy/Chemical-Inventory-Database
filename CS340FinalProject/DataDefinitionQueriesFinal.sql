-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: classmysql.engr.oregonstate.edu:3306
-- Generation Time: Feb 17, 2019 at 07:26 PM
-- Server version: 10.1.22-MariaDB
-- PHP Version: 7.0.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cs340_naml`
--

-- --------------------------------------------------------

--
-- Table structure for table `chemical`
--

CREATE TABLE `chemical` (
  `chemical_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL UNIQUE,
  `chemical_formula` varchar(255) NOT NULL,
  `molecular_weight` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `chemical`
--

INSERT INTO `chemical` (`chemical_id`, `name`, `chemical_formula`, `molecular_weight`) VALUES
(1, 'acetone', 'C3H6O', 58.08),
(2, 'ethanol', 'C2H5OH', 46.07),
(3, 'magnesium citrate', 'C6H6MgO7', 214.41),
(4, 'hydrochloric acid', 'HCl', 34.46);

-- --------------------------------------------------------

--
-- Table structure for table `chemical_in_container`
--

CREATE TABLE `chemical_in_container` (
  `chemical_id` int(11) NOT NULL,
  `container_barcode` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `chemical_in_container`
--

INSERT INTO `chemical_in_container` (`chemical_id`, `container_barcode`) VALUES
(1, 'C123'),
(3, 'C123'),
(2, 'C456');

-- --------------------------------------------------------

--
-- Table structure for table `container`
--

CREATE TABLE `container` (
  `container_barcode` varchar(255) NOT NULL,
  `container_type_id` int(11) NOT NULL,
  `concentration_uM` float DEFAULT NULL,
  `amount_uL` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `container`
--

INSERT INTO `container` (`container_barcode`, `container_type_id`, `concentration_uM`, `amount_uL`) VALUES
('C123', 1, 10.2, 500),
('C456', 2, 12.9, 100);

-- --------------------------------------------------------

--
-- Table structure for table `container_in_rack`
--

CREATE TABLE `container_in_rack` (
  `rack_barcode` varchar(255) NOT NULL,
  `container_barcode` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `container_in_rack`
--

INSERT INTO `container_in_rack` (`rack_barcode`, `container_barcode`) VALUES
('R123', 'C123'),
('R456', 'C456');

-- --------------------------------------------------------

--
-- Table structure for table `container_type`
--

CREATE TABLE `container_type` (
  `container_type_id` int(11) NOT NULL,
  `container_type_name` varchar(255) NOT NULL UNIQUE,
  `container_max_volume` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `container_type`
--

INSERT INTO `container_type` (`container_type_id`, `container_type_name`, `container_max_volume`) VALUES
(1, '1 ML VIAL', 1000),
(2, '4 ML VIAL', 4000),
(3, '6 ML VIAL', 6000);

-- --------------------------------------------------------

--
-- Table structure for table `rack`
--

CREATE TABLE `rack` (
  `rack_barcode` varchar(255) NOT NULL,
  `rack_type` int(11) NOT NULL,
  `cells_occupied` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `rack`
--

INSERT INTO `rack` (`rack_barcode`, `rack_type`, `cells_occupied`) VALUES
('R123', 1, 1),
('R456', 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `rack_type`
--

CREATE TABLE `rack_type` (
  `rack_type_id` int(11) NOT NULL,
  `rack_type_name` varchar(255) NOT NULL UNIQUE,
  `max_capacity` int(11) NOT NULL,
  `allowed_labware_type` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `rack_type`
--

INSERT INTO `rack_type` (`rack_type_id`, `rack_type_name`, `max_capacity`, `allowed_labware_type`) VALUES
(1, '1 ML RACK', 96, 1),
(2, '4 ML RACK', 24, 2),
(3, '6 ML RACK', 12, 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chemical`
--
ALTER TABLE `chemical`
  ADD PRIMARY KEY (`chemical_id`);

--
-- Indexes for table `chemical_in_container`
--
ALTER TABLE `chemical_in_container`
  ADD KEY `fk_chemical_id` (`chemical_id`),
  ADD KEY `fk_container_barcode` (`container_barcode`);

--
-- Indexes for table `container`
--
ALTER TABLE `container`
  ADD PRIMARY KEY (`container_barcode`),
  ADD KEY `fk_container_type` (`container_type_id`);

--
-- Indexes for table `container_in_rack`
--
ALTER TABLE `container_in_rack`
  ADD KEY `fk_rack_barcode` (`rack_barcode`),
  ADD KEY `fk_container_barcode_rack` (`container_barcode`);

--
-- Indexes for table `container_type`
--
ALTER TABLE `container_type`
  ADD PRIMARY KEY (`container_type_id`);

--
-- Indexes for table `rack`
--
ALTER TABLE `rack`
  ADD PRIMARY KEY (`rack_barcode`),
  ADD KEY `fk_rack_type_id` (`rack_type`);

--
-- Indexes for table `rack_type`
--
ALTER TABLE `rack_type`
  ADD PRIMARY KEY (`rack_type_id`),
  ADD KEY `fk_container_type_id` (`allowed_labware_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chemical`
--
ALTER TABLE `chemical`
  MODIFY `chemical_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `container_type`
--
ALTER TABLE `container_type`
  MODIFY `container_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rack_type`
--
ALTER TABLE `rack_type`
  MODIFY `rack_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chemical_in_container`
--
ALTER TABLE `chemical_in_container`
  ADD CONSTRAINT `fk_chemical_id` FOREIGN KEY (`chemical_id`) REFERENCES `chemical` (`chemical_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_container_barcode` FOREIGN KEY (`container_barcode`) REFERENCES `container` (`container_barcode`) ON DELETE CASCADE;

--
-- Constraints for table `container`
--
ALTER TABLE `container`
  ADD CONSTRAINT `fk_container_type` FOREIGN KEY (`container_type_id`) REFERENCES `container_type` (`container_type_id`) ON DELETE CASCADE;

--
-- Constraints for table `container_in_rack`
--
ALTER TABLE `container_in_rack`
  ADD CONSTRAINT `fk_container_barcode_rack` FOREIGN KEY (`container_barcode`) REFERENCES `container` (`container_barcode`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rack_barcode` FOREIGN KEY (`rack_barcode`) REFERENCES `rack` (`rack_barcode`) ON DELETE CASCADE;

--
-- Constraints for table `rack`
--
ALTER TABLE `rack`
  ADD CONSTRAINT `fk_rack_type_id` FOREIGN KEY (`rack_type`) REFERENCES `rack_type` (`rack_type_id`) ON DELETE CASCADE;

--
-- Constraints for table `rack_type`
--
ALTER TABLE `rack_type`
  ADD CONSTRAINT `fk_container_type_id` FOREIGN KEY (`allowed_labware_type`) REFERENCES `container_type` (`container_type_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
