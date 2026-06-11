CREATE TABLE test_type_has_status_type (
  test_type_id int(10) unsigned NOT NULL,
  status_type_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (test_type_id,status_type_id),
  KEY fk_status_type_id (status_type_id),
  KEY fk_test_type_id (test_type_id),
  CONSTRAINT fk_test_type_has_status_type_status_type_id
    FOREIGN KEY (status_type_id)
    REFERENCES status_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_type_has_status_type_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;