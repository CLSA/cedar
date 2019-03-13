DROP PROCEDURE IF EXISTS patch_test_entry;
DELIMITER //
CREATE PROCEDURE patch_test_entry()
  BEGIN

    SELECT "Adding new audio_status_type_id column to test_entry table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "audio_status_type_id";

    IF @test = 0 THEN
      ALTER TABLE test_entry
      ADD COLUMN audio_status_type_id INT UNSIGNED NULL DEFAULT NULL,
      ADD INDEX fk_audio_status_type_id (audio_status_type_id ASC),
      ADD CONSTRAINT fk_test_entry_audio_status_type_id
          FOREIGN KEY (audio_status_type_id)
          REFERENCES status_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
    END IF;

    SELECT "Adding new audio_status_type_other column to test_entry table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "audio_status_type_other";

    IF @test = 0 THEN
      ALTER TABLE test_entry
      ADD COLUMN audio_status_type_other VARCHAR(127) NULL DEFAULT NULL;
    END IF;

    SELECT "Adding new participant_status_type_id column to test_entry table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "participant_status_type_id";

    IF @test = 0 THEN
      ALTER TABLE test_entry
      ADD COLUMN participant_status_type_id INT UNSIGNED NULL DEFAULT NULL,
      ADD INDEX fk_participant_status_type_id (participant_status_type_id ASC),
      ADD CONSTRAINT fk_test_entry_participant_status_type_id
          FOREIGN KEY (participant_status_type_id)
          REFERENCES status_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
    END IF;

    SELECT "Adding new participant_status_type_other column to test_entry table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "participant_status_type_other";

    IF @test = 0 THEN
      ALTER TABLE test_entry
      ADD COLUMN participant_status_type_other VARCHAR(127) NULL DEFAULT NULL;
    END IF;

    SELECT "Adding new admin_status_type_id column to test_entry table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "admin_status_type_id";

    IF @test = 0 THEN
      ALTER TABLE test_entry
      ADD COLUMN admin_status_type_id INT UNSIGNED NULL DEFAULT NULL,
      ADD INDEX fk_admin_status_type_id (admin_status_type_id ASC),
      ADD CONSTRAINT fk_test_entry_admin_status_type_id
          FOREIGN KEY (admin_status_type_id)
          REFERENCES status_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
    END IF;

    SELECT "Adding new admin_status_type_other column to test_entry table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "admin_status_type_other";

    IF @test = 0 THEN
      ALTER TABLE test_entry
      ADD COLUMN admin_status_type_other VARCHAR(127) NULL DEFAULT NULL;
    END IF;

    SELECT "Removing test_entry.audio_status column" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "audio_status";

    IF @test THEN
      UPDATE test_entry
      JOIN status_type
        ON test_entry.audio_status = IF( name = "Salvable: Other", "salvable", name )
        AND category = "audio"
      SET test_entry.audio_status_type_id = status_type.id;

      ALTER TABLE test_entry DROP COLUMN audio_status;
    END IF;

    SELECT "Removing test_entry.participant_status column" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "test_entry"
    AND column_name = "participant_status";

    IF @test THEN
      UPDATE test_entry
      JOIN status_type
        ON test_entry.participant_status = IF(
          name = "Prompt: Suspected", "suspected prompt", IF(
          name = "Prompt: Middle", "prompt middle", IF(
          name = "Prompt: End", "prompt end",
          name
        ) ) )
        AND category = "participant"
      SET test_entry.participant_status_type_id = status_type.id;

      ALTER TABLE test_entry DROP COLUMN participant_status;
    END IF;

  END //
DELIMITER ;

CALL patch_test_entry();
DROP PROCEDURE IF EXISTS patch_test_entry;
