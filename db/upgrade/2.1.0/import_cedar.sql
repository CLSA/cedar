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
      "AND ( ",
        "v1_test_entry_ranked_word.selection IN( 'yes', 'no' ) OR ",
        "( v1_test_entry_ranked_word.word_id IS NULL AND v1_test_entry_ranked_word.word_id IS NULL ) ",
      ") ",
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
      "JOIN word ON v1_word.language_id = word.language_id AND v1_word.word = word.word ",
      "JOIN rey_data_variant ON word.id = rey_data_variant.word_id ",
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
      "AND ( ",
        "v1_test_entry_ranked_word.selection IN( 'yes', 'no' ) OR ",
        "( v1_test_entry_ranked_word.word_id IS NULL AND v1_test_entry_ranked_word.word_id IS NULL ) ",
      ") ",
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
      "JOIN word ON v1_word.language_id = word.language_id AND v1_word.word = word.word ",
      "JOIN rey_data_variant ON word.id = rey_data_variant.word_id ",
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

    SET @sql = CONCAT(
      "UPDATE rey_data ",
      "JOIN rey_data_has_word ON rey_data.id = rey_data_has_word.rey_data_id ",
      "JOIN word ON rey_data_has_word.word_id = word.id ",
      "JOIN word AS sister_word ON word.sister_word_id = sister_word.id ",
      "SET rey_data.", word, " = 1 ",
      "WHERE sister_word.word = '", word, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    DROP TABLE IF EXISTS word_list;
    CREATE TEMPORARY TABLE word_list
    SELECT word.id
    FROM word
    JOIN word AS sister_word ON word.sister_word_id = sister_word.id
    WHERE sister_word.word = word;
    ALTER TABLE word_list ADD INDEX dk_id( id );

    DELETE FROM rey_data_has_word WHERE word_id IN ( SELECT id FROM word_list );

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

      SELECT "Converting old test_entry_note table from latin1 to utf8" AS "";

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".test_entry_note ",
        "MODIFY note TEXT CHARACTER SET 'latin1' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".test_entry_note ",
        "MODIFY note BLOB NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".test_entry_note ",
        "MODIFY note TEXT CHARACTER SET 'utf8' COLLATE 'utf8_bin' NOT NULL" );
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
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, language_id, word, 0, NULL, NULL ",
        "FROM ", @v1_cedar, ".word AS v1_word ",
        "JOIN ", @v1_cedar, ".dictionary AS v1_dictionary ON v1_dictionary.id = v1_word.dictionary_id ",
        "WHERE v1_dictionary.name = 'REY_Variant'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Importing misspelled words from v1" AS "";

      SET @sql = CONCAT(
        "INSERT INTO word( update_timestamp, create_timestamp, language_id, word, misspelled, aft, fas ) ",
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, ",
          "language_id, word, true, 'invalid', 'invalid' ",
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
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, ",
          "language_id, word, true, 'invalid', 'invalid' ",
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
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, ",
          "language_id, word, true, 'invalid', 'invalid' ",
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
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, ",
          "language_id, word, true, 'invalid', 'invalid' ",
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
        "SELECT v1_word.update_timestamp, v1_word.create_timestamp, ",
          "language_id, word, true, 'invalid', 'invalid' ",
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

    SET @test = ( SELECT COUNT(*) FROM rey_data_variant );

    IF @test = 0 THEN
      SELECT "Importing REY variant words from v1" AS "";

      SET @sql = CONCAT( "SELECT id INTO @en_language_id FROM ", @cenozo, ".language WHERE code = 'en'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT( "SELECT id INTO @fr_language_id FROM ", @cenozo, ".language WHERE code = 'fr'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- make sure all REY words are already in the dictionary
      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( language_id, word, misspelled ) ",
        "SELECT language.id, temp.word, 0 ",
        "FROM ", @cenozo, ".language, ( ",
          "SELECT 'armour' AS word UNION ",
          "SELECT 'ball' AS word UNION ",
          "SELECT 'bell' AS word UNION ",
          "SELECT 'certain' AS word UNION ",
          "SELECT 'coffee' AS word UNION ",
          "SELECT 'collar' AS word UNION ",
          "SELECT 'colour' AS word UNION ",
          "SELECT 'cool' AS word UNION ",
          "SELECT 'curtain' AS word UNION ",
          "SELECT 'drub' AS word UNION ",
          "SELECT 'drum' AS word UNION ",
          "SELECT 'dumb' AS word UNION ",
          "SELECT 'farmer' AS word UNION ",
          "SELECT 'former' AS word UNION ",
          "SELECT 'garden' AS word UNION ",
          "SELECT 'hat' AS word UNION ",
          "SELECT 'house' AS word UNION ",
          "SELECT 'moon' AS word UNION ",
          "SELECT 'nose' AS word UNION ",
          "SELECT 'river' AS word UNION ",
          "SELECT 'school' AS word UNION ",
          "SELECT 'turkey' AS word ",
        ") AS temp ",
        "WHERE language.code = 'en'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO word( language_id, word, misspelled ) ",
        "SELECT language.id, temp.word, 0 ",
        "FROM ", @cenozo, ".language, ( ",
          "SELECT 'café' AS word UNION ",
          "SELECT 'chapeau' AS word UNION ",
          "SELECT 'cloche' AS word UNION ",
          "SELECT 'colle' AS word UNION ",
          "SELECT 'couleur' AS word UNION ",
          "SELECT 'couleuvre' AS word UNION ",
          "SELECT 'dinde' AS word UNION ",
          "SELECT 'école' AS word UNION ",
          "SELECT 'fermier' AS word UNION ",
          "SELECT 'jardin' AS word UNION ",
          "SELECT 'lit d\\’eau' AS word UNION ",
          "SELECT 'lune' AS word UNION ",
          "SELECT 'maison' AS word UNION ",
          "SELECT 'nez' AS word UNION ",
          "SELECT 'rideau' AS word UNION ",
          "SELECT 'rivière' AS word UNION ",
          "SELECT 'tambour' AS word ",
        ") AS temp ",
        "WHERE language.code = 'fr'" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Importing rey-data variant words" AS "";

      SET @sql = CONCAT(
        "INSERT IGNORE INTO rey_data_variant( word, language_id, word_id ) ",
        "SELECT word.word, ", @en_language_id, ", variant_word.id ",
        "FROM word ",
        "JOIN ", @cenozo, ".language ON word.language_id = language.id ",
        "CROSS JOIN word AS variant_word ",
        "JOIN ", @cenozo, ".language AS variant_language ON variant_word.language_id = variant_language.id ",
        "WHERE language.code = 'en' AND ( ",
          "word.word = 'drum' AND ( ",
            "( variant_language.code = 'en' AND variant_word.word IN ( 'dumb', 'drub' ) ) OR "
            "( variant_language.code = 'fr' AND variant_word.word = 'tambour' ) "
          ") ",
        ") OR ( ",
          "word.word = 'curtain' AND ( ",
            "( variant_language.code = 'en' AND variant_word.word = 'certain' ) OR "
            "( variant_language.code = 'fr' AND variant_word.word = 'rideau' ) "
          ") ",
        ") OR ( ",
          "word.word = 'bell' AND ( ",
            "( variant_language.code = 'en' AND variant_word.word = 'ball' ) OR "
            "( variant_language.code = 'fr' AND variant_word.word = 'cloche' ) "
          ") ",
        ") OR ( ",
          "word.word = 'coffee' AND variant_language.code = 'fr' AND variant_word.word = 'café' ",
        ") OR ( ",
          "word.word = 'school' AND ( ",
            "( variant_language.code = 'en' AND variant_word.word = 'cool' ) OR "
            "( variant_language.code = 'fr' AND variant_word.word = 'école' ) "
          ") ",
        ") OR ( ",
          "word.word = 'moon' AND variant_language.code = 'fr' AND variant_word.word = 'lune' ",
        ") OR ( ",
          "word.word = 'garden' AND variant_language.code = 'fr' AND variant_word.word = 'jardin' ",
        ") OR ( ",
          "word.word = 'hat' AND variant_language.code = 'fr' AND variant_word.word = 'chapeau' ",
        ") OR ( ",
          "word.word = 'farmer' AND ( ",
            "( variant_language.code = 'en' AND variant_word.word IN ( 'former', 'armour' ) ) OR "
            "( variant_language.code = 'fr' AND variant_word.word = 'fermier' ) "
          ") ",
        ") OR ( ",
          "word.word = 'nose' AND variant_language.code = 'fr' AND variant_word.word = 'nez' ",
        ") OR ( ",
          "word.word = 'turkey' AND variant_language.code = 'fr' AND variant_word.word = 'dinde' ",
        ") OR ( ",
          "word.word = 'colour' AND ( ",
            "( variant_language.code = 'en' AND variant_word.word = 'collar' ) OR "
            "( variant_language.code = 'fr' AND variant_word.word = 'couleur' ) "
          ") ",
        ") OR ( ",
          "word.word = 'house' AND variant_language.code = 'fr' AND variant_word.word = 'maison' ",
        ") OR ( ",
          "word.word = 'river' AND variant_language.code = 'fr' AND variant_word.word = 'rivière' ",
        ")" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "INSERT IGNORE INTO rey_data_variant( word, language_id, word_id ) ",
        "SELECT word.word, ", @fr_language_id, ", variant_word.id ",
        "FROM word ",
        "JOIN ", @cenozo, ".language ON word.language_id = language.id ",
        "CROSS JOIN word AS variant_word ",
        "JOIN ", @cenozo, ".language AS variant_language ON variant_word.language_id = variant_language.id ",
        "WHERE language.code = 'en' AND ( ",
          "word.word = 'drum' AND variant_language.code = 'en' AND variant_word.word = 'drum' "
        ") OR ( ",
          "word.word = 'curtain' AND ( ",
            "( variant_language.code = 'fr' AND variant_word.word = 'lit d\\'eau' ) OR ",
            "( variant_language.code = 'en' AND variant_word.word = 'curtain' ) ",
          ") ",
        ") OR ( ",
          "word.word = 'bell' AND variant_language.code = 'en' AND variant_word.word = 'bell' ",
        ") OR ( ",
          "word.word = 'coffee' AND variant_language.code = 'en' AND variant_word.word = 'coffee' ",
        ") OR ( ",
          "word.word = 'school' AND ( ",
            "( variant_language.code = 'fr' AND variant_word.word = 'colle' ) OR ",
            "( variant_language.code = 'en' AND variant_word.word = 'school' ) ",
          ") ",
        ") OR ( ",
          "word.word = 'moon' AND variant_language.code = 'en' AND variant_word.word = 'moon' ",
        ") OR ( ",
          "word.word = 'garden' AND variant_language.code = 'en' AND variant_word.word = 'garden' ",
        ") OR ( ",
          "word.word = 'hat' AND variant_language.code = 'en' AND variant_word.word = 'hat' ",
        ") OR ( ",
          "word.word = 'farmer' AND variant_language.code = 'en' AND variant_word.word = 'farmer' ",
        ") OR ( ",
          "word.word = 'nose' AND variant_language.code = 'en' AND variant_word.word = 'nose' ",
        ") OR ( ",
          "word.word = 'turkey' AND variant_language.code = 'en' AND variant_word.word = 'turkey' ",
        ") OR ( ",
          "word.word = 'colour' AND ( ",
            "( variant_language.code = 'fr' AND variant_word.word = 'couleuvre' ) OR ",
            "( variant_language.code = 'en' AND variant_word.word = 'colour' ) ",
          ") ",
        ") OR ( ",
          "word.word = 'house' AND variant_language.code = 'en' AND variant_word.word = 'house' ",
        ") OR ( ",
          "word.word = 'river' AND variant_language.code = 'en' AND variant_word.word = 'river' ",
        ")" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Making sure all rey-word sister words are present" AS "";

      SET @sql = CONCAT(
        "INSERT INTO word( language_id, word, sister_word_id, misspelled ) ",
        "SELECT language.id, temp.word, temp.sister_word_id, 0 ",
        "FROM ", @cenozo, ".language, ( ",
          "SELECT 'drums' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'drum' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'curtains' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'curtain' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'bells' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'bell' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'coffees' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'coffee' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'schooled' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'school' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'schooling' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'school' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'schools' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'school' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'parents' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'parent' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'parenting' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'parent' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'moons' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'moon' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'gardens' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'garden' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'gardening' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'garden' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'hats' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'hat' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'farmers' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'farmer' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'noses' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'nose' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'turkeys' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'turkey' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'colours' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'colour' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'coloured' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'colour' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'colouring' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'colour' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'houses' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'house' AND language_id = ", @en_language_id, " UNION ",
          "SELECT 'rivers' AS word, word.id AS sister_word_id FROM word ",
            "WHERE word = 'river' AND language_id = ", @en_language_id, " ",
        ") AS temp ",
        "WHERE language.code = 'en' ",
        "ON DUPLICATE KEY UPDATE sister_word_id = temp.sister_word_id" );
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

    SELECT "Importing test-entry notes from v1" AS "";

    SET @test = ( SELECT COUNT(*) FROM test_entry_note );

    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT INTO test_entry_note( ",
          "update_timestamp, create_timestamp, test_entry_id, user_id, sticky, datetime, note ) ",
        "SELECT v1_test_entry_note.update_timestamp, v1_test_entry_note.create_timestamp, ",
          "test_entry.id, v1_test_entry_note.user_id, v1_test_entry_note.sticky, ",
          "v1_test_entry_note.datetime, v1_test_entry_note.note ",
        "FROM ", @v1_cedar, ".test_entry_note AS v1_test_entry_note ",
        "JOIN ", @v1_cedar, ".test_entry AS v1_test_entry ",
          "ON v1_test_entry_note.test_entry_id = v1_test_entry.id ",
        "JOIN ", @v1_cedar, ".assignment AS v1_assignment ON v1_test_entry.assignment_id = v1_assignment.id ",
        "JOIN transcription ON v1_assignment.participant_id = transcription.participant_id ",
        "JOIN ", @v1_cedar, ".test AS v1_test ON v1_test_entry.test_id = v1_test.id ",
        "JOIN test_type ON ( v1_test.rank <= 6 AND test_type.rank = v1_test.rank ) OR ",
          "( v1_test.rank = 7 AND test_type.rank = 6 ) OR ( ",
          "v1_test.rank >= 8 AND test_type.rank >= 7 ",
          "AND test_type.name LIKE CONCAT( '%', substring( v1_test.name, 1, 3 ), '%' ) ",
        ") ",
        "JOIN test_entry ON test_type.id = test_entry.test_type_id ",
         "AND transcription.id = test_entry.transcription_id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
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
        "MODIFY word VARCHAR(45) CHARACTER SET 'utf8' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SELECT "Converting old test_entry_note table back from utf8 to latin1" AS "";

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".test_entry_note ",
        "MODIFY note BLOB NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".test_entry_note ",
        "MODIFY note TEXT CHARACTER SET 'latin1' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = CONCAT(
        "ALTER TABLE ", @v1_cedar, ".test_entry_note ",
        "MODIFY note TEXT CHARACTER SET 'utf8' NOT NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Deleting no-response words from dictionary and data" AS "";

    SET @sql = CONCAT(
      "CREATE TEMPORARY TABLE delete_word ",
      "SELECT word.id FROM word ",
      "JOIN ", @cenozo, ".language ON word.language_id = language.id ",
      -- remove special 'no response' words'
      "WHERE word IN ( 'participant provided no responses', 'participant could not think of any words' ) ",
      -- remove words that don't start with a letter
      "OR word RLIKE \"^[- ']\" ",
      -- remove words that don't end with a letter
      "OR word RLIKE \"[- ']$\" ",
      -- remove english words with invalid characters
      "OR ( language.code = 'en' AND word RLIKE \"[^- 'a-z]\" AND misspelled = 1 )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    ALTER TABLE delete_word ADD PRIMARY KEY (id);

    DELETE FROM aft_data
    WHERE word_id IN ( SELECT id FROM delete_word );

    DELETE FROM fas_data
    WHERE word_id IN ( SELECT id FROM delete_word );

    DELETE FROM word
    WHERE id IN ( SELECT id FROM delete_word );

    UPDATE word SET fas = 'intrusion'
    WHERE SUBSTRING( word, 1, 1 ) NOT IN ( 'f', 'a', 'à', 'â', 'ä', 's' )
    AND IFNULL( misspelled, 0 ) != 1;

    SELECT "Score existing test-entries" AS "";

    DROP TABLE IF EXISTS test_entry_score;
    CREATE TEMPORARY TABLE test_entry_score (
      id INT UNSIGNED NOT NULL,
      score INT UNSIGNED DEFAULT NULL,
      alt_score INT UNSIGNED DEFAULT NULL,
      PRIMARY KEY ( id )
    );

    INSERT INTO test_entry_score
    SELECT test_entry.id,
           IF( word_id IS NULL, 0, COUNT( DISTINCT IFNULL( sister_word_id, word_id ) ) ) AS score,
           NULL AS alt_score
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    LEFT JOIN fas_data ON test_entry.id = fas_data.test_entry_id
    LEFT JOIN word ON fas_data.word_id = word.id
    WHERE test_type.data_type = 'fas'
    AND 'submitted' = test_entry.state
    AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
    AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
    AND COALESCE( test_entry.participant_status, '' ) != 'refused'
    AND IFNULL( word.fas, 'primary' ) = 'primary'
    AND ( word.id IS NULL OR SUBSTRING( word.word, 1, 1 ) = LOWER( SUBSTRING( test_type.name, 1, 1 ) ) )
    GROUP BY test_entry.id;

    INSERT INTO test_entry_score
    SELECT test_entry.id,
           IF( drum OR drum_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( curtain OR curtain_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( bell OR bell_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( coffee OR coffee_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( school OR school_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( parent OR parent_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( moon OR moon_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( garden OR garden_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( hat OR hat_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( farmer OR farmer_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( nose OR nose_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( turkey OR turkey_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( colour OR colour_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( house OR house_rey_data_variant_id IS NOT NULL, 1, 0 ) +
           IF( river OR river_rey_data_variant_id IS NOT NULL, 1, 0 ) AS score,
           NULL AS alt_score
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    JOIN rey_data ON test_entry.id = rey_data.test_entry_id
    WHERE test_type.name LIKE '%(REY1)'
    AND 'submitted' = test_entry.state
    AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
    AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
    AND COALESCE( test_entry.participant_status, '' ) != 'refused';

    INSERT INTO test_entry_score
    SELECT test_entry.id,
           IF( ( rey_data.drum AND first_rey_data.drum_rey_data_variant_id IS NULL ) OR
               ( rey_data.drum_rey_data_variant_id = first_rey_data.drum_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.curtain AND first_rey_data.curtain_rey_data_variant_id IS NULL ) OR
               ( rey_data.curtain_rey_data_variant_id = first_rey_data.curtain_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.bell AND first_rey_data.bell_rey_data_variant_id IS NULL ) OR
               ( rey_data.bell_rey_data_variant_id = first_rey_data.bell_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.coffee AND first_rey_data.coffee_rey_data_variant_id IS NULL ) OR
               ( rey_data.coffee_rey_data_variant_id = first_rey_data.coffee_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.school AND first_rey_data.school_rey_data_variant_id IS NULL ) OR
               ( rey_data.school_rey_data_variant_id = first_rey_data.school_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.parent AND first_rey_data.parent_rey_data_variant_id IS NULL ) OR
               ( rey_data.parent_rey_data_variant_id = first_rey_data.parent_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.moon AND first_rey_data.moon_rey_data_variant_id IS NULL ) OR
               ( rey_data.moon_rey_data_variant_id = first_rey_data.moon_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.garden AND first_rey_data.garden_rey_data_variant_id IS NULL ) OR
               ( rey_data.garden_rey_data_variant_id = first_rey_data.garden_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.hat AND first_rey_data.hat_rey_data_variant_id IS NULL ) OR
               ( rey_data.hat_rey_data_variant_id = first_rey_data.hat_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.farmer AND first_rey_data.farmer_rey_data_variant_id IS NULL ) OR
               ( rey_data.farmer_rey_data_variant_id = first_rey_data.farmer_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.nose AND first_rey_data.nose_rey_data_variant_id IS NULL ) OR
               ( rey_data.nose_rey_data_variant_id = first_rey_data.nose_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.turkey AND first_rey_data.turkey_rey_data_variant_id IS NULL ) OR
               ( rey_data.turkey_rey_data_variant_id = first_rey_data.turkey_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.colour AND first_rey_data.colour_rey_data_variant_id IS NULL ) OR
               ( rey_data.colour_rey_data_variant_id = first_rey_data.colour_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.house AND first_rey_data.house_rey_data_variant_id IS NULL ) OR
               ( rey_data.house_rey_data_variant_id = first_rey_data.house_rey_data_variant_id ), 1, 0 ) +
           IF( ( rey_data.river AND first_rey_data.river_rey_data_variant_id IS NULL ) OR
               ( rey_data.river_rey_data_variant_id = first_rey_data.river_rey_data_variant_id ), 1, 0 ) AS score,
           NULL AS alt_score
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    JOIN rey_data ON test_entry.id = rey_data.test_entry_id
    JOIN test_entry AS first_test_entry ON first_test_entry.transcription_id = test_entry.transcription_id
    JOIN test_type AS first_test_type ON first_test_entry.test_type_id = first_test_type.id
    JOIN rey_data AS first_rey_data ON first_test_entry.id = first_rey_data.test_entry_id
    WHERE test_type.name LIKE '%(REY2)'
    AND first_test_type.name LIKE '%(REY1)'
    AND 'submitted' = test_entry.state
    AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
    AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
    AND COALESCE( test_entry.participant_status, '' ) != 'refused'
    AND COALESCE( first_test_entry.participant_status, '' ) NOT LIKE 'prompt%';

    INSERT INTO test_entry_score
    SELECT test_entry.id,
           IF( word_id IS NULL, 0, COUNT( DISTINCT IFNULL( animal_word_id, word_id ) ) ) AS score,
           IF( word_id IS NULL, 0, COUNT( DISTINCT word_id ) ) AS alt_score
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    LEFT JOIN aft_data ON test_entry.id = aft_data.test_entry_id
    LEFT JOIN word ON aft_data.word_id = word.id
    WHERE test_type.data_type = 'aft'
    AND 'submitted' = test_entry.state
    AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
    AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
    AND COALESCE( test_entry.participant_status, '' ) != 'refused'
    AND IFNULL( word.aft, 'primary' ) = 'primary'
    GROUP BY test_entry.id;

    INSERT INTO test_entry_score
    SELECT test_entry.id,
           IF( value != '1', NULL, 0 ) AS score,
           NULL AS alt_score
    FROM test_entry
    JOIN test_type ON test_entry.test_type_id = test_type.id
    LEFT JOIN mat_data ON test_entry.id = mat_data.test_entry_id AND mat_data.rank = 1
    WHERE test_type.data_type = 'mat'
    AND 'submitted' = test_entry.state
    AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
    AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
    AND COALESCE( test_entry.participant_status, '' ) != 'refused'
    GROUP BY test_entry.id;

    UPDATE test_entry_score
    JOIN test_entry USING( id )
    JOIN test_type ON test_entry.test_type_id = test_type.id
    SET test_entry_score.score = (
      SELECT COUNT(*)
      FROM mat_data
      WHERE test_entry_id = test_entry_score.id
      AND (
        ( rank = 2 AND value = 'a' ) OR ( rank = 3 AND value = '2' ) OR
        ( rank = 4 AND value = 'b' ) OR ( rank = 5 AND value = '3' ) OR
        ( rank = 6 AND value = 'c' ) OR ( rank = 7 AND value = '4' ) OR
        ( rank = 8 AND value = 'd' ) OR ( rank = 9 AND value = '5' ) OR
        ( rank = 10 AND value = 'e' ) OR ( rank = 11 AND value = '6' ) OR
        ( rank = 12 AND value = 'f' ) OR ( rank = 13 AND value = '7' ) OR
        ( rank = 14 AND value = 'g' ) OR ( rank = 15 AND value = '8' ) OR
        ( rank = 16 AND value = 'h' ) OR ( rank = 17 AND value = '9' ) OR
        ( rank = 18 AND value = 'i' ) OR ( rank = 19 AND value = '10' ) OR
        ( rank = 20 AND value = 'j' ) OR ( rank = 21 AND value = '11' ) OR
        ( rank = 22 AND value = 'k' ) OR ( rank = 23 AND value = '12' ) OR
        ( rank = 24 AND value = 'l' ) OR ( rank = 25 AND value = '13' ) OR
        ( rank = 26 AND value = 'm' ) OR ( rank = 27 AND value = '14' ) OR
        ( rank = 28 AND value = 'n' ) OR ( rank = 29 AND value = '15' ) OR
        ( rank = 30 AND value = 'o' ) OR ( rank = 31 AND value = '16' ) OR
        ( rank = 32 AND value = 'p' ) OR ( rank = 33 AND value = '17' ) OR
        ( rank = 34 AND value = 'q' ) OR ( rank = 35 AND value = '18' ) OR
        ( rank = 36 AND value = 'r' ) OR ( rank = 37 AND value = '19' ) OR
        ( rank = 38 AND value = 's' ) OR ( rank = 39 AND value = '20' ) OR
        ( rank = 40 AND value = 't' ) OR ( rank = 41 AND value = '21' ) OR
        ( rank = 42 AND value = 'u' ) OR ( rank = 43 AND value = '22' ) OR
        ( rank = 44 AND value = 'v' ) OR ( rank = 45 AND value = '23' ) OR
        ( rank = 46 AND value = 'w' ) OR ( rank = 47 AND value = '24' ) OR
        ( rank = 48 AND value = 'x' ) OR ( rank = 49 AND value = '25' ) OR
        ( rank = 50 AND value = 'y' ) OR ( rank = 51 AND value = '26' ) OR
        ( rank = 52 AND value = 'z' )
      )
    )
    WHERE test_type.data_type = 'mat' 
    AND test_entry_score.score IS NOT NULL;

    UPDATE test_entry
    JOIN test_entry_score USING( id )
    SET test_entry.score = test_entry_score.score,
        test_entry.alt_score = test_entry_score.alt_score;

  END //
DELIMITER ;

CALL import_cedar();
DROP PROCEDURE IF EXISTS import_cedar;
