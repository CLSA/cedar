SELECT "Creating new dictionary table" AS "";

CREATE TABLE IF NOT EXISTS dictionary (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  reserved TINYINT(1) NOT NULL DEFAULT 0,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;
