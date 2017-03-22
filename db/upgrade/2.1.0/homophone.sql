SELECT "Create new homophone table" AS "";

CREATE TABLE IF NOT EXISTS homophone (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  first_word_id INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  rank INT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_first_word_id (first_word_id ASC),
  INDEX fk_word_id (word_id ASC),
  UNIQUE INDEX uq_first_word_id_rank (first_word_id ASC, rank ASC),
  UNIQUE INDEX uq_word_id (word_id ASC),
  CONSTRAINT fk_homophone_first_word_id
    FOREIGN KEY (first_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_homophone_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
