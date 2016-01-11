DROP PROCEDURE IF EXISTS single_entry_patch;
DELIMITER //
CREATE PROCEDURE single_entry_patch()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
      AND constraint_name = "fk_role_has_operation_role_id" );

    -- determine the baseline and f1 database names
    SET @bl = ( SUBSTRING( DATABASE(), 1, CHAR_LENGTH( DATABASE() ) - 3 ) );

    SELECT "Copying operation data from baseline instance" AS "";

    SET @test = ( SELECT COUNT(*) FROM operation );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO operation SELECT * FROM ", @bl, ".operation" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Copying role_has_operation data from baseline instance" AS "";

    SET @test = ( SELECT COUNT(*) FROM role_has_operation );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO role_has_operation SELECT * FROM ", @bl, ".role_has_operation" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying user_has_cohort data from baseline instance" AS "";
    
    SET @test = ( SELECT COUNT(*) FROM user_has_cohort );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO user_has_cohort SELECT * FROM ", @bl, ".user_has_cohort" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying dictionary data from baseline instance" AS "";
    
    SET @test = ( SELECT COUNT(*) FROM dictionary );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO dictionary SELECT * FROM ", @bl, ".dictionary" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying dictionary_import data from baseline instance" AS "";
    
    SET @test = ( SELECT COUNT(*) FROM dictionary_import );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO dictionary_import SELECT * FROM ", @bl, ".dictionary_import" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying test_type data from baseline instance" AS "";

    SET @test = ( SELECT COUNT(*) FROM test_type );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO test_type SELECT * FROM ", @bl, ".test_type" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying test data from baseline instance" AS "";

    SET @test = ( SELECT COUNT(*) FROM test );
    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT INTO test ",
        "( id, name, dictionary_id, intrusion_dictionary_id, variant_dictionary_id, ",
        "mispelled_dictionary_id, test_type_id, strict, rank_words, rank, recording_name ) ",
        "SELECT id, name, dictionary_id, intrusion_dictionary_id, variant_dictionary_id, ",
        "mispelled_dictionary_id, test_type_id, strict, rank_words, rank, recording_name ",
        "FROM ", @bl, ".test" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying word data from baseline instance" AS "";

    SET @test = ( SELECT COUNT(*) FROM word );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO word SELECT * FROM ", @bl, ".word" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying ranked_word_set data from baseline instance" AS "";
    
    SET @test = ( SELECT COUNT(*) FROM ranked_word_set );
    IF @test = 0 THEN
      SET @sql = CONCAT( "INSERT INTO ranked_word_set SELECT * FROM ", @bl, ".ranked_word_set" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;
      
    SELECT "Copying ranked_word_set_has_language data from baseline instance" AS "";

    SET @test = ( SELECT COUNT(*) FROM ranked_word_set_has_language );
    IF @test = 0 THEN
      SET @sql = CONCAT(
        "INSERT INTO ranked_word_set_has_language SELECT * FROM ", @bl, ".ranked_word_set_has_language" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

    SELECT "Adding release event_type" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".event_type ( name, description ) ",
      "VALUES ( 'released to cedar_f1', 'Released the participant to Cedar F1' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Adding service record" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".service ",
      "( name, title, version, cenozo, release_based, release_event_type_id, language_id ) ",
      "SELECT 'cedar_f1', 'Cedar F1', '1.1.3s', '1.0.2', false, event_type.id, language.id ",
      "FROM ", @cenozo, ".event_type, ", @cenozo, ".language ",
      "WHERE event_type.name = 'released to cedar_f1' ",
      "AND language.name = 'English'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Adding site records" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".site ",
      "( name, service_id, timezone, title, phone_number, address1, address2, city, region_id, postcode ) ",
      "SELECT site.name, service.id, timezone, site.title, phone_number, ",
      "address1, address2, city, region_id, postcode ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".site ",
      "JOIN ", @cenozo, ".service AS baseline_service ON site.service_id = baseline_service.id ",
      "WHERE service.name = 'cedar_f1' ",
      "AND baseline_service.name = 'cedar'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Adding access records" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".access ",
      "( user_id, role_id, site_id ) ",
      "SELECT user_id, role_id, site.id ",
      "FROM ", @cenozo, ".access ",
      "JOIN ", @cenozo, ".site AS baseline_site ON access.site_id = baseline_site.id ",
      "JOIN ", @cenozo, ".service AS baseline_service ON baseline_site.service_id = baseline_service.id ",
      "JOIN ", @cenozo, ".site ON baseline_site.name = site.name ",
      "JOIN ", @cenozo, ".service ON site.service_id = service.id ",
      "WHERE baseline_service.name = 'cedar' ",
      "AND service.name = 'cedar_f1'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Adding service_has_cohort records" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".service_has_cohort ",
      "( service_id, cohort_id, grouping ) ",
      "SELECT service.id, cohort_id, grouping ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".service_has_cohort ",
      "JOIN ", @cenozo, ".service AS baseline_service ON service_has_cohort.service_id = baseline_service.id ",
      "WHERE baseline_service.name = 'cedar' ",
      "AND service.name = 'cedar_f1'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SELECT "Adding service_has_role records" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO ", @cenozo, ".service_has_role ",
      "( service_id, role_id ) ",
      "SELECT service.id, role_id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".service_has_role ",
      "JOIN ", @cenozo, ".service AS baseline_service ON service_has_role.service_id = baseline_service.id ",
      "WHERE baseline_service.name = 'cedar' ",
      "AND service.name = 'cedar_f1'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL single_entry_patch();
DROP PROCEDURE IF EXISTS single_entry_patch;
