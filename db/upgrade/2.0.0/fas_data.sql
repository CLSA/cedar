SELECT "Creating new fas_data table" AS "";

CREATE TABLE IF NOT EXISTS fas_data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_entry_id INT UNSIGNED NOT NULL,
  rank INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX uq_test_entry_id_rank (test_entry_id ASC, rank ASC),
  INDEX fk_word_id (word_id ASC),
  CONSTRAINT fk_fas_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_fas_data_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

DELIMITER $$

DROP TRIGGER IF EXISTS fas_data_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER fas_data_AFTER_DELETE AFTER DELETE ON fas_data FOR EACH ROW
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
    AND aft_valid IS NULL
    AND fas_valid IS NULL;
  END IF;
END;$$

DELIMITER ;
