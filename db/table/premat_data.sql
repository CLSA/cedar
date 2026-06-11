CREATE TABLE premat_data (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  test_entry_id int(10) unsigned NOT NULL,
  counting tinyint(1) DEFAULT NULL,
  alphabet tinyint(1) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_entry_id (test_entry_id),
  KEY fk_test_entry_id (test_entry_id),
  CONSTRAINT fk_premat_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;