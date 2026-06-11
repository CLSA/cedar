CREATE TABLE rey_data_has_word (
  rey_data_id int(10) unsigned NOT NULL,
  word_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (rey_data_id,word_id),
  UNIQUE KEY uq_rey_data_id_word_id (rey_data_id,word_id),
  KEY fk_word_id (word_id),
  KEY fk_rey_data_id (rey_data_id),
  CONSTRAINT fk_rey_data_has_word_rey_data_id
    FOREIGN KEY (rey_data_id)
    REFERENCES rey_data (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_rey_data_has_word_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;