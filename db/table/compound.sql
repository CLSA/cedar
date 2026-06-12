CREATE TABLE compound (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  word_id int(10) unsigned NOT NULL,
  sub_word_id int(10) unsigned NOT NULL,
  rank int(11) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_word_id_rank (word_id,rank),
  KEY fk_word_id (word_id),
  KEY fk_sub_word_id (sub_word_id),
  CONSTRAINT fk_compound_sub_word_id
    FOREIGN KEY (sub_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_compound_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
