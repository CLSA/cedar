CREATE TRIGGER test_entry_AFTER_UPDATE AFTER UPDATE ON test_entry FOR EACH ROW
BEGIN
  IF NEW.state != OLD.state THEN

    IF "assigned" != NEW.state THEN
      UPDATE test_entry_activity
      SET end_datetime = UTC_TIMESTAMP()
      WHERE test_entry_id = NEW.id
      AND end_datetime IS NULL;
    END IF;

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

        user_id = IF( 0 < @deferred OR 0 < @assigned, user_id, NULL ),

        end_datetime = IF( 0 < @deferred OR 0 < @assigned, NULL, IFNULL( end_datetime, UTC_TIMESTAMP() ) )
    WHERE id = NEW.transcription_id;
  END IF;
END ;;