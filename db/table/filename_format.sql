CREATE TABLE filename_format (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  test_type_id int(10) unsigned NOT NULL,
  format varchar(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_type_id_format (test_type_id,format),
  KEY fk_test_type_id (test_type_id),
  CONSTRAINT fk_filename_format_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;