CREATE TABLE word (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  language_id int(10) unsigned NOT NULL,
  word varchar(65) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  animal_code varchar(45) DEFAULT NULL,
  sister_word_id int(10) unsigned DEFAULT NULL,
  misspelled tinyint(1) DEFAULT NULL,
  aft enum('invalid','intrusion','primary') DEFAULT NULL,
  fas enum('invalid','intrusion','primary') DEFAULT NULL,
  description text DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_language_id_word (language_id,word),
  KEY fk_language_id (language_id),
  KEY fk_sister_word_id (sister_word_id),
  KEY dk_animal_code (animal_code),
  CONSTRAINT fk_word_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_word_sister_word_id
    FOREIGN KEY (sister_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
