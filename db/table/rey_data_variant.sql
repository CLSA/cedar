CREATE TABLE rey_data_variant (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  word enum('drum','curtain','bell','coffee','school','parent','moon','garden','hat','farmer','nose','turkey','colour','house','river') NOT NULL,
  language_id int(10) unsigned NOT NULL,
  word_id int(10) unsigned NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_word_language_id_word_id (word,language_id,word_id),
  KEY fk_language_id (language_id),
  KEY fk_word_id (word_id),
  CONSTRAINT fk_rey_data_variant_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_variant_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
