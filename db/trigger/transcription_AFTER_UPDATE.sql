CREATE TRIGGER transcription_AFTER_UPDATE AFTER UPDATE ON transcription FOR EACH ROW
BEGIN
  IF OLD.user_id IS NOT NULL AND NEW.user_id != OLD.user_id THEN

    UPDATE test_entry_activity
    JOIN test_entry ON test_entry_activity.test_entry_id = test_entry.id
    SET test_entry_activity.end_datetime = UTC_TIMESTAMP()
    WHERE test_entry_activity.user_id = OLD.user_id
    AND test_entry_activity.end_datetime IS NULL
    AND test_entry.transcription_id = NEW.id;
  END IF;
END ;;