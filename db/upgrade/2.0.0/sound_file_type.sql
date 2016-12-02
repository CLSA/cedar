SELECT "Creating new sound_file_type table" AS "";

CREATE TABLE IF NOT EXISTS sound_file_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO sound_file_type( name )
VALUES ( "Animal Fluency" ), ( "FAS Words" ), ( "Mental Alternation" ), ( "Memory Retention" );
