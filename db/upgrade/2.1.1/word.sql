SELECT "Adding new trigger to word table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS word_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER word_AFTER_INSERT AFTER INSERT ON word FOR EACH ROW
BEGIN
  CALL update_word_test_type_total( NEW.id, "aft" ); -- no need to call other test types
END$$

DELIMITER ;
