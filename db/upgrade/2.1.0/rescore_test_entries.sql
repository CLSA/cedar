SELECT "Score existing test-entries" AS "";

DROP TABLE IF EXISTS test_entry_score;
CREATE TEMPORARY TABLE test_entry_score (
  id INT UNSIGNED NOT NULL,
  score INT UNSIGNED DEFAULT NULL,
  alt_score INT UNSIGNED DEFAULT NULL,
  PRIMARY KEY ( id )
);

INSERT INTO test_entry_score
SELECT test_entry.id,
       IF( word_id IS NULL, 0, COUNT( DISTINCT IFNULL( sister_word_id, word_id ) ) ) AS score,
       NULL AS alt_score
FROM test_entry
JOIN test_type ON test_entry.test_type_id = test_type.id
LEFT JOIN fas_data ON test_entry.id = fas_data.test_entry_id
LEFT JOIN word ON fas_data.word_id = word.id
WHERE test_type.data_type = 'fas'
AND 'submitted' = test_entry.state
AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
AND COALESCE( test_entry.participant_status, '' ) != 'refused'
AND IFNULL( word.fas, 'primary' ) = 'primary'
AND ( word.id IS NULL OR SUBSTRING( word.word, 1, 1 ) = LOWER( SUBSTRING( test_type.name, 1, 1 ) ) )
GROUP BY test_entry.id;

INSERT INTO test_entry_score
SELECT test_entry.id,
       IF( drum OR drum_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( curtain OR curtain_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( bell OR bell_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( coffee OR coffee_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( school OR school_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( parent OR parent_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( moon OR moon_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( garden OR garden_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( hat OR hat_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( farmer OR farmer_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( nose OR nose_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( turkey OR turkey_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( colour OR colour_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( house OR house_rey_data_variant_id IS NOT NULL, 1, 0 ) +
       IF( river OR river_rey_data_variant_id IS NOT NULL, 1, 0 ) AS score,
       NULL AS alt_score
FROM test_entry
JOIN test_type ON test_entry.test_type_id = test_type.id
JOIN rey_data ON test_entry.id = rey_data.test_entry_id
WHERE test_type.name LIKE '%(REY1)'
AND 'submitted' = test_entry.state
AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
AND COALESCE( test_entry.participant_status, '' ) != 'refused';

INSERT INTO test_entry_score
SELECT test_entry.id,
       IF( ( rey_data.drum AND first_rey_data.drum_rey_data_variant_id IS NULL ) OR
           ( rey_data.drum_rey_data_variant_id = first_rey_data.drum_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.curtain AND first_rey_data.curtain_rey_data_variant_id IS NULL ) OR
           ( rey_data.curtain_rey_data_variant_id = first_rey_data.curtain_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.bell AND first_rey_data.bell_rey_data_variant_id IS NULL ) OR
           ( rey_data.bell_rey_data_variant_id = first_rey_data.bell_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.coffee AND first_rey_data.coffee_rey_data_variant_id IS NULL ) OR
           ( rey_data.coffee_rey_data_variant_id = first_rey_data.coffee_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.school AND first_rey_data.school_rey_data_variant_id IS NULL ) OR
           ( rey_data.school_rey_data_variant_id = first_rey_data.school_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.parent AND first_rey_data.parent_rey_data_variant_id IS NULL ) OR
           ( rey_data.parent_rey_data_variant_id = first_rey_data.parent_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.moon AND first_rey_data.moon_rey_data_variant_id IS NULL ) OR
           ( rey_data.moon_rey_data_variant_id = first_rey_data.moon_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.garden AND first_rey_data.garden_rey_data_variant_id IS NULL ) OR
           ( rey_data.garden_rey_data_variant_id = first_rey_data.garden_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.hat AND first_rey_data.hat_rey_data_variant_id IS NULL ) OR
           ( rey_data.hat_rey_data_variant_id = first_rey_data.hat_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.farmer AND first_rey_data.farmer_rey_data_variant_id IS NULL ) OR
           ( rey_data.farmer_rey_data_variant_id = first_rey_data.farmer_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.nose AND first_rey_data.nose_rey_data_variant_id IS NULL ) OR
           ( rey_data.nose_rey_data_variant_id = first_rey_data.nose_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.turkey AND first_rey_data.turkey_rey_data_variant_id IS NULL ) OR
           ( rey_data.turkey_rey_data_variant_id = first_rey_data.turkey_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.colour AND first_rey_data.colour_rey_data_variant_id IS NULL ) OR
           ( rey_data.colour_rey_data_variant_id = first_rey_data.colour_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.house AND first_rey_data.house_rey_data_variant_id IS NULL ) OR
           ( rey_data.house_rey_data_variant_id = first_rey_data.house_rey_data_variant_id ), 1, 0 ) +
       IF( ( rey_data.river AND first_rey_data.river_rey_data_variant_id IS NULL ) OR
           ( rey_data.river_rey_data_variant_id = first_rey_data.river_rey_data_variant_id ), 1, 0 ) AS score,
       NULL AS alt_score
FROM test_entry
JOIN test_type ON test_entry.test_type_id = test_type.id
JOIN rey_data ON test_entry.id = rey_data.test_entry_id
JOIN test_entry AS first_test_entry ON first_test_entry.transcription_id = test_entry.transcription_id
JOIN test_type AS first_test_type ON first_test_entry.test_type_id = first_test_type.id
JOIN rey_data AS first_rey_data ON first_test_entry.id = first_rey_data.test_entry_id
WHERE test_type.name LIKE '%(REY2)'
AND first_test_type.name LIKE '%(REY1)'
AND 'submitted' = test_entry.state
AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
AND COALESCE( test_entry.participant_status, '' ) != 'refused'
AND COALESCE( first_test_entry.participant_status, '' ) NOT LIKE 'prompt%';

-- TODO: score all AFT tests

INSERT INTO test_entry_score
SELECT test_entry.id,
       IF( value != '1', NULL, 0 ) AS score,
       NULL AS alt_score
FROM test_entry
JOIN test_type ON test_entry.test_type_id = test_type.id
LEFT JOIN mat_data ON test_entry.id = mat_data.test_entry_id AND mat_data.rank = 1
WHERE test_type.data_type = 'mat'
AND 'submitted' = test_entry.state
AND COALESCE( test_entry.audio_status, '' ) != 'unusable'
AND COALESCE( test_entry.audio_status, '' ) != 'unavailable'
AND COALESCE( test_entry.participant_status, '' ) != 'refused'
GROUP BY test_entry.id;

UPDATE test_entry_score
JOIN test_entry USING( id )
JOIN test_type ON test_entry.test_type_id = test_type.id
SET test_entry_score.score = (
  SELECT COUNT(*)
  FROM mat_data
  WHERE test_entry_id = test_entry_score.id
  AND (
    ( rank = 2 AND value = 'a' ) OR ( rank = 3 AND value = '2' ) OR
    ( rank = 4 AND value = 'b' ) OR ( rank = 5 AND value = '3' ) OR
    ( rank = 6 AND value = 'c' ) OR ( rank = 7 AND value = '4' ) OR
    ( rank = 8 AND value = 'd' ) OR ( rank = 9 AND value = '5' ) OR
    ( rank = 10 AND value = 'e' ) OR ( rank = 11 AND value = '6' ) OR
    ( rank = 12 AND value = 'f' ) OR ( rank = 13 AND value = '7' ) OR
    ( rank = 14 AND value = 'g' ) OR ( rank = 15 AND value = '8' ) OR
    ( rank = 16 AND value = 'h' ) OR ( rank = 17 AND value = '9' ) OR
    ( rank = 18 AND value = 'i' ) OR ( rank = 19 AND value = '10' ) OR
    ( rank = 20 AND value = 'j' ) OR ( rank = 21 AND value = '11' ) OR
    ( rank = 22 AND value = 'k' ) OR ( rank = 23 AND value = '12' ) OR
    ( rank = 24 AND value = 'l' ) OR ( rank = 25 AND value = '13' ) OR
    ( rank = 26 AND value = 'm' ) OR ( rank = 27 AND value = '14' ) OR
    ( rank = 28 AND value = 'n' ) OR ( rank = 29 AND value = '15' ) OR
    ( rank = 30 AND value = 'o' ) OR ( rank = 31 AND value = '16' ) OR
    ( rank = 32 AND value = 'p' ) OR ( rank = 33 AND value = '17' ) OR
    ( rank = 34 AND value = 'q' ) OR ( rank = 35 AND value = '18' ) OR
    ( rank = 36 AND value = 'r' ) OR ( rank = 37 AND value = '19' ) OR
    ( rank = 38 AND value = 's' ) OR ( rank = 39 AND value = '20' ) OR
    ( rank = 40 AND value = 't' ) OR ( rank = 41 AND value = '21' ) OR
    ( rank = 42 AND value = 'u' ) OR ( rank = 43 AND value = '22' ) OR
    ( rank = 44 AND value = 'v' ) OR ( rank = 45 AND value = '23' ) OR
    ( rank = 46 AND value = 'w' ) OR ( rank = 47 AND value = '24' ) OR
    ( rank = 48 AND value = 'x' ) OR ( rank = 49 AND value = '25' ) OR
    ( rank = 50 AND value = 'y' ) OR ( rank = 51 AND value = '26' ) OR
    ( rank = 52 AND value = 'z' )
  )
)
WHERE test_type.data_type = 'mat' 
AND test_entry_score.score IS NOT NULL;

UPDATE test_entry
JOIN test_entry_score USING( id )
SET test_entry.score = test_entry_score.score,
    test_entry.alt_score = test_entry_score.alt_score;
