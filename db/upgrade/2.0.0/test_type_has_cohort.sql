DROP PROCEDURE IF EXISTS patch_test_type_has_cohort;
  DELIMITER //
  CREATE PROCEDURE patch_test_type_has_cohort()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new test_type_has_cohort table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS test_type_has_cohort ( ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "cohort_id INT UNSIGNED NOT NULL, ",
        "test_type_id INT UNSIGNED NOT NULL, ",
        "PRIMARY KEY (cohort_id, test_type_id), ",
        "INDEX fk_test_type_has_cohort_cohort_id (cohort_id ASC), ",
        "INDEX fk_test_type_has_cohort_test_type_id (test_type_id ASC), ",
        "UNIQUE INDEX uq_test_type_id_cohort_id (test_type_id ASC, cohort_id ASC), ",
        "CONSTRAINT fk_test_type_has_cohort_test_type_id ",
          "FOREIGN KEY (test_type_id) ",
          "REFERENCES test_type (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE, ",
        "CONSTRAINT fk_test_type_has_cohort_cohort_id ",
          "FOREIGN KEY (cohort_id) ",
          "REFERENCES ", @cenozo, ".cohort (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO test_type_has_cohort ( test_type_id, cohort_id ) ",
      "SELECT test_type.id, cohort.id ",
      "FROM test_type, ", @cenozo, ".cohort ",
      "WHERE cohort.name = 'comprehensive'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT IGNORE INTO test_type_has_cohort ( test_type_id, cohort_id ) ",
      "SELECT test_type.id, cohort.id ",
      "FROM test_type, ", @cenozo, ".cohort ",
      "WHERE test_type.data_type != 'fas' ",
      "AND cohort.name = 'tracking'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;
  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_test_type_has_cohort();
DROP PROCEDURE IF EXISTS patch_test_type_has_cohort;
