DROP PROCEDURE IF EXISTS patch_transcription_has_user;
  DELIMITER //
  CREATE PROCEDURE patch_transcription_has_user()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS transcription_has_user ( ",
        "transcription_id INT UNSIGNED NOT NULL, ",
        "user_id INT UNSIGNED NOT NULL, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "datetime DATETIME NOT NULL, ",
        "PRIMARY KEY (transcription_id, user_id), ",
        "INDEX fk_user_id1_idx (user_id ASC), ",
        "INDEX fk_transcription_id1_idx (transcription_id ASC), ",
        "CONSTRAINT fk_transcription_id1 ",
          "FOREIGN KEY (transcription_id) ",
          "REFERENCES transcription (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_user_id1 ",
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
CALL patch_transcription_has_user();
DROP PROCEDURE IF EXISTS patch_transcription_has_user;
