DROP PROCEDURE IF EXISTS patch_sound_file;
DELIMITER ;;
CREATE PROCEDURE patch_sound_file()
  BEGIN
    SELECT "Adding new extension column to sound_file table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "sound_file"
    AND column_name = "extension";

    IF 0 = @test THEN
      ALTER TABLE sound_file ADD COLUMN extension CHAR(7) NOT NULL AFTER filename;
      UPDATE sound_file SET extension = "wav";
    END IF;
  END ;;
DELIMITER ;

CALL patch_sound_file();
DROP PROCEDURE IF EXISTS patch_sound_file;
