SELECT "Creating new word table" AS "";

CREATE TABLE IF NOT EXISTS word (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  dictionary_id INT UNSIGNED NOT NULL,
  word VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_dictionary_id (dictionary_id ASC),
  UNIQUE INDEX uq_dictionary_id_word (dictionary_id ASC, word ASC),
  CONSTRAINT fk_word_dictionary_id
    FOREIGN KEY (dictionary_id)
    REFERENCES dictionary (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
