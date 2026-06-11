CREATE TABLE rey_data (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  test_entry_id int(10) unsigned NOT NULL,
  language_id int(10) unsigned NOT NULL,
  drum tinyint(1) DEFAULT NULL,
  drum_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  curtain tinyint(1) DEFAULT NULL,
  curtain_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  bell tinyint(1) DEFAULT NULL,
  bell_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  coffee tinyint(1) DEFAULT NULL,
  coffee_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  school tinyint(1) DEFAULT NULL,
  school_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  parent tinyint(1) DEFAULT NULL,
  parent_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  moon tinyint(1) DEFAULT NULL,
  moon_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  garden tinyint(1) DEFAULT NULL,
  garden_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  hat tinyint(1) DEFAULT NULL,
  hat_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  farmer tinyint(1) DEFAULT NULL,
  farmer_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  nose tinyint(1) DEFAULT NULL,
  nose_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  turkey tinyint(1) DEFAULT NULL,
  turkey_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  colour tinyint(1) DEFAULT NULL,
  colour_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  house tinyint(1) DEFAULT NULL,
  house_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  river tinyint(1) DEFAULT NULL,
  river_rey_data_variant_id int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_entry_id (test_entry_id),
  KEY fk_drum_rey_data_variant_id (drum_rey_data_variant_id),
  KEY fk_curtain_rey_data_variant_id (curtain_rey_data_variant_id),
  KEY fk_bell_rey_data_variant_id (bell_rey_data_variant_id),
  KEY fk_coffee_rey_data_variant_id (coffee_rey_data_variant_id),
  KEY fk_school_rey_data_variant_id (school_rey_data_variant_id),
  KEY fk_parent_rey_data_variant_id (parent_rey_data_variant_id),
  KEY fk_moon_rey_data_variant_id (moon_rey_data_variant_id),
  KEY fk_garden_rey_data_variant_id (garden_rey_data_variant_id),
  KEY fk_hat_rey_data_variant_id (hat_rey_data_variant_id),
  KEY fk_farmer_rey_data_variant_id (farmer_rey_data_variant_id),
  KEY fk_nose_rey_data_variant_id (nose_rey_data_variant_id),
  KEY fk_turkey_rey_data_variant_id (turkey_rey_data_variant_id),
  KEY fk_colour_rey_data_variant_id (colour_rey_data_variant_id),
  KEY fk_house_rey_data_variant_id (house_rey_data_variant_id),
  KEY fk_river_rey_data_variant_id (river_rey_data_variant_id),
  KEY fk_test_entry_id (test_entry_id),
  KEY fk_language_id (language_id),
  CONSTRAINT fk_rey_data_bell_rey_data_variant_id
    FOREIGN KEY (bell_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_coffee_rey_data_variant_id
    FOREIGN KEY (coffee_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_colour_rey_data_variant_id
    FOREIGN KEY (colour_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_curtain_rey_data_variant_id
    FOREIGN KEY (curtain_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_drum_rey_data_variant_id
    FOREIGN KEY (drum_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_farmer_rey_data_variant_id
    FOREIGN KEY (farmer_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_garden_rey_data_variant_id
    FOREIGN KEY (garden_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_hat_rey_data_variant_id
    FOREIGN KEY (hat_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_house_rey_data_variant_id
    FOREIGN KEY (house_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_language_id
    FOREIGN KEY (language_id)
    REFERENCES cenozo.language (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_rey_data_moon_rey_data_variant_id
    FOREIGN KEY (moon_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_nose_rey_data_variant_id
    FOREIGN KEY (nose_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_parent_rey_data_variant_id
    FOREIGN KEY (parent_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_river_rey_data_variant_id
    FOREIGN KEY (river_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_school_rey_data_variant_id
    FOREIGN KEY (school_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_rey_data_turkey_rey_data_variant_id
    FOREIGN KEY (turkey_rey_data_variant_id)
    REFERENCES rey_data_variant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;