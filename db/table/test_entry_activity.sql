CREATE TABLE test_entry_activity (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  test_entry_id int(10) unsigned NOT NULL,
  user_id int(10) unsigned NOT NULL,
  start_datetime datetime NOT NULL,
  end_datetime datetime DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_test_entry_id (test_entry_id),
  KEY fk_user_id (user_id),
  KEY dk_start_datetime (start_datetime),
  KEY dk_end_datetime (end_datetime),
  CONSTRAINT fk_test_entry_activity_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_activity_user_id
    FOREIGN KEY (user_id)
    REFERENCES cenozo.user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
