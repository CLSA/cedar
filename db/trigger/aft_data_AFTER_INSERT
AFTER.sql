CREATE TRIGGER aft_data_AFTER_INSERT
AFTER INSERT ON cedar.aft_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END$$