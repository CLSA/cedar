CREATE TABLE test_type_has_cohort (
  cohort_id INT(10) UNSIGNED NOT NULL,
  test_type_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (cohort_id, test_type_id),
  UNIQUE INDEX uq_test_type_id_cohort_id (test_type_id ASC, cohort_id ASC),
  INDEX fk_test_type_has_cohort_cohort_id (cohort_id ASC),
  INDEX fk_test_type_has_cohort_test_type_id (test_type_id ASC),
  CONSTRAINT fk_test_type_has_cohort_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cenozo.cohort (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_type_has_cohort_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
