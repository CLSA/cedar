SELECT "Creating new fas_data table" AS "";

CREATE TABLE IF NOT EXISTS fas_data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_entry_id INT UNSIGNED NOT NULL,
  rank INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX uq_test_entry_id_rank (test_entry_id ASC, rank ASC),
  INDEX fk_word_id (word_id ASC),
  CONSTRAINT fk_fas_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_fas_data_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
