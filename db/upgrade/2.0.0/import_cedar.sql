DROP PROCEDURE IF EXISTS patch_access;
DELIMITER //
CREATE PROCEDURE patch_access()
  BEGIN

    -- determine the @cenozo, @v1_cenozo database names and the @application name
    SET @cenozo = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
      AND constraint_name IN ( "fk_activity_site_id", "fk_access_site_id" )
      GROUP BY unique_constraint_schema );
    SET @v1_cenozo = ( SELECT CONCAT( "v1_", @cenozo ) );
    SET @application = (
      SELECT RIGHT(
        DATABASE(),
        CHAR_LENGTH( DATABASE() ) -
        CHAR_LENGTH( LEFT( USER(), LOCATE( '@', USER() ) ) )
      )
    );

    SELECT "Importing roles from v1" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".application_type_has_role( ",
        "update_timestamp, create_timestamp, application_type_id, role_id ) ",
      "SELECT service_has_role.update_timestamp, service_has_role.create_timestamp, ",
        "application_type.id, role.id ",
      "FROM ", @cenozo, ".application_type, ", @cenozo, ".role ",
      "JOIN ", @v1_cenozo, ".role v1_role ON role.name = v1_role.name ",
      "JOIN ", @v1_cenozo, ".service_has_role ON v1_role.id = service_has_role.role_id ",
      "JOIN ", @v1_cenozo, ".service ON service_has_role.service_id = service.id ",
      "WHERE application_type.name = 'cedar' ",
      "AND service.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Importing cohorts from v1" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".application_has_cohort( ",
        "update_timestamp, create_timestamp, application_id, cohort_id, grouping ) ",
      "SELECT service_has_cohort.update_timestamp, service_has_cohort.create_timestamp, ",
        "application.id, cohort.id, service_has_cohort.grouping ",
      "FROM ", @cenozo, ".application "
      "CROSS JOIN ", @cenozo, ".cohort ",
      "JOIN ", @v1_cenozo, ".cohort v1_cohort ON cohort.name = v1_cohort.name ",
      "JOIN ", @v1_cenozo, ".service_has_cohort ON v1_cohort.id = service_has_cohort.cohort_id ",
      "JOIN ", @v1_cenozo, ".service ON service_has_cohort.service_id = service.id ",
       "AND application.name = service.name ",
      "WHERE application.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Importing access from v1" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO access( update_timestamp, create_timestamp, user_id, role_id, site_id ) ",
      "SELECT v1_access.update_timestamp, v1_access.create_timestamp, user.id, role.id, site.id ",
      "FROM ", @cenozo, ".user ",
      "CROSS JOIN ", @cenozo, ".role ",
      "CROSS JOIN ", @cenozo, ".site ",
      "JOIN ", @v1_cenozo, ".user v1_user ON user.name = v1_user.name ",
      "JOIN ", @v1_cenozo, ".role v1_role ON role.name = v1_role.name ",
      "JOIN ", @v1_cenozo, ".site v1_site ON site.name = CONCAT( v1_site.name, ' REC' ) ",
      "JOIN ", @v1_cenozo, ".access v1_access ON v1_user.id = v1_access.user_id ",
       "AND v1_role.id = v1_access.role_id ",
       "AND v1_site.id = v1_access.site_id ",
      "JOIN ", @v1_cenozo, ".service ON v1_site.service_id = service.id ",
      "JOIN ", @cenozo, ".application ON service.name = application.name ",
      "WHERE application.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Updating cedar version number" AS "";

    SET @sql = CONCAT(
      "UPDATE ", @cenozo, ".application ",
      "SET version = '2.0.0' ",
      "WHERE name = '", @application, "'"
    );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL patch_access();
DROP PROCEDURE IF EXISTS patch_access;
