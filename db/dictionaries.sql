-- -----------------------------------------------------
-- Dictionaries
-- -----------------------------------------------------
SET AUTOCOMMIT=0;

INSERT INTO dictionary( id, name, description )
VALUES( 1, "Confirmation", "yes and no response words for MAT confirmation type tests" );

INSERT INTO dictionary( id, name, description )
VALUES( 2, "Alpha_Numeric", "alpha numeric response words for the MAT (alternation) test" );

INSERT INTO dictionary( id, name, description )
VALUES( 3, "REY_Primary", "predefined words for the REY test" );

INSERT INTO dictionary( id, name, description )
VALUES( 4, "REY_Intrusion", "REY test intrusions" );

LOAD DATA LOCAL INFILE 'confirmation_dictionary.csv'
INTO TABLE word
CHARACTER SET latin1
FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n'
( word, language, dictionary_id );

LOAD DATA LOCAL INFILE 'alpha_numeric_dictionary.csv' IGNORE
INTO TABLE word
CHARACTER SET latin1
FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n'
( word, language, dictionary_id );

LOAD DATA LOCAL INFILE 'rey_dictionary.csv' IGNORE
INTO TABLE word
CHARACTER SET latin1
FIELDS TERMINATED BY ',' ENCLOSED BY '"'  LINES TERMINATED BY '\n'
( word, language, dictionary_id );

COMMIT;
