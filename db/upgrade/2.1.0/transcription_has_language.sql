DROP PROCEDURE IF EXISTS patch_transcription_has_language;
  DELIMITER //
  CREATE PROCEDURE patch_transcription_has_language()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = ( 
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );
    
    SELECT "Create new transcription_has_language table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS transcription_has_language ( ",
        "transcription_id INT UNSIGNED NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "PRIMARY KEY (transcription_id, language_id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "INDEX fk_transcription_id (transcription_id ASC), ",
        "CONSTRAINT fk_transcription_has_language_transcription_id ",
          "FOREIGN KEY (transcription_id) ",
          "REFERENCES transcription (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE, ",
        "CONSTRAINT fk_transcription_has_language_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_transcription_has_language();
DROP PROCEDURE IF EXISTS patch_transcription_has_language;
