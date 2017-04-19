SELECT "Creating new update_test_entry_has_word procedure" AS "";

DROP procedure IF EXISTS update_test_entry_has_word;

DELIMITER $$

CREATE PROCEDURE update_test_entry_has_word(IN proc_test_entry_id INT(10) UNSIGNED)
BEGIN
  DELETE FROM test_entry_has_word WHERE test_entry_id = proc_test_entry_id;

  SET @data_type = (
    SELECT test_type.data_type
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    WHERE test_entry.id = proc_test_entry_id
  );
  IF "aft" = @data_type THEN
       INSERT INTO test_entry_has_word( test_entry_id, word_id )
       SELECT DISTINCT proc_test_entry_id, word_id
    FROM aft_data
    WHERE test_entry_id = proc_test_entry_id;
  ELSEIF "fas" = @data_type THEN
       INSERT INTO test_entry_has_word( test_entry_id, word_id )
       SELECT DISTINCT proc_test_entry_id, word_id
    FROM fas_data
    WHERE test_entry_id = proc_test_entry_id;
  ELSEIF "rey" = @data_type THEN
       INSERT INTO test_entry_has_word( test_entry_id, word_id )
       SELECT DISTINCT proc_test_entry_id, word_id
    FROM rey_data_has_word
    JOIN rey_data ON rey_data_has_word.rey_data_id = rey_data.id
    WHERE rey_data.test_entry_id = proc_test_entry_id;
  END IF;

END$$

DELIMITER ;
