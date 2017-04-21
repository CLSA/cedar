SELECT "Creating new rey_data_has_word table" AS "";

CREATE TABLE IF NOT EXISTS rey_data_has_word (
  rey_data_id INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (rey_data_id, word_id),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_rey_data_id (rey_data_id ASC),
  UNIQUE INDEX uq_rey_data_id_word_id (rey_data_id ASC, word_id ASC),
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
ENGINE = InnoDB;
