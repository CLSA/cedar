CREATE TRIGGER test_entry_activity_AFTER_INSERT AFTER INSERT ON test_entry_activity FOR EACH ROW
BEGIN
  SET @transcription_id = (
    SELECT transcription_id
    FROM test_entry
    WHERE id = NEW.test_entry_id
  );
  CALL update_transcription_has_user( @transcription_id );
END ;;