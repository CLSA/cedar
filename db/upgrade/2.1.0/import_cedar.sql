DROP PROCEDURE IF EXISTS import_cedar;
DELIMITER //
CREATE PROCEDURE import_cedar()
  BEGIN

    -- determine the @cenozo, @v1_cenozo database names and the @application name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name IN ( "fk_activity_site_id", "fk_access_site_id" )
      GROUP BY unique_constraint_schema );
    SET @v1_cenozo = ( SELECT CONCAT( "v1_", @cenozo ) );
    SET @v1_cedar = ( SELECT CONCAT( "v1_", DATABASE() ) );
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
      "SELECT v1_service_has_role.update_timestamp, v1_service_has_role.create_timestamp, ",
        "application_type.id, role.id ",
      "FROM ", @cenozo, ".application_type, ", @cenozo, ".role ",
      "JOIN ", @v1_cenozo, ".role v1_role ON role.name = v1_role.name ",
      "JOIN ", @v1_cenozo, ".service_has_role v1_service_has_role ON v1_role.id = v1_service_has_role.role_id ",
      "JOIN ", @v1_cenozo, ".service v1_service ON v1_service_has_role.service_id = v1_service.id ",
      "WHERE application_type.name = 'cedar' ",
      "AND v1_service.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Importing cohorts from v1" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".application_has_cohort( ",
        "update_timestamp, create_timestamp, application_id, cohort_id, grouping ) ",
      "SELECT v1_service_has_cohort.update_timestamp, v1_service_has_cohort.create_timestamp, ",
        "application.id, cohort.id, v1_service_has_cohort.grouping ",
      "FROM ", @cenozo, ".application "
      "CROSS JOIN ", @cenozo, ".cohort ",
      "JOIN ", @v1_cenozo, ".cohort v1_cohort ON cohort.name = v1_cohort.name ",
      "JOIN ", @v1_cenozo, ".service_has_cohort v1_service_has_cohort ",
        "ON v1_cohort.id = v1_service_has_cohort.cohort_id ",
      "JOIN ", @v1_cenozo, ".service v1_service ON v1_service_has_cohort.service_id = v1_service.id ",
       "AND application.name = v1_service.name ",
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
      "JOIN ", @v1_cenozo, ".service v1_service ON v1_site.service_id = v1_service.id ",
      "JOIN ", @cenozo, ".application ON v1_service.name = application.name ",
      "WHERE application.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Importing region-sites from v1" AS "";

    SET @sql = CONCAT(
      "SELECT COUNT(*) INTO @test FROM ", @cenozo, ".region_site ",
      "JOIN ", @cenozo, ".application_has_site ON region_site.site_id = application_has_site.site_id ",
      "JOIN ", @cenozo, ".application ON application_has_site.application_id = application.id ",
      "WHERE application.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "REPLACE INTO ", @cenozo, ".region_site( ",
          "update_timestamp, create_timestamp, site_id, region_id, language_id ) ",
        "SELECT v1_region_site.update_timestamp, v1_region_site.create_timestamp, ",
          "site.id, region.id, language.id ",
        "FROM ", @cenozo, ".site ",
        "CROSS JOIN ", @cenozo, ".region ",
        "CROSS JOIN ", @cenozo, ".language ",
        "JOIN ", @v1_cenozo, ".site v1_site ON site.name = CONCAT( v1_site.name, ' REC' ) ",
        "JOIN ", @v1_cenozo, ".region v1_region ON region.name = v1_region.name ",
        "JOIN ", @v1_cenozo, ".language v1_language ON language.name = v1_language.name ",
        "JOIN ", @v1_cenozo, ".region_site v1_region_site ",
          "ON v1_site.id = v1_region_site.site_id ",
         "AND v1_region.id = v1_region_site.region_id ",
         "AND v1_language.id = v1_region_site.language_id ",
        "JOIN ", @v1_cenozo, ".service v1_service ON v1_region_site.service_id = v1_service.id ",
        "WHERE v1_service.name = '", @application, "'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Importing user settings from v1" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO setting( site_id, max_working_transcriptions ) ",
      "SELECT site.id, 1 ",
      "FROM ", @cenozo, ".site "
      "JOIN ", @cenozo, ".application_has_site ON site.id = application_has_site.site_id ",
      "JOIN ", @cenozo, ".application ON application_has_site.application_id = application.id ",
      "WHERE application.name = '", @application, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO user_has_cohort( update_timestamp, create_timestamp, user_id, cohort_id ) ",
      "SELECT v1_user_has_cohort.update_timestamp, v1_user_has_cohort.create_timestamp, user.id, cohort.id ",
      "FROM access ",
      "CROSS JOIN ", @cenozo, ".cohort ",
      "JOIN ", @cenozo, ".user ON access.user_id = user.id ",
      "JOIN ", @v1_cenozo, ".user v1_user ON user.name = v1_user.name ",
      "JOIN ", @v1_cenozo, ".cohort v1_cohort ON cohort.name = v1_cohort.name ",
      "JOIN ", @v1_cedar, ".user_has_cohort v1_user_has_cohort ",
        "ON v1_user.id = v1_user_has_cohort.user_id ",
       "AND v1_cohort.id = v1_user_has_cohort.cohort_id" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO user_has_language( update_timestamp, create_timestamp, user_id, language_id ) ",
      "SELECT user_has_language.update_timestamp, user_has_language.create_timestamp, ",
             "user_has_language.user_id, language_id ",
      "FROM ", @cenozo, ".user_has_language ",
      "JOIN access ON user_has_language.user_id = access.user_id" );
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

    SET @test = ( SELECT COUNT(*) FROM word );

    IF @test = 0 THEN
      SELECT "Importing primary words from v1" AS "";

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, 'primary', NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'Animal_Name_Primary'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, 'primary' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name LIKE '_\_Words\_Primary' ",
        "ON DUPLICATE KEY UPDATE fas = 'primary'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Importing intrusion words from v1" AS "";

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, 'intrusion', NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'Animal_Name_Intrusion' ",
        "ON DUPLICATE KEY UPDATE aft = 'intrusion'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, 'intrusion' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'A_Words_Intrusion' ",
        "AND SUBSTRING( word, 1, 1 ) = 'a' ",
        "ON DUPLICATE KEY UPDATE fas = 'intrusion'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, 'intrusion' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'F_Words_Intrusion' ",
        "AND SUBSTRING( word, 1, 1 ) = 'f' ",
        "ON DUPLICATE KEY UPDATE fas = 'intrusion'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, 'intrusion' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'S_Words_Intrusion' ",
        "AND SUBSTRING( word, 1, 1 ) = 's' ",
        "ON DUPLICATE KEY UPDATE fas = 'intrusion'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'REY_Intrusion'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Importing variant words from v1" AS "";

      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, NULL, NULL, NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'Animal_Name_Variant'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, NULL, NULL, NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name LIKE '_\_Words\_Variant'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, NULL, NULL, NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'REY_Variant'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Importing misspelled words from v1" AS "";

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, true, 'invalid', 'invalid' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'Animal_Name_Mispelled' ",
        "ON DUPLICATE KEY UPDATE misspelled = ",
          "IF( fas IS NULL, true, misspelled ), ",
          "aft = 'invalid', ",
          "fas = IFNULL( fas, 'invalid' )" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, true, 'invalid', 'invalid' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'A_Words_Mispelled' ",
        "AND SUBSTRING( word, 1, 1 ) = 'a' ",
        "ON DUPLICATE KEY UPDATE misspelled = ",
          "IF( aft IS NULL, true, misspelled ), ",
          "aft = IFNULL( aft, 'invalid' ), ",
          "fas = 'invalid'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, true, 'invalid', 'invalid' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'F_Words_Mispelled' ",
        "AND SUBSTRING( word, 1, 1 ) = 'f' ",
        "ON DUPLICATE KEY UPDATE misspelled = ",
          "IF( aft IS NULL, true, misspelled ), ",
          "aft = IFNULL( aft, 'invalid' ), ",
          "fas = 'invalid'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, true, 'invalid', 'invalid' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'S_Words_Mispelled' ",
        "AND SUBSTRING( word, 1, 1 ) = 's' ",
        "ON DUPLICATE KEY UPDATE misspelled = ",
          "IF( aft IS NULL, true, misspelled ), ",
          "aft = IFNULL( aft, 'invalid' ), ",
          "fas = 'invalid'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, true, 'invalid', 'invalid' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'REY_Mispelled'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      DELETE FROM word WHERE word IN( '-', '--' );
    END IF;

  END //
DELIMITER ;

CALL import_cedar();
DROP PROCEDURE IF EXISTS import_cedar;
