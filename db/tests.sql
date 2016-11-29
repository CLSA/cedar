-- -----------------------------------------------------
-- Tests
-- -----------------------------------------------------
SET AUTOCOMMIT=0;

INSERT INTO test_type( id, name )
VALUES( 1, "confirmation" ), ( 2, "alpha_numeric"), ( 3, "ranked_word"), ( 4, "classification");

INSERT INTO test( id, name, rank_words, rank, test_type_id, dictionary_id, intrusion_dictionary_id )
VALUES( 1, "REY", true, 1, 3, 3, 4 );

INSERT INTO test( id, name, rank, test_type_id )
VALUES( 2, "AFT", 2, 4 );

INSERT INTO test( id, name, strict, rank, test_type_id, dictionary_id )
VALUES( 3, "MAT (counting)", true, 3, 1, 1 );

INSERT INTO test( id, name, strict, rank, test_type_id, dictionary_id )
VALUES( 4, "MAT (alphabet)", true, 4, 1, 1 );

INSERT INTO test( id, name, strict, rank, test_type_id, dictionary_id )
VALUES( 5, "MAT (alternation)", true, 5, 2, 2 );

INSERT INTO test( id, name, rank_words, rank, test_type_id, dictionary_id, intrusion_dictionary_id )
VALUES( 6, "REY II", true, 6, 3, 3, 4 );

INSERT INTO test( id, name, rank, test_type_id )
VALUES( 7, "FAS (f words)", 7, 4 );

INSERT INTO test( id, name, rank, test_type_id )
VALUES( 8, "FAS (a words)", 8, 4 );

INSERT INTO test( id, name, rank, test_type_id )
VALUES( 9, "FAS (s words)", 9, 4 );

COMMIT;
