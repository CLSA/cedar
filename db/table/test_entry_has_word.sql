CREATE TABLE test_entry_has_word (
  test_entry_id INT(10) UNSIGNED NOT NULL,
  word_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (test_entry_id, word_id),
  UNIQUE INDEX uq_test_entry_id_word_id (test_entry_id ASC, word_id ASC),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_test_entry_id (test_entry_id ASC),
  CONSTRAINT fk_test_entry_has_word_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_has_word_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
