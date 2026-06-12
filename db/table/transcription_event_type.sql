CREATE TABLE transcription_event_type (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  cohort_id int(10) unsigned NOT NULL,
  event_type_id int(10) unsigned NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cohort_id_event_type_id (cohort_id,event_type_id),
  KEY fk_cohort_id (cohort_id),
  KEY fk_event_type_id (event_type_id),
  CONSTRAINT fk_transcription_event_type_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cenozo.cohort (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_transcription_event_type_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES cenozo.event_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
