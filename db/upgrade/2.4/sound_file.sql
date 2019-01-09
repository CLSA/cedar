DROP PROCEDURE IF EXISTS patch_sound_file;
  DELIMITER //
  CREATE PROCEDURE patch_sound_file()
  BEGIN

    SELECT "Adding new identifying column to sound_file table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "sound_file"
    AND column_name = "identifying";

    IF @test = 0 THEN
      ALTER TABLE sound_file ADD COLUMN identifying TINYINT(1) NULL DEFAULT NULL;
    END IF;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_sound_file();
DROP PROCEDURE IF EXISTS patch_sound_file;
