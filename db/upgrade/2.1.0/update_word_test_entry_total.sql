SELECT "Creating new update_word_test_entry_total procedure" AS "";

DROP procedure IF EXISTS update_word_test_entry_total;

DELIMITER $$

CREATE PROCEDURE update_word_test_entry_total(IN proc_word_id INT(10) UNSIGNED)
BEGIN
  -- get the number of test entries using the word
  REPLACE INTO word_test_entry_total( word_id, total )
  SELECT word.id, IF( test_entry_has_word.word_id IS NULL, 0, COUNT(*) ) AS total
  FROM word
  LEFT JOIN test_entry_has_word ON word.id = test_entry_has_word.word_id
  WHERE word.id = proc_word_id;
END$$

DELIMITER ;
