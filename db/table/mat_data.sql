CREATE TABLE mat_data (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  test_entry_id INT(10) UNSIGNED NOT NULL,
  rank INT(10) UNSIGNED NOT NULL,
  value VARCHAR(5) NOT NULL,
  sequence_rank INT(10) UNSIGNED NULL DEFAULT NULL COMMENT 'Used for scoring only',
  PRIMARY KEY (id),
  UNIQUE INDEX uq_test_entry_id_rank (test_entry_id ASC, rank ASC),
  INDEX fk_test_entry_id (test_entry_id ASC),
  CONSTRAINT fk_mat_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
