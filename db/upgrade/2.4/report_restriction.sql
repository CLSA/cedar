DROP PROCEDURE IF EXISTS patch_report_restriction;
DELIMITER //
CREATE PROCEDURE patch_report_restriction()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
      AND constraint_name = "fk_access_site_id" );

    SELECT "Adding records to report_restriction table" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".report_restriction ( ",
        "report_type_id, rank, name, title, mandatory, null_allowed, ",
        "restriction_type, custom, subject, operator, enum_list, description ) ",
      "SELECT id, 1, 'language', 'Language', 0, 0, 'table', 1, 'language', NULL, NULL, 'Restrict to a particular language.' ",
      "FROM ", @cenozo, ".report_type ",
      "WHERE name = 'compound_word'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL patch_report_restriction();
DROP PROCEDURE IF EXISTS patch_report_restriction;
