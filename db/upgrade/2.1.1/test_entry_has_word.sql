SELECT "Replacing triggers in test_entry_has_word table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS test_entry_has_word_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_has_word_AFTER_INSERT AFTER INSERT ON test_entry_has_word FOR EACH ROW
BEGIN
  SET @data_type = (
    SELECT test_type.data_type
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    WHERE test_entry.id = NEW.test_entry_id
  );
  CALL update_word_test_type_total( NEW.word_id, @data_type );
END$$


DROP TRIGGER IF EXISTS test_entry_has_word_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_has_word_AFTER_UPDATE AFTER UPDATE ON test_entry_has_word FOR EACH ROW
BEGIN
  SET @data_type = (
    SELECT test_type.data_type
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    WHERE test_entry.id = NEW.test_entry_id
  );
  CALL update_word_test_type_total( NEW.word_id, @data_type );
END$$


DROP TRIGGER IF EXISTS test_entry_has_word_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_has_word_AFTER_DELETE AFTER DELETE ON test_entry_has_word FOR EACH ROW
BEGIN
  SET @data_type = (
    SELECT test_type.data_type
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    WHERE test_entry.id = OLD.test_entry_id
  );
  CALL update_word_test_type_total( OLD.word_id, @data_type );
END$$

DELIMITER ;
