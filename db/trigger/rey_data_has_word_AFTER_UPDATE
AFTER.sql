CREATE TRIGGER rey_data_has_word_AFTER_UPDATE
AFTER UPDATE ON cedar.rey_data_has_word FOR EACH ROW
BEGIN
  SET @test_entry_id = ( SELECT test_entry_id FROM rey_data WHERE id = NEW.rey_data_id );
  CALL update_test_entry_has_word( @test_entry_id );
END$$