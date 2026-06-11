CREATE TABLE test_entry_has_word (
  test_entry_id int(10) unsigned NOT NULL,
  word_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (test_entry_id,word_id),
  UNIQUE KEY uq_test_entry_id_word_id (test_entry_id,word_id),
  KEY fk_word_id (word_id),
  KEY fk_test_entry_id (test_entry_id),
  CONSTRAINT fk_test_entry_has_word_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_has_word_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;