CREATE TABLE sound_file (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  test_type_id int(10) unsigned DEFAULT NULL,
  filename varchar(255) NOT NULL,
  datetime datetime NOT NULL,
  identifying tinyint(1) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_filename (participant_id,filename),
  KEY fk_participant_id (participant_id),
  KEY fk_test_type_id (test_type_id),
  KEY dk_datetime (datetime),
  CONSTRAINT fk_sound_file_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES cenozo.participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sound_file_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
