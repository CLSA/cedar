CREATE TRIGGER sound_file_AFTER_UPDATE AFTER UPDATE ON sound_file FOR EACH ROW
BEGIN
  CALL update_participant_sound_file_total( NEW.participant_id );
END ;;