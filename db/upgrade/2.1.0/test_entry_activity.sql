DROP PROCEDURE IF EXISTS patch_test_entry_activity;
  DELIMITER //
  CREATE PROCEDURE patch_test_entry_activity()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = ( 
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );
    
    SELECT "Create new test_entry_activity table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS test_entry_activity ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "test_entry_id INT UNSIGNED NOT NULL, ",
        "user_id INT UNSIGNED NOT NULL, ",
        "start_datetime DATETIME NOT NULL, ",
        "end_datetime DATETIME NULL DEFAULT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_test_entry_id (test_entry_id ASC), ",
        "INDEX fk_user_id (user_id ASC), ",
        "INDEX dk_start_datetime (start_datetime ASC), ",
        "INDEX dk_end_datetime (end_datetime ASC), ",
        "CONSTRAINT fk_test_entry_activity_test_entry_id ",
          "FOREIGN KEY (test_entry_id) ",
          "REFERENCES test_entry (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE, ",
        "CONSTRAINT fk_test_entry_activity_user_id ",
          "FOREIGN KEY (user_id) ",
          "REFERENCES ", @cenozo, ".user (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_test_entry_activity();
DROP PROCEDURE IF EXISTS patch_test_entry_activity;


DELIMITER $$

DROP TRIGGER IF EXISTS test_entry_activity_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_activity_AFTER_INSERT AFTER INSERT ON test_entry_activity FOR EACH ROW
BEGIN
  SET @transcription_id = (
    SELECT transcription_id
    FROM test_entry
    WHERE id = NEW.test_entry_id
  );
  CALL update_transcription_has_user( @transcription_id );
END$$


DROP TRIGGER IF EXISTS test_entry_activity_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_activity_AFTER_UPDATE AFTER UPDATE ON test_entry_activity FOR EACH ROW
BEGIN
  IF OLD.user_id != NEW.user_id THEN
    SET @transcription_id = (
      SELECT transcription_id
      FROM test_entry
      WHERE id = NEW.test_entry_id
    );
    CALL update_transcription_has_user( @transcription_id );
  END IF;
END$$


DROP TRIGGER IF EXISTS test_entry_activity_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_activity_AFTER_DELETE AFTER DELETE ON test_entry_activity FOR EACH ROW
BEGIN
  SET @transcription_id = (
    SELECT transcription_id
    FROM test_entry
    WHERE id = OLD.test_entry_id
  );
  CALL update_transcription_has_user( @transcription_id );
END$$

DELIMITER ;
