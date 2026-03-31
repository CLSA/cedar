CREATE TABLE transcription_event_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  cohort_id INT(10) UNSIGNED NOT NULL,
  event_type_id INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_cohort_id (cohort_id ASC),
  INDEX fk_event_type_id (event_type_id ASC),
  UNIQUE INDEX uq_cohort_id_event_type_id (cohort_id ASC, event_type_id ASC),
  CONSTRAINT fk_transcription_event_type_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cenozo.cohort (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_transcription_event_type_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES cenozo.event_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
