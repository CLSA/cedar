SELECT "Creating new filename_format table" AS "";

CREATE TABLE IF NOT EXISTS filename_format (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_type_id INT UNSIGNED NOT NULL,
  format VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_type_id (test_type_id ASC),
  UNIQUE INDEX uq_test_type_id_format (test_type_id ASC, format ASC),
  CONSTRAINT fk_filename_format_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, "FAS_FREC_COF1"
FROM test_type
WHERE test_type.name = "F-Word Fluency (FAS-F)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, "FAS_AREC_COF1"
FROM test_type
WHERE test_type.name = "A-Word Fluency (FAS-A)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, "FAS_SREC_COF1"
FROM test_type
WHERE test_type.name = "S-Word Fluency (FAS-S)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "Animal List-out" AS name UNION
  SELECT "COG_ANMLLLIST_REC_COF1" AS name
) AS format
WHERE test_type.name = "Animal Fluency (AFT)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "Counting to 20-out" AS name UNION
  SELECT "Alphabet-out" AS name
) AS format
WHERE test_type.name = "Pre Mental Alternation (pre-MAT)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "MAT Alternation-out" AS name UNION
  SELECT "COG_CNTTMEREC_COF1" AS name
) AS format
WHERE test_type.name = "Mental Alternation (MAT)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "REY I-out" AS name UNION
  SELECT "COG_WRDLSTREC_COF1" AS name
) AS format
WHERE test_type.name = "Immediate Word List (REY1)";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "REY II-out" AS name UNION
  SELECT "COG_WRDLST2_REC_COF1" AS name
) AS format
WHERE test_type.name = "Delayed Word List (REY2)";
