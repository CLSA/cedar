CREATE TABLE rey_data_has_word (
  rey_data_id INT(10) UNSIGNED NOT NULL,
  word_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (rey_data_id, word_id),
  UNIQUE INDEX uq_rey_data_id_word_id (rey_data_id ASC, word_id ASC),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_rey_data_id (rey_data_id ASC),
  CONSTRAINT fk_rey_data_has_word_rey_data_id
    FOREIGN KEY (rey_data_id)
    REFERENCES rey_data (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_rey_data_has_word_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
