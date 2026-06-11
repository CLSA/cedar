CREATE TABLE participant_sound_file_total (
  participant_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  total int(10) unsigned NOT NULL DEFAULT 0,
  datetime datetime NOT NULL,
  PRIMARY KEY (participant_id),
  KEY fk_participant_id (participant_id),
  KEY dk_total (total),
  KEY dk_datetime (datetime),
  CONSTRAINT fk_participant_sound_file_total_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES cenozo.participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;