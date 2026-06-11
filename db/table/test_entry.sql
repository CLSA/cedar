CREATE TABLE test_entry (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  transcription_id int(10) unsigned NOT NULL,
  test_type_id int(10) unsigned NOT NULL,
  state enum('assigned','deferred','submitted') NOT NULL DEFAULT 'assigned',
  score int(10) unsigned DEFAULT NULL,
  alt_score int(10) unsigned DEFAULT NULL,
  audio_status_type_id int(10) unsigned DEFAULT NULL,
  audio_status_type_other varchar(127) DEFAULT NULL,
  participant_status_type_id int(10) unsigned DEFAULT NULL,
  participant_status_type_other varchar(127) DEFAULT NULL,
  admin_status_type_id int(10) unsigned DEFAULT NULL,
  admin_status_type_other varchar(127) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transcription_test_type_id (transcription_id,test_type_id),
  KEY fk_transcription_id (transcription_id),
  KEY fk_test_type_id (test_type_id),
  KEY dk_state (state),
  KEY fk_audio_status_type_id (audio_status_type_id),
  KEY fk_participant_status_type_id (participant_status_type_id),
  KEY fk_admin_status_type_id (admin_status_type_id),
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
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;