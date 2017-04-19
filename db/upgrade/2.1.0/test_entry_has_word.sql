SELECT "Create new test_entry_has_word table" AS "";

CREATE TABLE IF NOT EXISTS test_entry_has_word (
  test_entry_id INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (test_entry_id, word_id),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_test_entry_id1_idx (test_entry_id ASC),
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
ENGINE = InnoDB;
