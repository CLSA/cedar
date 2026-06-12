CREATE TRIGGER test_entry_has_language_AFTER_DELETE AFTER DELETE ON test_entry_has_language FOR EACH ROW
BEGIN
  SET @transcription_id = ( SELECT transcription_id FROM test_entry WHERE id = OLD.test_entry_id );
  CALL update_transcription_has_language( @transcription_id );
END ;;
