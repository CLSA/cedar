CREATE TABLE test_entry_note (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  test_entry_id INT(10) UNSIGNED NOT NULL,
  user_id INT(10) UNSIGNED NOT NULL,
  sticky TINYINT(1) NOT NULL DEFAULT 0,
  datetime DATETIME NOT NULL,
  note TEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX dk_datetime (datetime ASC),
  CONSTRAINT fk_test_entry_note_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_note_user_id
    FOREIGN KEY (user_id)
    REFERENCES cenozo.user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
