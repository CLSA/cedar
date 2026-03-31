CREATE TABLE participant_sound_file_total (
  participant_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  total INT(10) UNSIGNED NOT NULL DEFAULT 0,
  datetime DATETIME NOT NULL,
  PRIMARY KEY (participant_id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX dk_total (total ASC),
  INDEX dk_datetime (datetime ASC),
  CONSTRAINT fk_participant_sound_file_total_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES cenozo.participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
