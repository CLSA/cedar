DROP PROCEDURE IF EXISTS patch_word_test_type_total;
  DELIMITER //
  CREATE PROCEDURE patch_word_test_type_total()
  BEGIN
    SELECT "Determining which words each test-type uses" AS "";

    SET @test = ( SELECT COUNT(*) FROM word_test_type_total );

    IF @test = 0 THEN
      INSERT INTO word_test_type_total( word_id )
      SELECT id FROM word;

      INSERT INTO word_test_type_total( word_id, aft_total )
      SELECT word.id, IF( aft_data.id IS NULL, 0, COUNT(*) ) AS total
      FROM word
      LEFT JOIN aft_data ON word.id = aft_data.word_id
      GROUP BY word.id
      ON DUPLICATE KEY UPDATE aft_total = VALUES( aft_total );

      INSERT INTO word_test_type_total( word_id, fas_total )
      SELECT word.id, IF( fas_data.id IS NULL, 0, COUNT(*) ) AS total
      FROM word
      LEFT JOIN fas_data ON word.id = fas_data.word_id
      GROUP BY word.id
      ON DUPLICATE KEY UPDATE fas_total = VALUES( fas_total );

      INSERT INTO word_test_type_total( word_id, rey_total )
      SELECT word.id, IF( rey_data_has_word.rey_data_id IS NULL, 0, COUNT(*) ) AS total
      FROM word
      LEFT JOIN rey_data_has_word ON word.id = rey_data_has_word.word_id
      GROUP BY word.id
      ON DUPLICATE KEY UPDATE rey_total = VALUES( rey_total );  
    END IF;

  END //
DELIMITER ;

SELECT "Creating new word_test_type_total table" AS "";

CREATE TABLE IF NOT EXISTS word_test_type_total (
  word_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  aft_total INT UNSIGNED NOT NULL DEFAULT 0,
  fas_total INT UNSIGNED NOT NULL DEFAULT 0,
  rey_total INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (word_id),
  INDEX dk_aft_total (aft_total ASC),
  INDEX dk_fas_total (fas_total ASC),
  INDEX dk_rey_total (rey_total ASC),
  CONSTRAINT fk_word_test_type_total_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

-- now call the procedure and remove the procedure
CALL patch_word_test_type_total();
DROP PROCEDURE IF EXISTS patch_word_test_type_total;
