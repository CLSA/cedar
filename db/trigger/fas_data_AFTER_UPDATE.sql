CREATE TRIGGER fas_data_AFTER_UPDATE AFTER UPDATE ON fas_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END ;;
