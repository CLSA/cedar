SELECT "Adding new services" AS "";

INSERT IGNORE INTO service ( subject, method, resource, restricted ) VALUES
( "sound_file", "PATCH", 1, 0 ),
( 'status_type', 'DELETE', 1, 1 ),
( 'status_type', 'GET', 0, 0 ),
( 'status_type', 'GET', 1, 0 ),
( 'status_type', 'PATCH', 1, 1 ),
( 'status_type', 'POST', 0, 1 );

UPDATE service SET restricted = 0
WHERE subject = "test_type"
AND method = "GET"
AND resource = 1;
