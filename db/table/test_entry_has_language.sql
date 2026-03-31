CREATE TABLE test_entry_has_language (
  test_entry_id INT(10) UNSIGNED NOT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (test_entry_id, language_id),
  INDEX fk_language_id (language_id ASC),
  INDEX fk_test_entry_id (test_entry_id ASC),
  CONSTRAINT fk_test_entry_has_language_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_entry_has_language_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
