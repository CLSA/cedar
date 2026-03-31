CREATE TABLE rey_data_variant (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  word ENUM('drum', 'curtain', 'bell', 'coffee', 'school', 'parent', 'moon', 'garden', 'hat', 'farmer', 'nose', 'turkey', 'colour', 'house', 'river') NOT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  word_id INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_word_language_id_word_id (word ASC, language_id ASC, word_id ASC),
  INDEX fk_language_id (language_id ASC),
  INDEX fk_word_id (word_id ASC),
  CONSTRAINT fk_rey_data_variant_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_variant_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
