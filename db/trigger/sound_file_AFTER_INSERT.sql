CREATE TRIGGER sound_file_AFTER_INSERT AFTER INSERT ON sound_file FOR EACH ROW
BEGIN
  CALL update_participant_sound_file_total( NEW.participant_id );
END ;;
