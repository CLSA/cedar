CREATE TABLE sound_file (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  test_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  filename VARCHAR(255) NOT NULL,
  datetime DATETIME NOT NULL,
  identifying TINYINT(1) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id_filename (participant_id ASC, filename ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_test_type_id (test_type_id ASC),
  INDEX dk_datetime (datetime ASC),
  CONSTRAINT fk_sound_file_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES cenozo.participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sound_file_test_type_id
    FOREIGN KEY (test_type_id)
    REFERENCES test_type (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
