SELECT "Create new word_has_word table" AS "";

CREATE TABLE IF NOT EXISTS word_has_word (
  word_id INT UNSIGNED NOT NULL,
  alt_word_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (word_id, alt_word_id),
  INDEX fk_alt_word_id (alt_word_id ASC),
  INDEX fk_word_id (word_id ASC),
  UNIQUE INDEX uq_word_id_alt_word_id (word_id ASC, alt_word_id ASC),
  CONSTRAINT fk_word_has_word_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_word_has_word_alt_word_id
    FOREIGN KEY (alt_word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
COMMENT = 'AKA: animal groups';
