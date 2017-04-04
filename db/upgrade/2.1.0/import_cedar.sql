DROP PROCEDURE IF EXISTS import_rey_word;
DELIMITER //
CREATE PROCEDURE import_rey_word( rank INT, word VARCHAR(7) )
  BEGIN

    SELECT CONCAT( "Imporing REY '", word, "' data from v1" ) AS "";

    SET @sql = CONCAT(
      "INSERT INTO rey_data( update_timestamp, create_timestamp, test_entry_id, language_id, ", word, " ) ",
      "SELECT v1_test_entry_ranked_word.update_timestamp, v1_test_entry_ranked_word.create_timestamp, ",
             "test_entry.id, language_id, selection = 'yes' ",
      "FROM ", @v1_cedar, ".test_entry_ranked_word as v1_test_entry_ranked_word ",
      "JOIN ", @v1_cedar, ".ranked_word_set AS v1_ranked_word_set ",
        "ON v1_test_entry_ranked_word.ranked_word_set_id = v1_ranked_word_set.id ",
      "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "ON v1_test_entry_ranked_word.test_entry_id = v1_test_entry.id ",
      "JOIN ", @v1_cedar, ".assignment AS v1_assignment ",
        "ON v1_test_entry.assignment_id = v1_assignment.id ",
      "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
      "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
      "JOIN test_type ON test_entry.test_type_id = test_type.id ",
      "JOIN ", @v1_cedar, ".test AS v1_test ",
        "ON v1_test_entry.test_id = v1_test.id ",
      "JOIN ", @v1_cedar, ".test_entry_has_language AS v1_test_entry_has_language ",
        "ON v1_test_entry.id = v1_test_entry_has_language.test_entry_id ",
      "WHERE test_type.name = 'Immediate Word List (REY1)' ",
      "AND v1_test.name = 'REY' ",
      "AND v1_ranked_word_set.rank = ", rank, " ",
      "AND v1_test_entry_ranked_word.selection IN( 'yes', 'no' ) ",
      "ON DUPLICATE KEY UPDATE ", word, " = VALUES( ", word, " )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO rey_data( update_timestamp, create_timestamp, ",
        "test_entry_id, language_id, ", word, "_rey_data_variant_id ) ",
      "SELECT v1_test_entry_ranked_word.update_timestamp, v1_test_entry_ranked_word.create_timestamp, ",
             "test_entry.id, v1_test_entry_has_language.language_id, rey_data_variant.id ",
      "FROM ", @v1_cedar, ".test_entry_ranked_word as v1_test_entry_ranked_word ",
      "JOIN ", @v1_cedar, ".ranked_word_set AS v1_ranked_word_set ",
        "ON v1_test_entry_ranked_word.ranked_word_set_id = v1_ranked_word_set.id ",
      "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "ON v1_test_entry_ranked_word.test_entry_id = v1_test_entry.id ",
      "JOIN ", @v1_cedar, ".assignment AS v1_assignment ",
        "ON v1_test_entry.assignment_id = v1_assignment.id ",
      "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
      "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
      "JOIN test_type ON test_entry.test_type_id = test_type.id ",
      "JOIN ", @v1_cedar, ".test AS v1_test ",
        "ON v1_test_entry.test_id = v1_test.id ",
      "JOIN ", @v1_cedar, ".test_entry_has_language AS v1_test_entry_has_language ",
        "ON v1_test_entry.id = v1_test_entry_has_language.test_entry_id ",
      "JOIN ", @v1_cedar, ".word AS v1_word ",
        "ON v1_test_entry_ranked_word.word_id = v1_word.id ",
      "JOIN rey_data_variant ON v1_word.word = rey_data_variant.variant ",
       "AND v1_test_entry_has_language.language_id = rey_data_variant.language_id ",
      "WHERE test_type.name = 'Immediate Word List (REY1)' ",
      "AND v1_test.name = 'REY' ",
      "AND v1_ranked_word_set.rank = ", rank, " ",
      "AND v1_test_entry_ranked_word.selection = 'variant' ",
      "ON DUPLICATE KEY UPDATE ", word, "_rey_data_variant_id = VALUES( ", word, "_rey_data_variant_id )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO rey_data_has_word( update_timestamp, create_timestamp, rey_data_id, word_id ) ",
      "SELECT v1_test_entry_ranked_word.update_timestamp, v1_test_entry_ranked_word.create_timestamp, ",
             "rey_data.id, word.id ",
      "FROM ", @v1_cedar, ".test_entry_ranked_word as v1_test_entry_ranked_word ",
      "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "ON v1_test_entry_ranked_word.test_entry_id = v1_test_entry.id ",
      "JOIN ", @v1_cedar, ".assignment AS v1_assignment ",
        "ON v1_test_entry.assignment_id = v1_assignment.id ",
      "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
      "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
      "JOIN rey_data ON test_entry.id = rey_data.test_entry_id ",
      "JOIN test_type ON test_entry.test_type_id = test_type.id ",
      "JOIN ", @v1_cedar, ".test AS v1_test ",
        "ON v1_test_entry.test_id = v1_test.id ",
      "JOIN ", @v1_cedar, ".word AS v1_word ",
        "ON v1_test_entry_ranked_word.word_id = v1_word.id ",
      "JOIN word ON v1_word.language_id = word.language_id AND v1_word.word = word.word ",
      "WHERE test_type.name = 'Immediate Word List (REY1)' ",
      "AND v1_test.name = 'REY' ",
      "AND v1_test_entry_ranked_word.selection IS NULL" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO rey_data( update_timestamp, create_timestamp, test_entry_id, language_id, ", word, " ) ",
      "SELECT v1_test_entry_ranked_word.update_timestamp, v1_test_entry_ranked_word.create_timestamp, ",
             "test_entry.id, language_id, selection = 'yes' ",
      "FROM ", @v1_cedar, ".test_entry_ranked_word as v1_test_entry_ranked_word ",
      "JOIN ", @v1_cedar, ".ranked_word_set AS v1_ranked_word_set ",
        "ON v1_test_entry_ranked_word.ranked_word_set_id = v1_ranked_word_set.id ",
      "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "ON v1_test_entry_ranked_word.test_entry_id = v1_test_entry.id ",
      "JOIN ", @v1_cedar, ".assignment AS v1_assignment ",
        "ON v1_test_entry.assignment_id = v1_assignment.id ",
      "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
      "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
      "JOIN test_type ON test_entry.test_type_id = test_type.id ",
      "JOIN ", @v1_cedar, ".test AS v1_test ",
        "ON v1_test_entry.test_id = v1_test.id ",
      "JOIN ", @v1_cedar, ".test_entry_has_language AS v1_test_entry_has_language ",
        "ON v1_test_entry.id = v1_test_entry_has_language.test_entry_id ",
      "WHERE test_type.name = 'Delayed Word List (REY2)' ",
      "AND v1_test.name = 'REY II' ",
      "AND v1_ranked_word_set.rank = ", rank, " ",
      "AND v1_test_entry_ranked_word.selection IN( 'yes', 'no' ) ",
      "ON DUPLICATE KEY UPDATE ", word, " = VALUES( ", word, " )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO rey_data( update_timestamp, create_timestamp, ",
        "test_entry_id, language_id, ", word, "_rey_data_variant_id ) ",
      "SELECT v1_test_entry_ranked_word.update_timestamp, v1_test_entry_ranked_word.create_timestamp, ",
             "test_entry.id, v1_test_entry_has_language.language_id, rey_data_variant.id ",
      "FROM ", @v1_cedar, ".test_entry_ranked_word as v1_test_entry_ranked_word ",
      "JOIN ", @v1_cedar, ".ranked_word_set AS v1_ranked_word_set ",
        "ON v1_test_entry_ranked_word.ranked_word_set_id = v1_ranked_word_set.id ",
      "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "ON v1_test_entry_ranked_word.test_entry_id = v1_test_entry.id ",
      "JOIN ", @v1_cedar, ".assignment AS v1_assignment ",
        "ON v1_test_entry.assignment_id = v1_assignment.id ",
      "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
      "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
      "JOIN test_type ON test_entry.test_type_id = test_type.id ",
      "JOIN ", @v1_cedar, ".test AS v1_test ",
        "ON v1_test_entry.test_id = v1_test.id ",
      "JOIN ", @v1_cedar, ".test_entry_has_language AS v1_test_entry_has_language ",
        "ON v1_test_entry.id = v1_test_entry_has_language.test_entry_id ",
      "JOIN ", @v1_cedar, ".word AS v1_word ",
        "ON v1_test_entry_ranked_word.word_id = v1_word.id ",
      "JOIN rey_data_variant ON v1_word.word = rey_data_variant.variant ",
       "AND v1_test_entry_has_language.language_id = rey_data_variant.language_id ",
      "WHERE test_type.name = 'Delayed Word List (REY2)' ",
      "AND v1_test.name = 'REY II' ",
      "AND v1_ranked_word_set.rank = ", rank, " ",
      "AND v1_test_entry_ranked_word.selection = 'variant' ",
      "ON DUPLICATE KEY UPDATE ", word, "_rey_data_variant_id = VALUES( ", word, "_rey_data_variant_id )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO rey_data_has_word( update_timestamp, create_timestamp, rey_data_id, word_id ) ",
      "SELECT v1_test_entry_ranked_word.update_timestamp, v1_test_entry_ranked_word.create_timestamp, ",
             "rey_data.id, word.id ",
      "FROM ", @v1_cedar, ".test_entry_ranked_word as v1_test_entry_ranked_word ",
      "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "ON v1_test_entry_ranked_word.test_entry_id = v1_test_entry.id ",
      "JOIN ", @v1_cedar, ".assignment AS v1_assignment ",
        "ON v1_test_entry.assignment_id = v1_assignment.id ",
      "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
      "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
      "JOIN rey_data ON test_entry.id = rey_data.test_entry_id ",
      "JOIN test_type ON test_entry.test_type_id = test_type.id ",
      "JOIN ", @v1_cedar, ".test AS v1_test ",
        "ON v1_test_entry.test_id = v1_test.id ",
      "JOIN ", @v1_cedar, ".word AS v1_word ",
        "ON v1_test_entry_ranked_word.word_id = v1_word.id ",
      "JOIN word ON v1_word.language_id = word.language_id AND v1_word.word = word.word ",
      "WHERE test_type.name = 'Delayed Word List (REY2)' ",
      "AND v1_test.name = 'REY II' ",
      "AND v1_test_entry_ranked_word.selection IS NULL" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

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

    -- convert cedar v1 data to utf8 if any will be needed
    SET @existing_data_count = ( SELECT
      ( SELECT COUNT(*) FROM word ) +
      ( SELECT COUNT(*) FROM aft_data ) +
      ( SELECT COUNT(*) FROM fas_data ) +
      ( SELECT COUNT(*) FROM mat_data ) +
      ( SELECT COUNT(*) FROM rey_data )
    );

    IF @existing_data_count = 0 THEN
      SELECT "Converting old word table from latin1 to utf8" AS "";

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARCHAR(45) CHARACTER SET 'latin1' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARBINARY(45) NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
      
      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARCHAR(45) CHARACTER SET 'utf8' COLLATE 'utf8_bin' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

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
        "ON DUPLICATE KEY UPDATE fas = IFNULL( fas, 'intrusion' )" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, 'intrusion' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'F_Words_Intrusion' ",
        "ON DUPLICATE KEY UPDATE fas = IFNULL( fas, 'intrusion' )" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, 'intrusion' ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'S_Words_Intrusion' ",
        "ON DUPLICATE KEY UPDATE fas = IFNULL( fas, 'intrusion' )" );
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

      -- remove the placeholder words
      DELETE FROM word WHERE word IN( '-', '--' );

      -- correct any misspelled words that are also found in non-misspelled dictionaries
      SET @sql = CONCAT(
        "UPDATE word ",
        "JOIN ", @v1_cedar, ".word AS v1_word USING( language_id, word ) ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_word.dictionary_id = v1_dictionary.id ",
        "SET misspelled = 0, ",
            "aft = IF( v1_dictionary.name LIKE 'Animal%', 'intrusion', NULL ), ",
            "fas = IF( v1_dictionary.name LIKE '%_Words_%', 'intrusion', NULL ) ",
        "WHERE misspelled = 1 ",
        "AND v1_dictionary.name NOT LIKE '%mispelled%' ",
        "AND v1_dictionary.name NOT IN( 'alpha_numeric', 'confirmation' ) ",
        "AND CHAR_LENGTH( v1_word.word ) > 1" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

    END IF;

    SELECT "Importing assignments from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM transcription );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT IGNORE INTO transcription( ",
          "update_timestamp, create_timestamp, ",
          "user_id, participant_id, site_id, start_datetime, end_datetime ) ",
        "SELECT update_timestamp, create_timestamp, ",
               "IF( end_datetime IS NULL, user_id, NULL ), participant_id, site_id, start_datetime, end_datetime ",
        "FROM ", @v1_cedar, ".assignment AS v1_assignment" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Adding placedholders into the participant_sound_file_total table" AS "";

    SET @test = ( SELECT COUNT(*) FROM participant_sound_file_total );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT IGNORE INTO participant_sound_file_total( participant_id, total, datetime ) ",
        "SELECT participant_id, 0, CONVERT_TZ( recording.update_timestamp, 'Canada/Eastern', 'UTC' ) ",
        "FROM ", @v1_cedar, ".assignment ",
        "JOIN ", @v1_cedar, ".recording USING( participant_id ) ",
        "GROUP BY participant_id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Importing test-entries from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM test_entry );

    IF @test = 0 THEN
      -- test entries not including MAT-alphabet (data is added from both below)
      SET @sql = CONCAT(
        "INSERT IGNORE INTO test_entry( ",
          "update_timestamp, create_timestamp, ",
          "transcription_id, test_type_id, audio_status, participant_status, state ) ",
        "SELECT v1_test_entry.update_timestamp, v1_test_entry.create_timestamp, ",
               "transcription.id, test_type.id, audio_status, participant_status, ",
               "IF( 'requested' = deferred, 'deferred', IF( 'submitted' = completed, 'submitted', 'assigned' ) ) ",
        "FROM ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN test_type ON ( v1_test.rank <= 6 AND test_type.rank = v1_test.rank ) OR ( ",
          "v1_test.rank >= 8 AND test_type.rank >= 7 ",
          "AND test_type.name LIKE CONCAT( '%', substring( v1_test.name, 1, 3 ), '%' ) ",
        ")" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Updating transcription count columns" AS "";

      DROP TABLE IF EXISTS test_entry_count;
      CREATE TEMPORARY TABLE test_entry_count
      SELECT transcription_id,
             COUNT( IF( state="assigned", true, NULL ) ) AS assigned,
             COUNT( if( state="deferred", true, NULL ) ) AS deferred,
             COUNT( IF( state="submitted", true, NULL ) ) AS submitted
      FROM test_entry
      GROUP BY transcription_id;

      UPDATE transcription
      JOIN test_entry_count ON transcription.id = test_entry_count.transcription_id
      SET assigned_count = assigned,
          deferred_count = deferred,
          submitted_count = submitted;
    END IF;

    SELECT "Adding languages to test-entries" AS "";

    SET @test = ( SELECT COUNT(*) FROM test_entry_has_language );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT INTO test_entry_has_language( test_entry_id, language_id, update_timestamp, create_timestamp ) ",
        "SELECT test_entry.id, v1_test_entry_has_language.language_id, ",
               "v1_test_entry_has_language.update_timestamp, v1_test_entry_has_language.create_timestamp ",
        "FROM ", @v1_cedar, ".test_entry_has_language AS v1_test_entry_has_language ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_has_language.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN test_type ON ( v1_test.rank <= 6 AND test_type.rank = v1_test.rank ) OR ( ",
          "v1_test.rank >= 8 AND test_type.rank >= 7 ",
          "AND test_type.name LIKE CONCAT( '%', substring( v1_test.name, 1, 3 ), '%' ) ",
        ") ",
        "JOIN test_entry ON test_type.id = test_entry.test_type_id ",
         "AND transcription.id = test_entry.transcription_id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Adding mock entries to test_entry_activity" AS "";

    SET @test = ( SELECT COUNT(*) FROM test_entry_activity );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT INTO test_entry_activity( test_entry_id, user_id, start_datetime, end_datetime ) ",
        "SELECT test_entry.id, v1_assignment.user_id, ",
               "CONVERT_TZ( v1_test_entry.update_timestamp, 'Canada/Eastern', 'UTC' ), ",
               "CONVERT_TZ( v1_test_entry.update_timestamp, 'Canada/Eastern', 'UTC' ) ",
        "FROM ", @v1_cedar, ".test_entry AS v1_test_entry ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN test_type ON ( v1_test.rank <= 6 AND test_type.rank = v1_test.rank ) OR ( ",
          "v1_test.rank >= 8 AND test_type.rank >= 7 ",
          "AND test_type.name LIKE CONCAT( '%', substring( v1_test.name, 1, 3 ), '%' ) ",
        ") ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
         "AND test_type.id = test_entry.test_type_id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Importing AFT data from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM aft_data );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT IGNORE INTO aft_data( update_timestamp, create_timestamp, test_entry_id, rank, word_id ) ",
        "SELECT v1_test_entry_classification.update_timestamp, v1_test_entry_classification.create_timestamp, ",
               "test_entry.id, v1_test_entry_classification.rank, word.id ",
        "FROM ", @v1_cedar, ".test_entry_classification AS v1_test_entry_classification ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_classification.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "JOIN ", @v1_cedar, ".word AS v1_word ON v1_test_entry_classification.word_id = v1_word.id ",
        "LEFT JOIN word USING( language_id, word ) ", -- left because "-" is a placeholder
        "WHERE v1_test.name = 'AFT' ",
        "AND test_type.data_type = 'aft'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Importing FAS data from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM fas_data );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT IGNORE INTO fas_data( update_timestamp, create_timestamp, test_entry_id, rank, word_id ) ",
        "SELECT v1_test_entry_classification.update_timestamp, v1_test_entry_classification.create_timestamp, ",
               "test_entry.id, v1_test_entry_classification.rank, word.id ",
        "FROM ", @v1_cedar, ".test_entry_classification AS v1_test_entry_classification ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_classification.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "JOIN ", @v1_cedar, ".word AS v1_word ON v1_test_entry_classification.word_id = v1_word.id ",
        "LEFT JOIN word USING( language_id, word ) ", -- left because "-" is a placeholder
        "WHERE v1_test.name = 'FAS (f words)' ",
        "AND test_type.name = 'F-Word Fluency (FAS-F)'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO fas_data( update_timestamp, create_timestamp, test_entry_id, rank, word_id ) ",
        "SELECT v1_test_entry_classification.update_timestamp, v1_test_entry_classification.create_timestamp, ",
               "test_entry.id, v1_test_entry_classification.rank, word.id ",
        "FROM ", @v1_cedar, ".test_entry_classification AS v1_test_entry_classification ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_classification.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "JOIN ", @v1_cedar, ".word AS v1_word ON v1_test_entry_classification.word_id = v1_word.id ",
        "LEFT JOIN word USING( language_id, word ) ", -- left because "-" is a placeholder
        "WHERE v1_test.name = 'FAS (a words)' ",
        "AND test_type.name = 'A-Word Fluency (FAS-A)'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO fas_data( update_timestamp, create_timestamp, test_entry_id, rank, word_id ) ",
        "SELECT v1_test_entry_classification.update_timestamp, v1_test_entry_classification.create_timestamp, ",
               "test_entry.id, v1_test_entry_classification.rank, word.id ",
        "FROM ", @v1_cedar, ".test_entry_classification AS v1_test_entry_classification ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_classification.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "JOIN ", @v1_cedar, ".word AS v1_word ON v1_test_entry_classification.word_id = v1_word.id ",
        "LEFT JOIN word USING( language_id, word ) ", -- left because "-" is a placeholder
        "WHERE v1_test.name = 'FAS (s words)' ",
        "AND test_type.name = 'S-Word Fluency (FAS-S)'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Importing pre-MAT data from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM premat_data );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT IGNORE INTO premat_data( update_timestamp, create_timestamp, test_entry_id, counting ) ",
        "SELECT v1_test_entry_confirmation.update_timestamp, v1_test_entry_confirmation.create_timestamp, ",
               "test_entry.id, v1_test_entry_confirmation.confirmation ",
        "FROM ", @v1_cedar, ".test_entry_confirmation AS v1_test_entry_confirmation ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_confirmation.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "WHERE test_type.data_type = 'premat' ",
        "AND v1_test.name = 'MAT (counting)'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT INTO premat_data( update_timestamp, create_timestamp, test_entry_id, alphabet ) ",
        "SELECT v1_test_entry_confirmation.update_timestamp, v1_test_entry_confirmation.create_timestamp, ",
               "test_entry.id, v1_test_entry_confirmation.confirmation ",
        "FROM ", @v1_cedar, ".test_entry_confirmation AS v1_test_entry_confirmation ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_confirmation.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "WHERE test_type.data_type = 'premat' ",
        "AND v1_test.name = 'MAT (alphabet)' ",
        "ON DUPLICATE KEY UPDATE alphabet = v1_test_entry_confirmation.confirmation" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Importing MAT data from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM mat_data );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT IGNORE INTO mat_data( update_timestamp, create_timestamp, test_entry_id, rank, value ) ",
        "SELECT v1_test_entry_alpha_numeric.update_timestamp, v1_test_entry_alpha_numeric.create_timestamp, ",
               "test_entry.id, v1_test_entry_alpha_numeric.rank, v1_word.word ",
        "FROM ", @v1_cedar, ".test_entry_alpha_numeric AS v1_test_entry_alpha_numeric ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_alpha_numeric.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON transcription.participant_id = v1_assignment.participant_id ",
        "JOIN test_entry ON transcription.id = test_entry.transcription_id ",
        "JOIN test_type ON test_entry.test_type_id = test_type.id ",
        "JOIN ", @v1_cedar, ".word AS v1_word ON v1_test_entry_alpha_numeric.word_id = v1_word.id ",
        "WHERE test_type.data_type = 'mat'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SET @test = ( SELECT COUNT(*) FROM rey_data );

    IF @test = 0 THEN
      CALL import_rey_word( 1, "drum" );
      CALL import_rey_word( 2, "curtain" );
      CALL import_rey_word( 3, "bell" );
      CALL import_rey_word( 4, "coffee" );
      CALL import_rey_word( 5, "school" );
      CALL import_rey_word( 6, "parent" );
      CALL import_rey_word( 7, "moon" );
      CALL import_rey_word( 8, "garden" );
      CALL import_rey_word( 9, "hat" );
      CALL import_rey_word( 10, "farmer" );
      CALL import_rey_word( 11, "nose" );
      CALL import_rey_word( 12, "turkey" );
      CALL import_rey_word( 13, "colour" );
      CALL import_rey_word( 14, "house" );
      CALL import_rey_word( 15, "river" );
    END IF;

    SELECT "Deleting no-response words from dictionary and data" AS "";

    CREATE TEMPORARY TABLE delete_word
    SELECT id FROM word
    -- remove special "no response" words"
    WHERE word IN ( "participant provided no responses", "participant could not think of any words" )
    -- remove words that don't start with a letter
    OR word RLIKE "^[- ']"
    -- remove words that don't end with a letter
    OR word RLIKE "[- ']$"
    -- remove english words with invalid characters
    OR ( word RLIKE "[^- 'a-z]" AND misspelled = 1 );

    DELETE FROM aft_data
    WHERE word_id IN ( SELECT id FROM delete_word );

    DELETE FROM fas_data
    WHERE word_id IN ( SELECT id FROM delete_word );

    DELETE FROM word
    WHERE id IN ( SELECT id FROM delete_word );

    IF @existing_data_count = 0 THEN

      SELECT "Converting old word table back from utf8 to latin1" AS "";

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARBINARY(45) NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
      
      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARCHAR(45) CHARACTER SET 'latin1' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
      
      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARCHAR(45) CHARACTER SET 'latin1' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".word ",
        "MODIFY word VARCHAR(45) CHARACTER SET 'utf8' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

    END IF;
  END //
DELIMITER ;

CALL import_cedar();
DROP PROCEDURE IF EXISTS import_cedar;
