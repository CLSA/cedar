CREATE TABLE transcription_has_language (
  transcription_id int(10) unsigned NOT NULL,
  language_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (transcription_id,language_id),
  KEY fk_language_id (language_id),
  KEY fk_transcription_id (transcription_id),
  CONSTRAINT fk_transcription_has_language_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_transcription_has_language_transcription_id
    FOREIGN KEY (transcription_id)
    REFERENCES transcription (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
