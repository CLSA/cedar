CREATE TABLE test_type_has_status_type (
  test_type_id INT(10) UNSIGNED NOT NULL,
  status_type_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (test_type_id, status_type_id),
  INDEX fk_status_type_id (status_type_id ASC),
  INDEX fk_test_type_id (test_type_id ASC),
  CONSTRAINT fk_test_type_has_status_type_status_type_id
    FOREIGN KEY (status_type_id)
    REFERENCES status_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_type_has_status_type_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
