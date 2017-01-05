SELECT "Create new defer_type table" AS "";

CREATE TABLE IF NOT EXISTS defer_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_type_id INT UNSIGNED NOT NULL,
  message VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_test_type_id (test_type_id ASC),
  UNIQUE INDEX uq_test_type_id_message (test_type_id ASC, message ASC),
  CONSTRAINT fk_test_type_id2
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
