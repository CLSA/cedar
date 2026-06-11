CREATE TRIGGER rey_data_has_word_AFTER_DELETE AFTER DELETE ON rey_data_has_word FOR EACH ROW
BEGIN
  SET @test = (
    SELECT SUM( total ) FROM (
      SELECT COUNT(*) AS total FROM aft_data WHERE word_id = OLD.word_id UNION
      SELECT COUNT(*) AS total FROM fas_data WHERE word_id = OLD.word_id UNION
      SELECT COUNT(*) AS total FROM rey_data_has_word WHERE word_id = OLD.word_id
    ) AS temp
  );
  IF @test = 0 THEN
    DELETE FROM word WHERE id = OLD.word_id
    AND misspelled IS NULL
    AND aft IS NULL
    AND fas IS NULL;
  END IF;

  SET @test_entry_id = ( SELECT test_entry_id FROM rey_data WHERE id = OLD.rey_data_id );
  CALL update_test_entry_has_word( @test_entry_id );
END ;;