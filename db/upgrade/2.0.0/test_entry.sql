SELECT "Create new test_entry table" AS "";

CREATE TABLE IF NOT EXISTS test_entry (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  transcription_id INT UNSIGNED NOT NULL,
  test_type_id INT UNSIGNED NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX fk_transcription_id (transcription_id ASC),
  INDEX fk_test_type_id (test_type_id ASC),
  UNIQUE INDEX uq_transcription_test_type_id (transcription_id ASC, test_type_id ASC),
  CONSTRAINT fk_test_entry_transcription_id
    FOREIGN KEY (transcription_id)
    REFERENCES transcription (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
