CREATE TABLE compound (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  word_id INT(10) UNSIGNED NOT NULL,
  sub_word_id INT(10) UNSIGNED NOT NULL,
  rank INT(11) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_word_id_rank (word_id ASC, rank ASC),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_sub_word_id (sub_word_id ASC),
  CONSTRAINT fk_compound_sub_word_id
    FOREIGN KEY (sub_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_compound_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
