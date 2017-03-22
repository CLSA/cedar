DROP PROCEDURE IF EXISTS patch_user_has_cohort;
  DELIMITER //
  CREATE PROCEDURE patch_user_has_cohort()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new user_has_cohort table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS user_has_cohort ( ",
        "user_id INT UNSIGNED NOT NULL, ",
        "cohort_id INT UNSIGNED NOT NULL, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "PRIMARY KEY (user_id, cohort_id), ",
        "INDEX fk_cohort_id (cohort_id ASC), ",
        "INDEX fk_user_id (user_id ASC), ",
        "CONSTRAINT fk_user_has_cohort_user_id ",
          "FOREIGN KEY (user_id) ",
          "REFERENCES ", @cenozo, ".user (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE, ",
        "CONSTRAINT fk_user_has_cohort_cohort_id ",
          "FOREIGN KEY (cohort_id) ",
          "REFERENCES ", @cenozo, ".cohort (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_user_has_cohort();
DROP PROCEDURE IF EXISTS patch_user_has_cohort;
