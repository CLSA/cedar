DROP PROCEDURE IF EXISTS patch_writelog;
  DELIMITER //
  CREATE PROCEDURE patch_writelog()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new writelog table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS rey_data_variant ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "word ENUM('drum', 'curtain', 'bell', 'coffee', 'school', 'parent', 'moon', 'garden', 'hat', 'farmer', 'nose', 'turkey', 'colour', 'house', 'river') NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "word_id INT UNSIGNED NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_word_language_id_word_id (word ASC, language_id ASC, word_id ASC), ",
        "INDEX fk_word_id (word_id ASC), ",
        "CONSTRAINT fk_rey_data_variant_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_variant_word_id ",
          "FOREIGN KEY (word_id) ",
          "REFERENCES word (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_writelog();
DROP PROCEDURE IF EXISTS patch_writelog;
