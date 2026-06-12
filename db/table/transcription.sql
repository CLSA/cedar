CREATE TABLE transcription (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  user_id int(10) unsigned DEFAULT NULL COMMENT 'The typist that the transcription is currently assigned to.',
  participant_id int(10) unsigned NOT NULL,
  site_id int(10) unsigned NOT NULL,
  assigned_count int(10) unsigned NOT NULL DEFAULT 0,
  deferred_count int(10) unsigned NOT NULL DEFAULT 0,
  submitted_count int(10) unsigned NOT NULL DEFAULT 0,
  start_datetime datetime NOT NULL,
  end_datetime datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id (participant_id),
  KEY fk_user_id (user_id),
  KEY fk_site_id (site_id),
  CONSTRAINT fk_transcription_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES cenozo.participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_transcription_site_id
    FOREIGN KEY (site_id)
    REFERENCES cenozo.site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_transcription_user_id
    FOREIGN KEY (user_id)
    REFERENCES cenozo.user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
