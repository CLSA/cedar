SELECT "Create new test_entry table" AS "";

CREATE TABLE IF NOT EXISTS test_entry (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  transcription_id INT UNSIGNED NOT NULL,
  test_type_id INT UNSIGNED NOT NULL,
  audio_status ENUM('salvable', 'unusable', 'unavailable') NULL DEFAULT NULL,
  participant_status ENUM('suspected prompt', 'prompted', 'prompt middle', 'prompt end', 'refused') NULL DEFAULT NULL,
  state ENUM('assigned', 'deferred', 'submitted') NOT NULL DEFAULT 'assigned',
  PRIMARY KEY (id),
  INDEX fk_transcription_id (transcription_id ASC),
  INDEX fk_test_type_id (test_type_id ASC),
  UNIQUE INDEX uq_transcription_test_type_id (transcription_id ASC, test_type_id ASC),
  INDEX dk_state (state ASC),
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
  IF NEW.state != OLD.state THEN
    -- close any open activity if the test entry is no longer assigned
    IF "assigned" != NEW.state THEN
      UPDATE test_entry_activity
      SET end_datetime = UTC_TIMESTAMP()
      WHERE test_entry_id = NEW.id
      AND end_datetime IS NULL;
    END IF;

    -- set the parent transcription's state, user_id and end_datetime based on its test_entries' states
    SELECT COUNT( IF( state="deferred", true, NULL ) ),
           COUNT( IF( state="assigned", true, NULL ) ),
           COUNT( IF( state="submitted", true, NULL ) )
    INTO @deferred, @assigned, @submitted
    FROM test_entry
    WHERE transcription_id = NEW.transcription_id;

    UPDATE transcription
    SET assigned_count = @assigned,
        deferred_count = @deferred,
        submitted_count = @submitted,
        -- user stays the same if deferred or assigned, and is cleared if not
        user_id = IF( 0 < @deferred OR 0 < @assigned, user_id, NULL ),
        -- end datetime is cleared if deferred or assigned, and stays the same or set to now if null when completed
        end_datetime = IF( 0 < @deferred OR 0 < @assigned, NULL, IFNULL( end_datetime, UTC_TIMESTAMP() ) )
    WHERE id = NEW.transcription_id;
  END IF;
END$$

DELIMITER ;
