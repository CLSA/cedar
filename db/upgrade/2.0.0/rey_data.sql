DROP PROCEDURE IF EXISTS patch_rey_data;
  DELIMITER //
  CREATE PROCEDURE patch_rey_data()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new rey_data table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS rey_data ( ",
        "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "test_entry_id INT UNSIGNED NOT NULL, ",
        "language_id INT UNSIGNED NOT NULL, ",
        "drum TINYINT(1) NULL DEFAULT NULL, ",
        "drum_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "curtain TINYINT(1) NULL DEFAULT NULL, ",
        "curtain_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "bell TINYINT(1) NULL DEFAULT NULL, ",
        "bell_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "coffee TINYINT(1) NULL DEFAULT NULL, ",
        "coffee_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "school TINYINT(1) NULL DEFAULT NULL, ",
        "school_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "parent TINYINT(1) NULL DEFAULT NULL, ",
        "parent_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "moon TINYINT(1) NULL DEFAULT NULL, ",
        "moon_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "garden TINYINT(1) NULL DEFAULT NULL, ",
        "garden_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "hat TINYINT(1) NULL DEFAULT NULL, ",
        "hat_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "farmer TINYINT(1) NULL DEFAULT NULL, ",
        "farmer_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "nose TINYINT(1) NULL DEFAULT NULL, ",
        "nose_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "turkey TINYINT(1) NULL DEFAULT NULL, ",
        "turkey_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "colour TINYINT(1) NULL DEFAULT NULL, ",
        "colour_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "house TINYINT(1) NULL DEFAULT NULL, ",
        "house_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "river TINYINT(1) NULL DEFAULT NULL, ",
        "river_rey_data_variant_id INT UNSIGNED NULL DEFAULT NULL, ",
        "PRIMARY KEY (id), ",
        "INDEX fk_drum_rey_data_variant_id (drum_rey_data_variant_id ASC), ",
        "INDEX fk_curtain_rey_data_variant_id (curtain_rey_data_variant_id ASC), ",
        "INDEX fk_bell_rey_data_variant_id (bell_rey_data_variant_id ASC), ",
        "INDEX fk_coffee_rey_data_variant_id (coffee_rey_data_variant_id ASC), ",
        "INDEX fk_school_rey_data_variant_id (school_rey_data_variant_id ASC), ",
        "INDEX fk_parent_rey_data_variant_id (parent_rey_data_variant_id ASC), ",
        "INDEX fk_moon_rey_data_variant_id (moon_rey_data_variant_id ASC), ",
        "INDEX fk_garden_rey_data_variant_id (garden_rey_data_variant_id ASC), ",
        "INDEX fk_hat_rey_data_variant_id (hat_rey_data_variant_id ASC), ",
        "INDEX fk_farmer_rey_data_variant_id (farmer_rey_data_variant_id ASC), ",
        "INDEX fk_nose_rey_data_variant_id (nose_rey_data_variant_id ASC), ",
        "INDEX fk_turkey_rey_data_variant_id (turkey_rey_data_variant_id ASC), ",
        "INDEX fk_colour_rey_data_variant_id (colour_rey_data_variant_id ASC), ",
        "INDEX fk_house_rey_data_variant_id (house_rey_data_variant_id ASC), ",
        "INDEX fk_river_rey_data_variant_id (river_rey_data_variant_id ASC), ",
        "INDEX fk_test_entry_id (test_entry_id ASC), ",
        "INDEX fk_language_id (language_id ASC), ",
        "UNIQUE INDEX uq_test_entry_id (test_entry_id ASC), ",
        "CONSTRAINT fk_rey_data_drum_rey_data_variant_id ",
          "FOREIGN KEY (drum_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_curtain_rey_data_variant_id ",
          "FOREIGN KEY (curtain_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_bell_rey_data_variant_id ",
          "FOREIGN KEY (bell_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_coffee_rey_data_variant_id ",
          "FOREIGN KEY (coffee_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_school_rey_data_variant_id ",
          "FOREIGN KEY (school_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_parent_rey_data_variant_id ",
          "FOREIGN KEY (parent_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_moon_rey_data_variant_id ",
          "FOREIGN KEY (moon_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_garden_rey_data_variant_id ",
          "FOREIGN KEY (garden_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_hat_rey_data_variant_id ",
          "FOREIGN KEY (hat_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_farmer_rey_data_variant_id ",
          "FOREIGN KEY (farmer_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_nose_rey_data_variant_id ",
          "FOREIGN KEY (nose_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_turkey_rey_data_variant_id ",
          "FOREIGN KEY (turkey_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_colour_rey_data_variant_id ",
          "FOREIGN KEY (colour_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_house_rey_data_variant_id ",
          "FOREIGN KEY (house_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_river_rey_data_variant_id ",
          "FOREIGN KEY (river_rey_data_variant_id) ",
          "REFERENCES rey_data_variant (id) ",
          "ON DELETE NO ACTION ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_rey_data_language_id ",
          "FOREIGN KEY (language_id) ",
          "REFERENCES ", @cenozo, ".language (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE, ",
        "CONSTRAINT fk_rey_data_test_entry_id ",
          "FOREIGN KEY (test_entry_id) ",
          "REFERENCES test_entry (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE CASCADE) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_rey_data();
DROP PROCEDURE IF EXISTS patch_rey_data;
