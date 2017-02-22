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
        "word ENUM('drum', 'curtain', 'bell', 'coffee', 'school', 'parent', 'moon', 'garden', 'hat', 'farmer', 'nose','turkey', 'colour', 'house', 'river') NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "variant VARCHAR(45) NOT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_word_language_id_variant (word ASC, language_id ASC, variant ASC), ",
        "CONSTRAINT fk_rey_data_variant_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO rey_data_variant( word, language_id, variant ) ",
      "SELECT variant.word, language.id, variant.variant ",
      "FROM ", @cenozo, ".language, ( ",
        "SELECT 'drum' AS word, 'dum' AS variant UNION ",
        "SELECT 'drum' AS word, 'drub' AS variant UNION ",
        "SELECT 'drum' AS word, 'tambour' AS variant UNION ",
        "SELECT 'curtain' AS word, 'certain' AS variant UNION ",
        "SELECT 'curtain' AS word, 'rideau' AS variant UNION ",
        "SELECT 'bell' AS word, 'ball' AS variant UNION ",
        "SELECT 'bell' AS word, 'cloche' AS variant UNION ",
        "SELECT 'coffee' AS word, 'café' AS variant UNION ",
        "SELECT 'school' AS word, 'cool' AS variant UNION ",
        "SELECT 'school' AS word, 'école' AS variant UNION ",
        "SELECT 'moon' AS word, 'lune' AS variant UNION ",
        "SELECT 'garden' AS word, 'jardin' AS variant UNION ",
        "SELECT 'hat' AS word, 'chapeau' AS variant UNION ",
        "SELECT 'farmer' AS word, 'former' AS variant UNION ",
        "SELECT 'farmer' AS word, 'armour' AS variant UNION ",
        "SELECT 'farmer' AS word, 'fermier' AS variant UNION ",
        "SELECT 'nose' AS word, 'nez' AS variant UNION ",
        "SELECT 'turkey' AS word, 'dinde' AS variant UNION ",
        "SELECT 'colour' AS word, 'collar' AS variant UNION ",
        "SELECT 'colour' AS word, 'couleur' AS variant UNION ",
        "SELECT 'house' AS word, 'maison' AS variant UNION ",
        "SELECT 'river' AS word, 'rivière' AS variant ",
      ") AS variant ",
      "WHERE language.code = 'en'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO rey_data_variant( word, language_id, variant ) ",
      "SELECT variant.word, language.id, variant.variant ",
      "FROM ", @cenozo, ".language, ( ",
        "SELECT 'drum' AS word, 'drum' AS variant UNION ",
        "SELECT 'curtain' AS word, 'lit d\\'eau' AS variant UNION ",
        "SELECT 'curtain' AS word, 'curtain' AS variant UNION ",
        "SELECT 'bell' AS word, 'bell' AS variant UNION ",
        "SELECT 'coffee' AS word, 'coffee' AS variant UNION ",
        "SELECT 'school' AS word, 'colle' AS variant UNION ",
        "SELECT 'school' AS word, 'school' AS variant UNION ",
        "SELECT 'moon' AS word, 'moon' AS variant UNION ",
        "SELECT 'garden' AS word, 'garden' AS variant UNION ",
        "SELECT 'hat' AS word, 'hat' AS variant UNION ",
        "SELECT 'farmer' AS word, 'farmer' AS variant UNION ",
        "SELECT 'nose' AS word, 'nose' AS variant UNION ",
        "SELECT 'turkey' AS word, 'turkey' AS variant UNION ",
        "SELECT 'colour' AS word, 'couleuvre' AS variant UNION ",
        "SELECT 'colour' AS word, 'colour' AS variant UNION ",
        "SELECT 'house' AS word, 'house' AS variant UNION ",
        "SELECT 'river' AS word, 'river' AS variant ",
      ") AS variant ",
      "WHERE language.code = 'fr'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_writelog();
DROP PROCEDURE IF EXISTS patch_writelog;
