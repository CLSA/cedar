CREATE TRIGGER test_entry_has_language_AFTER_INSERT AFTER INSERT ON test_entry_has_language FOR EACH ROW
BEGIN
  SET @transcription_id = ( SELECT transcription_id FROM test_entry WHERE id = NEW.test_entry_id );
  CALL update_transcription_has_language( @transcription_id );
END ;;
