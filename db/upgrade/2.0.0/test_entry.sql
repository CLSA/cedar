SELECT "Create new test_entry table" AS "";

CREATE TABLE IF NOT EXISTS test_entry (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  transcription_id INT UNSIGNED NOT NULL,
  test_type_id INT UNSIGNED NOT NULL,
  submitted TINYINT(1) NOT NULL DEFAULT 0,
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

DELIMITER $$

DROP TRIGGER IF EXISTS test_entry_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_AFTER_UPDATE AFTER UPDATE ON test_entry FOR EACH ROW
BEGIN
  IF NEW.submitted != OLD.submitted THEN
    -- set parent transcription's end_datetime based on whether all test entries have been submitted
    SET @unsubmitted = (
      SELECT COUNT(*)
      FROM test_entry
      WHERE transcription_id = NEW.transcription_id
      AND submitted = 0
    );
    UPDATE transcription
    SET end_datetime = IF( @unsubmitted, NULL, UTC_TIMESTAMP() )
    WHERE id = NEW.transcription_id;
  END IF;
END$$

DELIMITER ;
