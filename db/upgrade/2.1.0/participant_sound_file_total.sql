DROP PROCEDURE IF EXISTS patch_participant_sound_file_total;
  DELIMITER //
  CREATE PROCEDURE patch_participant_sound_file_total()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new participant_sound_file_total table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS participant_sound_file_total ( ",
        "participant_id INT UNSIGNED NOT NULL, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "total INT UNSIGNED NOT NULL DEFAULT 0, ",
        "datetime DATETIME NOT NULL, ",
        "PRIMARY KEY (participant_id), ",
        "INDEX fk_participant_id (participant_id ASC), ",
        "INDEX dk_total (total ASC), ",
        "INDEX dk_datetime (datetime ASC), ",
        "CONSTRAINT fk_participant_sound_file_total_participant_id ",
          "FOREIGN KEY (participant_id) ",
          "REFERENCES ", @cenozo, ".participant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_participant_sound_file_total();
DROP PROCEDURE IF EXISTS patch_participant_sound_file_total;
