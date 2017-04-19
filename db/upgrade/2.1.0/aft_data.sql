SELECT "Creating new aft_data table" AS "";

CREATE TABLE IF NOT EXISTS aft_data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_entry_id INT UNSIGNED NOT NULL,
  rank INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX uq_test_entry_id_rank (test_entry_id ASC, rank ASC),
  INDEX fk_word_id (word_id ASC),
  CONSTRAINT fk_aft_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_aft_data_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

DELIMITER $$

DROP TRIGGER IF EXISTS fas_data_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER fas_data_AFTER_INSERT AFTER INSERT ON fas_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END$$


DROP TRIGGER IF EXISTS fas_data_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER fas_data_AFTER_UPDATE AFTER UPDATE ON fas_data FOR EACH ROW
BEGIN
  CALL update_test_entry_has_word( NEW.test_entry_id );
END$$


DROP TRIGGER IF EXISTS aft_data_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER aft_data_AFTER_DELETE AFTER DELETE ON aft_data FOR EACH ROW
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

  CALL update_test_entry_has_word( OLD.test_entry_id );
END;$$

DELIMITER ;
