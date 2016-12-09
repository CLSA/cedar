DROP PROCEDURE IF EXISTS patch_test_entry_has_language;
  DELIMITER //
  CREATE PROCEDURE patch_test_entry_has_language()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = ( 
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );
    
    SELECT "Create new test_entry_has_language table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS test_entry_has_language ( ",
        "test_entry_id INT UNSIGNED NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "PRIMARY KEY (test_entry_id, language_id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "INDEX fk_test_entry_id (test_entry_id ASC), ",
        "CONSTRAINT fk_test_entry_has_language_test_entry_id ",
          "FOREIGN KEY (test_entry_id) ",
          "REFERENCES test_entry (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_test_entry_has_language_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_test_entry_has_language();
DROP PROCEDURE IF EXISTS patch_test_entry_has_language;
