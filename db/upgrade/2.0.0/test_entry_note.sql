DROP PROCEDURE IF EXISTS patch_test_entry_note;
  DELIMITER //
  CREATE PROCEDURE patch_test_entry_note()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = ( 
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );
    
    SELECT "Create new test_entry_note table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS test_entry_note ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "test_entry_id INT UNSIGNED NOT NULL, ",
        "user_id INT UNSIGNED NOT NULL, ",
        "sticky TINYINT(1) NOT NULL DEFAULT 0, ",
        "datetime DATETIME NOT NULL, ",
        "note TEXT NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_test_entry_id (test_entry_id ASC), ",
        "INDEX fk_user_id (user_id ASC), ",
        "INDEX dk_datetime (datetime ASC), ",
        "CONSTRAINT fk_test_entry_note_test_entry_id ",
          "FOREIGN KEY (test_entry_id) ",
          "REFERENCES test_entry (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE, ",
        "CONSTRAINT fk_test_entry_note_user_id ",
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
CALL patch_test_entry_note();
DROP PROCEDURE IF EXISTS patch_test_entry_note;
