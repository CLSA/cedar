CREATE TABLE status_type (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  category enum('audio','participant','admin') NOT NULL,
  rank int(10) unsigned NOT NULL,
  name varchar(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_rank (category,rank),
  UNIQUE KEY uq_category_name (category,name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
