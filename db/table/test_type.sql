CREATE TABLE test_type (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  rank int(10) unsigned NOT NULL,
  name varchar(45) NOT NULL,
  data_type enum('aft','fas','mat','premat','rey') NOT NULL,
  description text DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  UNIQUE KEY uq_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;