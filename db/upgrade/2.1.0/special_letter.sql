DROP PROCEDURE IF EXISTS patch_special_letter;
  DELIMITER //
  CREATE PROCEDURE patch_special_letter()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new special_letter table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS special_letter ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "letter CHAR(1) COLLATE 'utf8_bin' NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_language_id_letter (language_id ASC, letter ASC), ",
        "CONSTRAINT fk_special_letter_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB ",
      "DEFAULT CHARACTER SET = utf8" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO special_letter( language_id, letter ) ",
      "SELECT language.id, letter.c ",
      "FROM ", @cenozo, ".language, ( ",
        "SELECT 'à' COLLATE utf8_bin AS c UNION ",
        "SELECT 'â' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ä' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ç' COLLATE utf8_bin AS c UNION ",
        "SELECT 'è' COLLATE utf8_bin AS c UNION ",
        "SELECT 'é' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ê' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ë' COLLATE utf8_bin AS c UNION ",
        "SELECT 'î' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ï' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ô' COLLATE utf8_bin AS c UNION ",
        "SELECT 'û' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ù' COLLATE utf8_bin AS c UNION ",
        "SELECT 'ü' COLLATE utf8_bin AS c",
      ") AS letter ",
      "WHERE language.code = 'fr'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_special_letter();
DROP PROCEDURE IF EXISTS patch_special_letter;
