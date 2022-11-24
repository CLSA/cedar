DROP PROCEDURE IF EXISTS patch_sound_file;
DELIMITER //
CREATE PROCEDURE patch_sound_file()
  BEGIN

    SELECT "Replacing uq_filename with uq_participant_id_filename in sound_file table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE()
    AND table_name = "sound_file"
    AND constraint_name = "uq_filename";

    IF @test = 1 THEN
      ALTER TABLE sound_file DROP KEY uq_filename;
      ALTER TABLE sound_file ADD UNIQUE INDEX uq_participant_id_filename (participant_id ASC, filename ASC);
    END IF;

  END //
DELIMITER ;

CALL patch_sound_file();
DROP PROCEDURE IF EXISTS patch_sound_file;

SELECT "Renaming sound_file filenames" AS "";

UPDATE sound_file SET filename = "01" WHERE filename LIKE "%/01-out%.wav";
UPDATE sound_file SET filename = "02" WHERE filename LIKE "%/02-out%.wav";
UPDATE sound_file SET filename = "03" WHERE filename LIKE "%/03-out%.wav";
UPDATE sound_file SET filename = "04" WHERE filename LIKE "%/04-out%.wav";
UPDATE sound_file SET filename = "05" WHERE filename LIKE "%/05-out%.wav";
UPDATE sound_file SET filename = "06" WHERE filename LIKE "%/06-out%.wav";
UPDATE sound_file SET filename = "07" WHERE filename LIKE "%/07-out%.wav";
UPDATE sound_file SET filename = "08" WHERE filename LIKE "%/08-out%.wav";
UPDATE sound_file SET filename = "alphabet"
WHERE filename LIKE "%Alphabet-out%.wav" OR filename LIKE "%ALPTME%.wav";
UPDATE sound_file SET filename = "counting"
WHERE filename LIKE "%Counting to 20-out%.wav" OR filename LIKE "%CNTTMEREC%.wav";
UPDATE sound_file SET filename = "animal_fluency"
WHERE filename LIKE "%Animal List-out%.wav" OR filename LIKE "%ANMLLLIST%.wav";
UPDATE sound_file SET filename = "mental_alternation"
WHERE filename LIKE "%MAT Alternation-out%.wav" OR filename LIKE "%ALTTME%.wav";
UPDATE sound_file SET filename = "immediate_word_list"
WHERE filename LIKE "%REY I-out%.wav" OR filename LIKE "%WRDLSTREC%.wav";
UPDATE sound_file SET filename = "delayed_word_list"
WHERE filename LIKE "%REY II-out%.wav" OR filename LIKE "%WRDLST2%.wav";
UPDATE sound_file SET filename = "f_word_fluency" WHERE filename LIKE "%FAS_FREC%.wav";
UPDATE sound_file SET filename = "a_word_fluency" WHERE filename LIKE "%FAS_AREC%.wav";
UPDATE sound_file SET filename = "s_word_fluency" WHERE filename LIKE "%FAS_SREC%.wav";
