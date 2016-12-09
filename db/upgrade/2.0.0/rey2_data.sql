SELECT "Creating new rey2_data table" AS "";

CREATE TABLE IF NOT EXISTS rey2_data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_entry_id INT UNSIGNED NOT NULL,
  value TINYINT(1) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX `uq_test_entry_id` (`test_entry_id` ASC),
  CONSTRAINT fk_rey2_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
