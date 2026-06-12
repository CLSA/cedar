CREATE TABLE homophone (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  first_word_id int(10) unsigned NOT NULL,
  word_id int(10) unsigned NOT NULL,
  rank int(11) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_first_word_id_rank (first_word_id,rank),
  UNIQUE KEY uq_word_id (word_id),
  KEY fk_first_word_id (first_word_id),
  KEY fk_word_id (word_id),
  CONSTRAINT fk_homophone_first_word_id
    FOREIGN KEY (first_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_homophone_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
