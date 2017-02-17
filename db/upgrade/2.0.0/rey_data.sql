SELECT "Creating new rey_data table" AS "";

CREATE TABLE IF NOT EXISTS rey_data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_entry_id INT UNSIGNED NOT NULL,
  drum TINYINT(1) NULL DEFAULT NULL,
  drum_word_id INT UNSIGNED NULL DEFAULT NULL,
  curtain TINYINT(1) NULL DEFAULT NULL,
  curtain_word_id INT UNSIGNED NULL DEFAULT NULL,
  bell TINYINT(1) NULL DEFAULT NULL,
  bell_word_id INT UNSIGNED NULL DEFAULT NULL,
  coffee TINYINT(1) NULL DEFAULT NULL,
  coffee_word_id INT UNSIGNED NULL DEFAULT NULL,
  school TINYINT(1) NULL DEFAULT NULL,
  school_word_id INT UNSIGNED NULL DEFAULT NULL,
  parent TINYINT(1) NULL DEFAULT NULL,
  parent_word_id INT UNSIGNED NULL DEFAULT NULL,
  moon TINYINT(1) NULL DEFAULT NULL,
  moon_word_id INT UNSIGNED NULL DEFAULT NULL,
  garden TINYINT(1) NULL DEFAULT NULL,
  garden_word_id INT UNSIGNED NULL DEFAULT NULL,
  hat TINYINT(1) NULL DEFAULT NULL,
  hat_word_id INT UNSIGNED NULL DEFAULT NULL,
  farmer TINYINT(1) NULL DEFAULT NULL,
  farmer_word_id INT UNSIGNED NULL DEFAULT NULL,
  nose TINYINT(1) NULL DEFAULT NULL,
  nose_word_id INT UNSIGNED NULL DEFAULT NULL,
  turkey TINYINT(1) NULL DEFAULT NULL,
  turkey_word_id INT UNSIGNED NULL DEFAULT NULL,
  colour TINYINT(1) NULL DEFAULT NULL,
  colour_word_id INT UNSIGNED NULL DEFAULT NULL,
  house TINYINT(1) NULL DEFAULT NULL,
  house_word_id INT UNSIGNED NULL DEFAULT NULL,
  river TINYINT(1) NULL DEFAULT NULL,
  river_word_id INT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_drum_word_id (drum_word_id ASC),
  INDEX fk_curtain_word_id (curtain_word_id ASC),
  INDEX fk_bell_word_id (bell_word_id ASC),
  INDEX fk_coffee_word_id (coffee_word_id ASC),
  INDEX fk_school_word_id (school_word_id ASC),
  INDEX fk_parent_word_id (parent_word_id ASC),
  INDEX fk_moon_word_id (moon_word_id ASC),
  INDEX fk_garden_word_id (garden_word_id ASC),
  INDEX fk_hat_word_id (hat_word_id ASC),
  INDEX fk_farmer_word_id (farmer_word_id ASC),
  INDEX fk_nose_word_id (nose_word_id ASC),
  INDEX fk_turkey_word_id (turkey_word_id ASC),
  INDEX fk_colour_word_id (colour_word_id ASC),
  INDEX fk_house_word_id (house_word_id ASC),
  INDEX fk_river_word_id (river_word_id ASC),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX uq_test_entry_id (test_entry_id ASC),
  CONSTRAINT fk_rey_data_drum_word_id
    FOREIGN KEY (drum_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_curtain_word_id
    FOREIGN KEY (curtain_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_bell_word_id
    FOREIGN KEY (bell_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_coffee_word_id
    FOREIGN KEY (coffee_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_school_word_id
    FOREIGN KEY (school_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_parent_word_id
    FOREIGN KEY (parent_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_moon_word_id
    FOREIGN KEY (moon_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_garden_word_id
    FOREIGN KEY (garden_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_hat_word_id
    FOREIGN KEY (hat_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_farmer_word_id
    FOREIGN KEY (farmer_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_nose_word_id
    FOREIGN KEY (nose_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_turkey_word_id
    FOREIGN KEY (turkey_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_colour_word_id
    FOREIGN KEY (colour_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_house_word_id
    FOREIGN KEY (house_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_river_word_id
    FOREIGN KEY (river_word_id)
    REFERENCES word (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_rey_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
