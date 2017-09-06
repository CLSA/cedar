SELECT "Creating new update_word_test_type_total procedure" AS "";

DROP procedure IF EXISTS update_word_test_type_total;

DELIMITER $$

CREATE PROCEDURE update_word_test_type_total(IN proc_word_id INT(10) UNSIGNED, IN proc_data_type ENUM('aft','fas','mat','premat','rey'))
BEGIN
  -- get the number of test entries using the word by test type
  IF "aft" = proc_data_type THEN
    INSERT INTO word_test_type_total( word_id, aft_total )
    SELECT word.id, IF( aft_data.id IS NULL, 0, COUNT(*) ) AS total
    FROM word
    LEFT JOIN aft_data ON word.id = aft_data.word_id
    WHERE word.id = proc_word_id
    ON DUPLICATE KEY UPDATE aft_total = VALUES( aft_total );
  ELSEIF "fas" = proc_data_type THEN
    INSERT INTO word_test_type_total( word_id, fas_total )
    SELECT word.id, IF( fas_data.id IS NULL, 0, COUNT(*) ) AS total
    FROM word
    LEFT JOIN fas_data ON word.id = fas_data.word_id
    WHERE word.id = proc_word_id
    ON DUPLICATE KEY UPDATE fas_total = VALUES( fas_total );
  ELSEIF "rey" = proc_data_type THEN
    INSERT INTO word_test_type_total( word_id, rey_total )
    SELECT word.id, IF( rey_data_has_word.rey_data_id IS NULL, 0, COUNT(*) ) AS total
    FROM word
    LEFT JOIN rey_data_has_word ON word.id = rey_data_has_word.word_id
    WHERE word.id = proc_word_id
    ON DUPLICATE KEY UPDATE rey_total = VALUES( rey_total ); 
  END IF;
END$$

DELIMITER ;
