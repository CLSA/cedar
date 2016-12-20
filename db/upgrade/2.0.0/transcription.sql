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
        "user_id INT UNSIGNED NULL COMMENT 'The typist that the transcription is currently assigned to.', ",
        "participant_id INT UNSIGNED NOT NULL, ",
        "site_id INT UNSIGNED NOT NULL, ",
        "assigned_count INT UNSIGNED NOT NULL DEFAULT 0, ",
        "deferred_count INT UNSIGNED NOT NULL DEFAULT 0, ",
        "submitted_count INT UNSIGNED NOT NULL DEFAULT 0, ",
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

DELIMITER $$

DROP TRIGGER IF EXISTS transcription_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER transcription_AFTER_UPDATE AFTER UPDATE ON transcription FOR EACH ROW
BEGIN
  IF OLD.user_id IS NOT NULL AND NEW.user_id != OLD.user_id THEN
    -- close any open activity belonging to the old user
    UPDATE test_entry_activity
    JOIN test_entry ON test_entry_activity.test_entry_id = test_entry.id
    SET test_entry_activity.end_datetime = UTC_TIMESTAMP()
    WHERE test_entry_activity.user_id = OLD.user_id
    AND test_entry_activity.end_datetime IS NULL
    AND test_entry.transcription_id = NEW.id;  
  END IF;
END$$

DELIMITER ;
