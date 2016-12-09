SELECT "Create new test_type table" AS "";

CREATE TABLE IF NOT EXISTS test_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  rank INT UNSIGNED NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  UNIQUE INDEX uq_rank (rank ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO test_type( name, rank, description ) VALUES 
( 'REY I', 1, 'Immediate recall of the Rey-Osterrieth word-list test.' ),
( 'REY II', 2, 'Delayed recall of the Rey-Osterrieth word-list test.' ),
( 'AFT', 3, 'Verbal fluency test of animal names.' ),
( 'MAT', 4, 'Mental alternation test of numbers and letter.' );