SELECT "Create new test_type table" AS "";

CREATE TABLE IF NOT EXISTS test_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  rank INT UNSIGNED NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  UNIQUE INDEX uq_rank (rank ASC),
  UNIQUE INDEX uq_title (title ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO test_type( name, rank, title, description ) VALUES 
( 'REY 1', 1, 'Immediate Word List', 'Immediate recall of the Rey-Osterrieth word-list test.' ),
( 'REY 2', 2, 'Delayed Word List', 'Delayed recall of the Rey-Osterrieth word-list test.' ),
( 'AFT', 3, 'Animal Fluency', 'Verbal fluency test of animal names.' ),
( 'MAT', 4, 'Mental Alternation', 'Mental alternation test of numbers and letter.' );
