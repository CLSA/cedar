SELECT "Adding triggers to fas_data table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS aft_data_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER aft_data_AFTER_INSERT AFTER INSERT ON aft_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END$$


DROP TRIGGER IF EXISTS aft_data_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER aft_data_AFTER_UPDATE AFTER UPDATE ON aft_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END$$


DROP TRIGGER IF EXISTS fas_data_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER fas_data_AFTER_DELETE AFTER DELETE ON fas_data FOR EACH ROW
BEGIN
  SET @test = (
    SELECT SUM( total ) FROM (
      SELECT COUNT(*) AS total FROM aft_data WHERE word_id = OLD.word_id UNION
      SELECT COUNT(*) AS total FROM fas_data WHERE word_id = OLD.word_id UNION
      SELECT COUNT(*) AS total FROM rey_data_has_word WHERE word_id = OLD.word_id
    ) AS temp
  );
  IF @test = 0 THEN
    DELETE FROM word WHERE id = OLD.word_id
    AND misspelled IS NULL
    AND aft IS NULL
    AND fas IS NULL;
  END IF;

  CALL update_test_entry_has_word( OLD.test_entry_id );
END;$$

DELIMITER ;
