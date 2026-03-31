CREATE TABLE word (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  language_id INT(10) UNSIGNED NOT NULL,
  word VARCHAR(65) CHARACTER SET 'utf8' NOT NULL,
  animal_code VARCHAR(45) NULL DEFAULT NULL,
  sister_word_id INT(10) UNSIGNED NULL DEFAULT NULL,
  misspelled TINYINT(1) NULL DEFAULT NULL,
  aft ENUM('invalid', 'intrusion', 'primary') NULL DEFAULT NULL,
  fas ENUM('invalid', 'intrusion', 'primary') NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_language_id_word (language_id ASC, word ASC),
  INDEX fk_language_id (language_id ASC),
  INDEX fk_sister_word_id (sister_word_id ASC),
  INDEX dk_animal_code (animal_code ASC),
  CONSTRAINT fk_word_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_word_sister_word_id
    FOREIGN KEY (sister_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
