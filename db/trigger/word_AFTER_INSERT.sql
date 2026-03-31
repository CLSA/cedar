CREATE TRIGGER word_AFTER_INSERT
AFTER INSERT ON cedar.word FOR EACH ROW
BEGIN
  CALL update_word_test_type_total( NEW.id, "aft" );
END$$
