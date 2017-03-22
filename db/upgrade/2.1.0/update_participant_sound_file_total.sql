SELECT "Creating new update_participant_sound_file_total procedure" AS "";

DROP procedure IF EXISTS update_participant_sound_file_total;

DELIMITER $$

CREATE PROCEDURE update_participant_sound_file_total(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  -- get the number of sound files and earliest datetime
  REPLACE INTO participant_sound_file_total( participant_id, total, datetime )
  SELECT participant_id, COUNT(*), MIN( datetime )
  FROM sound_file
  WHERE participant_id = proc_participant_id;
END$$

DELIMITER ;
