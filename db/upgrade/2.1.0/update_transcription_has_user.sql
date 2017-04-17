SELECT "Creating new update_transcription_has_user procedure" AS "";

DROP procedure IF EXISTS update_transcription_has_user;

DELIMITER $$

CREATE PROCEDURE update_transcription_has_user(IN proc_transcription_id INT(10) UNSIGNED)
BEGIN
  DELETE FROM transcription_has_user WHERE transcription_id = proc_transcription_id;
  INSERT IGNORE INTO transcription_has_user( transcription_id, user_id, datetime )
  SELECT test_entry.transcription_id, test_entry_activity.user_id, test_entry_activity.start_datetime
  FROM test_entry_activity
  JOIN test_entry ON test_entry_activity.test_entry_id = test_entry.id
  WHERE test_entry.transcription_id = proc_transcription_id
  GROUP BY test_entry_activity.user_id
  ORDER BY test_entry_activity.start_datetime;
END$$

DELIMITER ;
