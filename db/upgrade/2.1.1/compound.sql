SELECT "Create new compound table" AS "";

CREATE TABLE IF NOT EXISTS compound (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  sub_word_id INT UNSIGNED NOT NULL,
  rank INT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_sub_word_id (sub_word_id ASC),
  UNIQUE INDEX uq_word_id_rank (word_id ASC, rank ASC),
  CONSTRAINT fk_compound_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_compound_sub_word_id
    FOREIGN KEY (sub_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
