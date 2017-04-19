DROP PROCEDURE IF EXISTS patch_word_test_entry_total;
  DELIMITER //
  CREATE PROCEDURE patch_word_test_entry_total()
  BEGIN
    SELECT "Determining which words each test-entry uses" AS "";

    SET @test = ( SELECT COUNT(*) FROM test_entry_has_word );

    IF @test = 0 THEN 
      INSERT IGNORE INTO test_entry_has_word( test_entry_id, word_id )
      SELECT DISTINCT test_entry_id, word_id
      FROM aft_data;

      INSERT IGNORE INTO test_entry_has_word( test_entry_id, word_id )
      SELECT DISTINCT test_entry_id, word_id
      FROM fas_data;

      INSERT IGNORE INTO test_entry_has_word( test_entry_id, word_id )
      SELECT DISTINCT rey_data.test_entry_id, rey_data_has_word.word_id
      FROM rey_data
      JOIN rey_data_has_word ON rey_data.id = rey_data_has_word.rey_data_id;

      REPLACE INTO word_test_entry_total( word_id, total )
      SELECT word.id, IF( test_entry_has_word.word_id IS NULL, 0, COUNT(*) ) AS total
      FROM word
      LEFT JOIN test_entry_has_word ON word.id = test_entry_has_word.word_id
      GROUP BY word.id;

    END IF;
      
  END //
DELIMITER ;

SELECT "Create new test_entry_has_word table" AS "";

CREATE TABLE IF NOT EXISTS test_entry_has_word (
  test_entry_id INT UNSIGNED NOT NULL,
  word_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (test_entry_id, word_id),
  INDEX fk_word_id (word_id ASC),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX uq_test_entry_id_word_id (test_entry_id ASC, word_id ASC),
  CONSTRAINT fk_test_entry_has_word_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_test_entry_has_word_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- now call the procedure and remove the procedure
CALL patch_word_test_entry_total();
DROP PROCEDURE IF EXISTS patch_word_test_entry_total;


SELECT "Deleting variant words which are not in use" AS "";

DROP TABLE IF EXISTS delete_word;
CREATE TEMPORARY TABLE delete_word
SELECT word.id
FROM word
JOIN word_test_entry_total ON word.id = word_test_entry_total.word_id
WHERE word.misspelled IS NULL
AND aft IS NULL
AND fas IS NULL
AND total = 0;

DELETE FROM word WHERE id IN ( SELECT id FROM delete_word );

DELIMITER $$

DROP TRIGGER IF EXISTS test_entry_has_word_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_has_word_AFTER_INSERT AFTER INSERT ON test_entry_has_word FOR EACH ROW
BEGIN
  CALL update_word_test_entry_total( NEW.word_id );
END$$


DROP TRIGGER IF EXISTS test_entry_has_word_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_has_word_AFTER_UPDATE AFTER UPDATE ON test_entry_has_word FOR EACH ROW
BEGIN
  CALL update_word_test_entry_total( NEW.word_id );
END$$


DROP TRIGGER IF EXISTS test_entry_has_word_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER test_entry_has_word_AFTER_DELETE AFTER DELETE ON test_entry_has_word FOR EACH ROW
BEGIN
  CALL update_word_test_entry_total( OLD.word_id );
END$$

DELIMITER ;
