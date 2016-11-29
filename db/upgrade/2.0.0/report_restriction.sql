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

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_report_restriction();
DROP PROCEDURE IF EXISTS patch_report_restriction;
