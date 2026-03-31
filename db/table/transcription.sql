CREATE TABLE transcription (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  user_id INT(10) UNSIGNED NULL DEFAULT NULL COMMENT 'The typist that the transcription is currently assigned to.',
  participant_id INT(10) UNSIGNED NOT NULL,
  site_id INT(10) UNSIGNED NOT NULL,
  assigned_count INT(10) UNSIGNED NOT NULL DEFAULT 0,
  deferred_count INT(10) UNSIGNED NOT NULL DEFAULT 0,
  submitted_count INT(10) UNSIGNED NOT NULL DEFAULT 0,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id (participant_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_site_id (site_id ASC),
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
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
