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
        "variant VARCHAR(45) NOT NULL, ",
        "variant_language_id INT UNSIGNED NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_word_language_id_variant (word ASC, language_id ASC, variant ASC), ",
        "INDEX fk_variant_language_id (variant_language_id ASC), ",
        "CONSTRAINT fk_rey_data_variant_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_variant_variant_language_id ",
          "FOREIGN KEY (variant_language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT( "SELECT id INTO @en_language_id FROM ", @cenozo, ".language WHERE code = 'en'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT( "SELECT id INTO @fr_language_id FROM ", @cenozo, ".language WHERE code = 'fr'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO rey_data_variant( word, language_id, variant, variant_language_id ) VALUES ",
      "( 'drum', ", @en_language_id, ", 'dum', ", @en_language_id, " ), ",
      "( 'drum', ", @en_language_id, ", 'drub', ", @en_language_id, " ), ",
      "( 'drum', ", @en_language_id, ", 'tambour', ", @fr_language_id, " ), ",
      "( 'drum', ", @fr_language_id, ", 'drum', ", @en_language_id, " ), ",
      "( 'curtain', ", @en_language_id, ", 'certain', ", @en_language_id, " ), ",
      "( 'curtain', ", @en_language_id, ", 'rideau', ", @fr_language_id, " ), ",
      "( 'curtain', ", @fr_language_id, ", 'lit d\\'eau', ", @fr_language_id, " ), ",
      "( 'curtain', ", @fr_language_id, ", 'curtain', ", @en_language_id, " ), ",
      "( 'bell', ", @en_language_id, ", 'ball', ", @en_language_id, " ), ",
      "( 'bell', ", @en_language_id, ", 'cloche', ", @fr_language_id, " ), ",
      "( 'bell', ", @fr_language_id, ", 'bell', ", @en_language_id, " ), ",
      "( 'coffee', ", @en_language_id, ", 'café', ", @fr_language_id, " ), ",
      "( 'coffee', ", @fr_language_id, ", 'coffee', ", @en_language_id, " ), ",
      "( 'school', ", @en_language_id, ", 'cool', ", @en_language_id, " ), ",
      "( 'school', ", @en_language_id, ", 'école', ", @fr_language_id, " ), ",
      "( 'school', ", @fr_language_id, ", 'colle', ", @fr_language_id, " ), ",
      "( 'school', ", @fr_language_id, ", 'school', ", @en_language_id, " ), ",
      "( 'moon', ", @en_language_id, ", 'lune', ", @fr_language_id, " ), ",
      "( 'moon', ", @fr_language_id, ", 'moon', ", @en_language_id, " ), ",
      "( 'garden', ", @en_language_id, ", 'jardin', ", @fr_language_id, " ), ",
      "( 'garden', ", @fr_language_id, ", 'garden', ", @en_language_id, " ), ",
      "( 'hat', ", @en_language_id, ", 'chapeau', ", @fr_language_id, " ), ",
      "( 'hat', ", @fr_language_id, ", 'hat', ", @en_language_id, " ), ",
      "( 'farmer', ", @en_language_id, ", 'former', ", @en_language_id, " ), ",
      "( 'farmer', ", @en_language_id, ", 'armour', ", @en_language_id, " ), ",
      "( 'farmer', ", @en_language_id, ", 'fermier', ", @fr_language_id, " ), ",
      "( 'farmer', ", @fr_language_id, ", 'farmer', ", @en_language_id, " ), ",
      "( 'nose', ", @en_language_id, ", 'nez', ", @fr_language_id, " ), ",
      "( 'nose', ", @fr_language_id, ", 'nose', ", @en_language_id, " ), ",
      "( 'turkey', ", @en_language_id, ", 'dinde', ", @fr_language_id, " ), ",
      "( 'turkey', ", @fr_language_id, ", 'turkey', ", @en_language_id, " ), ",
      "( 'colour', ", @en_language_id, ", 'collar', ", @en_language_id, " ), ",
      "( 'colour', ", @en_language_id, ", 'couleur', ", @fr_language_id, " ), ",
      "( 'colour', ", @fr_language_id, ", 'couleuvre', ", @fr_language_id, " ), ",
      "( 'colour', ", @fr_language_id, ", 'colour', ", @en_language_id, " ), ",
      "( 'house', ", @en_language_id, ", 'maison', ", @en_language_id, " ), ",
      "( 'house', ", @fr_language_id, ", 'house', ", @en_language_id, " ), ",
      "( 'river', ", @en_language_id, ", 'rivière', ", @fr_language_id, " ), ",
      "( 'river', ", @fr_language_id, ", 'river', ", @en_language_id, " )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_writelog();
DROP PROCEDURE IF EXISTS patch_writelog;
