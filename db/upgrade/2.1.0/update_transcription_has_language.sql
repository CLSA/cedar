SELECT "Creating new update_transcription_has_language procedure" AS "";

DROP procedure IF EXISTS update_transcription_has_language;

DELIMITER $$

CREATE PROCEDURE update_transcription_has_language (IN proc_transcription_id INT(10) UNSIGNED)
BEGIN
  -- remove all existing languages
  DELETE FROM transcription_has_language WHERE transcription_id = proc_transcription_id;

  -- get all languages from all test-entries
  REPLACE INTO transcription_has_language( transcription_id, language_id, create_timestamp )
  SELECT DISTINCT transcription_id, language_id, NULL
  FROM test_entry
  JOIN test_entry_has_language ON test_entry.id = test_entry_has_language.test_entry_id
  WHERE transcription_id = proc_transcription_id;
END$$

DELIMITER ;
