CREATE TABLE transcription_has_user (
  transcription_id int(10) unsigned NOT NULL,
  user_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  datetime datetime NOT NULL,
  PRIMARY KEY (transcription_id,user_id),
  KEY fk_transcription_id (transcription_id),
  KEY fk_user_id (user_id),
  CONSTRAINT fk_transcription_has_user_transcription_id
    FOREIGN KEY (transcription_id)
    REFERENCES transcription (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_transcription_has_user_user_id
    FOREIGN KEY (user_id)
    REFERENCES cenozo.user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
