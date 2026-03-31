CREATE TABLE filename_format (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  test_type_id INT(10) UNSIGNED NOT NULL,
  format VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_test_type_id_format (test_type_id ASC, format ASC),
  INDEX fk_test_type_id (test_type_id ASC),
  CONSTRAINT fk_filename_format_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
