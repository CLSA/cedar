CREATE TRIGGER sound_file_AFTER_DELETE
AFTER DELETE ON cedar.sound_file FOR EACH ROW
BEGIN
  CALL update_participant_sound_file_total( OLD.participant_id );
END$$