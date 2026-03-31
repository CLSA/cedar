CREATE TRIGGER test_entry_AFTER_UPDATE
AFTER UPDATE ON cedar.test_entry FOR EACH ROW
BEGIN
  IF NEW.state != OLD.state THEN
    IF "assigned" != NEW.state THEN
      UPDATE test_entry_activity
      SET end_datetime = UTC_TIMESTAMP()
      WHERE test_entry_id = NEW.id
      AND end_datetime IS NULL;
    END IF;
    
    SELECT
      COUNT( IF( state="deferred", true, NULL ) ),
      COUNT( IF( state="assigned", true, NULL ) ),
      COUNT( IF( state="submitted", true, NULL ) )
    INTO @deferred, @assigned, @submitted
    FROM test_entry
    WHERE transcription_id = NEW.transcription_id;