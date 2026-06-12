CREATE TRIGGER fas_data_AFTER_INSERT AFTER INSERT ON fas_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END ;;
