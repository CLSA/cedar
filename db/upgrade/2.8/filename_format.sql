DROP PROCEDURE IF EXISTS patch_filename_format;
DELIMITER //
CREATE PROCEDURE patch_filename_format()
  BEGIN

    SELECT "Defining new filename_format records" AS "";

    SELECT COUNT(*) INTO @test
    FROM filename_format;

    IF @test != 9 THEN
      TRUNCATE filename_format;

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE data_type = "premat" ),
          format = "alphabet";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE data_type = "premat" ),
          format = "counting";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE data_type = "aft" ),
          format = "animal_fluency";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE data_type = "mat" ),
          format = "mental_alternation";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE name = "Immediate Word List (REY1)" ),
          format = "immediate_word_list";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE name = "Delayed Word List (REY2)" ),
          format = "delayed_word_list";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE name = "F-Word Fluency (FAS-F)" ),
          format = "f_word_fluency";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE name = "A-Word Fluency (FAS-A)" ),
          format = "a_word_fluency";

      INSERT INTO filename_format
      SET test_type_id = ( SELECT id FROM test_type WHERE name = "S-Word Fluency (FAS-S)" ),
          format = "s_word_fluency";

    END IF;

  END //
DELIMITER ;

CALL patch_filename_format();
DROP PROCEDURE IF EXISTS patch_filename_format;
