CREATE TABLE test_type_has_cohort (
  cohort_id int(10) unsigned NOT NULL,
  test_type_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (cohort_id,test_type_id),
  UNIQUE KEY uq_test_type_id_cohort_id (test_type_id,cohort_id),
  KEY fk_test_type_has_cohort_cohort_id (cohort_id),
  KEY fk_test_type_has_cohort_test_type_id (test_type_id),
  CONSTRAINT fk_test_type_has_cohort_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cenozo.cohort (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_type_has_cohort_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
