SELECT "Create new word_test_entry_total table" AS "";

CREATE TABLE IF NOT EXISTS word_test_entry_total (
  word_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  total INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (word_id),
  INDEX dk_total (total ASC),
  CONSTRAINT fk_word_test_entry_total_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
