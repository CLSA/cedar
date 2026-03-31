CREATE TABLE homophone (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  first_word_id INT(10) UNSIGNED NOT NULL,
  word_id INT(10) UNSIGNED NOT NULL,
  rank INT(11) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_first_word_id_rank (first_word_id ASC, rank ASC),
  UNIQUE INDEX uq_word_id (word_id ASC),
  INDEX fk_first_word_id (first_word_id ASC),
  INDEX fk_word_id (word_id ASC),
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
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
