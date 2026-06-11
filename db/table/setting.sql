CREATE TABLE setting (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  site_id int(10) unsigned NOT NULL,
  max_working_transcriptions int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_site_id (site_id),
  KEY fk_site_id (site_id),
  CONSTRAINT fk_setting_site_id
    FOREIGN KEY (site_id)
    REFERENCES cenozo.site (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;