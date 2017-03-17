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
        "word VARCHAR(65) CHARACTER SET 'utf8' NOT NULL, ",
        "sister_word_id INT UNSIGNED NULL DEFAULT NULL, ",
        "misspelled TINYINT(1) NULL DEFAULT NULL, ",
        "aft ENUM('invalid','intrusion','primary') NULL DEFAULT NULL, ",
        "fas ENUM('invalid','intrusion','primary') NULL DEFAULT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_language_id_word (language_id ASC, word ASC), ",
        "INDEX fk_sister_word_id (sister_word_id ASC), ",
        "CONSTRAINT fk_word_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "word"
      AND CONSTRAINT_NAME = "fk_word_sister_word_id" );
    IF @test = 0 THEN
      ALTER TABLE word
      ADD CONSTRAINT fk_word_sister_word_id
        FOREIGN KEY (sister_word_id)
        REFERENCES word (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_word();
DROP PROCEDURE IF EXISTS patch_word;
