DROP PROCEDURE IF EXISTS patch_test_type_has_status_type;
DELIMITER //
CREATE PROCEDURE patch_test_type_has_status_type()
  BEGIN

    SELECT "Creating new test_type_has_status_type table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "test_type_has_status_type";

    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS test_type_has_status_type (
        test_type_id INT UNSIGNED NOT NULL,
        status_type_id INT UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (test_type_id, status_type_id),
        INDEX fk_status_type_id (status_type_id ASC),
        INDEX fk_test_type_id (test_type_id ASC),
        CONSTRAINT fk_test_type_has_status_type_test_type_id
          FOREIGN KEY (test_type_id)
          REFERENCES test_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_test_type_has_status_type_status_type_id
          FOREIGN KEY (status_type_id)
          REFERENCES status_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE ( test_type.data_type IN ( "aft", "fas" ) OR test_type.name = "Delayed Word List (REY2)" )
      AND status_type.category = "participant"
      AND status_type.name IN( "Prompt: Less than 5s", "Prompt: More than 5s" );

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.name = "Immediate Word List (REY1)"
      AND status_type.category = "participant"
      AND status_type.name IN ( "Prompt: Less than 10s", "Prompt: More than 10s" );

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type = "mat"
      AND status_type.category = "participant"
      AND status_type.name = "Prompt: Correction after 4D";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type = "aft"
      AND status_type.category = "participant"
      AND status_type.name = "Prompt: Suspected";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE status_type.category = "participant"
      AND status_type.name = "Refused";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE status_type.category = "audio"
      AND status_type.name != "CRF";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type = "fas"
      AND status_type.category = "audio"
      AND status_type.name = "CRF";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type IN ( "rey", "mat", "fas" )
      AND status_type.category = "admin"
      AND status_type.name = "Time Provided";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type = "rey"
      AND status_type.category = "admin"
      AND status_type.name IN( "Correct number of words provided", "Number of words on list provided" );

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type = "mat"
      AND status_type.category = "admin"
      AND status_type.name = "Not corrected before 4D";

      INSERT IGNORE INTO test_type_has_status_type( test_type_id, status_type_id )
      SELECT test_type.id, status_type.id
      FROM test_type, status_type
      WHERE test_type.data_type != "premat"
      AND status_type.category = "admin"
      AND status_type.name = "Other";

    END IF;

  END //
DELIMITER ;

CALL patch_test_type_has_status_type();
DROP PROCEDURE IF EXISTS patch_test_type_has_status_type;
