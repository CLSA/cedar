DROP PROCEDURE IF EXISTS patch_word;
  DELIMITER //
  CREATE PROCEDURE patch_word()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new word table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS word ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "word VARCHAR(45) NOT NULL, ",
        "misspelled TINYINT(1) NULL DEFAULT NULL, ",
        "aft_valid TINYINT(1) NULL DEFAULT NULL, ",
        "fas_valid TINYINT(1) NULL DEFAULT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_word_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_language_id_word (language_id ASC, word ASC), ",
        "CONSTRAINT fk_word_language_id ",
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
CALL patch_word();
DROP PROCEDURE IF EXISTS patch_word;
