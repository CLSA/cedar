DROP PROCEDURE IF EXISTS patch_transcription_event_type;
DELIMITER //
CREATE PROCEDURE patch_transcription_event_type()
  BEGIN

    -- determine the cenozo database name
    SET @cenozo = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
      AND constraint_name = "fk_access_site_id"
    );

    SELECT "Creating new transcription_event_type table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS transcription_event_type ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "cohort_id INT(10) UNSIGNED NOT NULL, ",
        "event_type_id INT(10) UNSIGNED NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_cohort_id (cohort_id ASC), ",
        "INDEX fk_event_type_id (event_type_id ASC), ",
        "UNIQUE INDEX uq_cohort_id_event_type_id (cohort_id ASC, event_type_id ASC), ",
        "CONSTRAINT fk_transcription_event_type_cohort_id ",
          "FOREIGN KEY (cohort_id) ",
          "REFERENCES ", @cenozo, ".cohort (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_transcription_event_type_event_type_id ",
          "FOREIGN KEY (event_type_id) ",
          "REFERENCES ", @cenozo, ".event_type (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB"
    );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL patch_transcription_event_type();
DROP PROCEDURE IF EXISTS patch_transcription_event_type;
