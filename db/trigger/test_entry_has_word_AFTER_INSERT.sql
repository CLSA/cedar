CREATE TRIGGER test_entry_has_word_AFTER_INSERT
AFTER INSERT ON cedar.test_entry_has_word FOR EACH ROW
BEGIN
  SET @data_type = (
    SELECT test_type.data_type
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    WHERE test_entry.id = NEW.test_entry_id
  );
  CALL update_word_test_type_total( NEW.word_id, @data_type );
END$$