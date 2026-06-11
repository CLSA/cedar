CREATE PROCEDURE update_participant_sound_file_total(IN proc_participant_id INT(10) UNSIGNED)
BEGIN

  SELECT COUNT(*) INTO @total FROM sound_file WHERE participant_id = proc_participant_id;

  IF @total = 0 THEN
    REPLACE INTO participant_sound_file_total( participant_id, total, datetime )
    VALUES( proc_participant_id, 0, 0 );
  ELSE
    REPLACE INTO participant_sound_file_total( participant_id, total, datetime )
    SELECT participant_id, COUNT(*), MIN( datetime )
    FROM sound_file
    WHERE participant_id = proc_participant_id;
  END IF;

END ;;