CREATE TABLE aft_data (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  test_entry_id int(10) unsigned NOT NULL,
  rank int(10) unsigned NOT NULL,
  word_id int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_entry_id_rank (test_entry_id,rank),
  KEY fk_test_entry_id (test_entry_id),
  KEY fk_word_id (word_id),
  CONSTRAINT fk_aft_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_aft_data_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
