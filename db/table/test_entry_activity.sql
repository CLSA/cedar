CREATE TABLE test_entry_activity (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  test_entry_id INT(10) UNSIGNED NOT NULL,
  user_id INT(10) UNSIGNED NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX dk_start_datetime (start_datetime ASC),
  INDEX dk_end_datetime (end_datetime ASC),
  CONSTRAINT fk_test_entry_activity_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_activity_user_id
    FOREIGN KEY (user_id)
    REFERENCES cenozo.user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
