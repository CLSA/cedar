CREATE TABLE transcription_has_language (
  transcription_id INT(10) UNSIGNED NOT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (transcription_id, language_id),
  INDEX fk_language_id (language_id ASC),
  INDEX fk_transcription_id (transcription_id ASC),
  CONSTRAINT fk_transcription_has_language_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_transcription_has_language_transcription_id
    FOREIGN KEY (transcription_id)
    REFERENCES transcription (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
