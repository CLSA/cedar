SELECT "Creating new update_participant_sound_file_total procedure" AS "";

DROP procedure IF EXISTS update_participant_sound_file_total;

DELIMITER $$

CREATE PROCEDURE update_participant_sound_file_total(IN proc_participant_id INT(10) UNSIGNED)
BEGIN

  REPLACE INTO participant_sound_file_total
  SET participant_id = proc_participant_id,
      total = (
        SELECT COUNT(*) FROM sound_file
        WHERE participant_id = proc_participant_id
      );

END
$$

DELIMITER ;
