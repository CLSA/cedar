DROP PROCEDURE IF EXISTS patch_sound_file;
  DELIMITER //
  CREATE PROCEDURE patch_sound_file()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new sound_file table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS sound_file ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "participant_id INT UNSIGNED NOT NULL, ",
        "test_type_id INT UNSIGNED NULL DEFAULT NULL, ",
        "filename VARCHAR(255) NOT NULL, ",
        "datetime DATETIME NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_participant_id (participant_id ASC), ",
        "INDEX fk_test_type_id (test_type_id ASC), ",
        "INDEX dk_datetime (datetime ASC), ",
        "UNIQUE INDEX uq_participant_id_test_type_id_filename (participant_id ASC, test_type_id ASC, filename ASC), ",
        "CONSTRAINT fk_sound_file_participant_id ",
          "FOREIGN KEY (participant_id) ",
          "REFERENCES ", @cenozo, ".participant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_sound_file_test_type_id ",
          "FOREIGN KEY (test_type_id) ",
          "REFERENCES test_type (id) ",
          "ON DELETE SET NULL ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_sound_file();
DROP PROCEDURE IF EXISTS patch_sound_file;

DELIMITER $$

DROP TRIGGER IF EXISTS sound_file_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER sound_file_AFTER_INSERT AFTER INSERT ON sound_file FOR EACH ROW
BEGIN
  CALL update_participant_sound_file_total( NEW.participant_id );
END$$


DROP TRIGGER IF EXISTS sound_file_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER sound_file_AFTER_UPDATE AFTER UPDATE ON sound_file FOR EACH ROW
BEGIN
  CALL update_participant_sound_file_total( NEW.participant_id );
END$$


DROP TRIGGER IF EXISTS sound_file_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER sound_file_AFTER_DELETE AFTER DELETE ON sound_file FOR EACH ROW
BEGIN
  CALL update_participant_sound_file_total( OLD.participant_id );
END$$

DELIMITER ;
