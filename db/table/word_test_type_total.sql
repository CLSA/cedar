CREATE TABLE word_test_type_total (
  word_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  aft_total int(10) unsigned NOT NULL DEFAULT 0,
  fas_total int(10) unsigned NOT NULL DEFAULT 0,
  rey_total int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (word_id),
  KEY dk_aft_total (aft_total),
  KEY dk_fas_total (fas_total),
  KEY dk_rey_total (rey_total),
  CONSTRAINT fk_word_test_type_total_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
