CREATE TABLE test_entry (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  transcription_id INT(10) UNSIGNED NOT NULL,
  test_type_id INT(10) UNSIGNED NOT NULL,
  state ENUM('assigned', 'deferred', 'submitted') NOT NULL DEFAULT 'assigned',
  score INT(10) UNSIGNED NULL DEFAULT NULL,
  alt_score INT(10) UNSIGNED NULL DEFAULT NULL,
  audio_status_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  audio_status_type_other VARCHAR(127) NULL DEFAULT NULL,
  participant_status_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  participant_status_type_other VARCHAR(127) NULL DEFAULT NULL,
  admin_status_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  admin_status_type_other VARCHAR(127) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_transcription_test_type_id (transcription_id ASC, test_type_id ASC),
  INDEX fk_transcription_id (transcription_id ASC),
  INDEX fk_test_type_id (test_type_id ASC),
  INDEX dk_state (state ASC),
  INDEX fk_audio_status_type_id (audio_status_type_id ASC),
  INDEX fk_participant_status_type_id (participant_status_type_id ASC),
  INDEX fk_admin_status_type_id (admin_status_type_id ASC),
  CONSTRAINT fk_test_entry_admin_status_type_id
    FOREIGN KEY (admin_status_type_id)
    REFERENCES status_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_entry_audio_status_type_id
    FOREIGN KEY (audio_status_type_id)
    REFERENCES status_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_entry_participant_status_type_id
    FOREIGN KEY (participant_status_type_id)
    REFERENCES status_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_entry_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_test_entry_transcription_id
    FOREIGN KEY (transcription_id)
    REFERENCES transcription (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
