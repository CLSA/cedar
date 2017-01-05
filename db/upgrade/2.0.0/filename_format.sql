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
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "Animal List-out" AS name UNION
  SELECT "COG_ANMLLLIST_REC_COF1" AS name
) AS format
WHERE test_type.name = "AFT";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "MAT Alternation-out" AS name UNION
  SELECT "COG_CNTTMEREC_COF1" AS name
) AS format
WHERE test_type.name = "MAT";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "REY I-out" AS name UNION
  SELECT "COG_WRDLSTREC_COF1" AS name
) AS format
WHERE test_type.name = "REY1";

INSERT IGNORE INTO filename_format( test_type_id, format )
SELECT test_type.id, format.name
FROM test_type, (
  SELECT "REY II-out" AS name UNION
  SELECT "COG_WRDLST2_REC_COF1" AS name
) AS format
WHERE test_type.name = "REY2";
