DROP PROCEDURE IF EXISTS patch_transcription;
  DELIMITER //
  CREATE PROCEDURE patch_transcription()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new transcription table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS transcription ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "user_id INT UNSIGNED NOT NULL, ",
        "participant_id INT UNSIGNED NOT NULL, ",
        "site_id INT UNSIGNED NOT NULL, ",
        "start_datetime DATETIME NOT NULL, ",
        "end_datetime DATETIME NULL DEFAULT NULL, ",
        "PRIMARY KEY (id), ",
        "UNIQUE INDEX uq_participant_id (participant_id ASC), ",
        "INDEX fk_user_id (user_id ASC), ",
        "INDEX fk_site_id (site_id ASC), ",
        "CONSTRAINT fk_transcription_participant_id ",
          "FOREIGN KEY (participant_id) ",
          "REFERENCES ", @cenozo, ".participant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_transcription_user_id ",
          "FOREIGN KEY (user_id) ",
          "REFERENCES ", @cenozo, ".user (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_transcription_site_id ",
          "FOREIGN KEY (site_id) ",
          "REFERENCES ", @cenozo, ".site (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_transcription();
DROP PROCEDURE IF EXISTS patch_transcription;
