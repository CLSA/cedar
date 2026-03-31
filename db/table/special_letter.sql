CREATE TABLE special_letter (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  language_id INT(10) UNSIGNED NOT NULL,
  letter CHAR(1) CHARACTER SET 'utf8' NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_language_id_letter (language_id ASC, letter ASC),
  INDEX fk_language_id (language_id ASC),
  CONSTRAINT fk_special_letter_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
