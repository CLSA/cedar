SELECT "Create new test_type table" AS "";

CREATE TABLE IF NOT EXISTS test_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  rank INT UNSIGNED NOT NULL,
  name VARCHAR(45) NOT NULL,
  data_type ENUM('aft', 'fas', 'mat', 'premat', 'rey') NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  UNIQUE INDEX uq_rank (rank ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO test_type( rank, name, data_type, description ) VALUES 
( 1, 'F-Word Fluency (FAS-F)', 'fas', 'Verbal fluency test of words starting with the letter F.' ),
( 2, 'A-Word Fluency (FAS-A)', 'fas', 'Verbal fluency test of words starting with the letter A.' ),
( 3, 'S-Word Fluency (FAS-S)', 'fas', 'Verbal fluency test of words starting with the letter S.' ),
( 4, 'Immediate Word List (REY1)', 'rey', 'Immediate recall of the Rey-Osterrieth word-list test.' ),
( 5, 'Animal Fluency (AFT)', 'aft', 'Verbal fluency test of animal names.' ),
( 6, 'Pre Mental Alternation (pre-MAT)', 'premat', 'Counting and alphabet test.' ),
( 7, 'Mental Alternation (MAT)', 'mat', 'Mental alternation test of numbers and letter.' ),
( 8, 'Delayed Word List (REY2)', 'rey', 'Delayed recall of the Rey-Osterrieth word-list test.' );
