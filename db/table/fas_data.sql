CREATE TABLE fas_data (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  test_entry_id INT(10) UNSIGNED NOT NULL,
  rank INT(10) UNSIGNED NOT NULL,
  word_id INT(10) UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_test_entry_id_rank (test_entry_id ASC, rank ASC),
  INDEX fk_test_entry_id (test_entry_id ASC),
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
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
