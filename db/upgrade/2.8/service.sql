SELECT "Adding new services" AS "";

INSERT IGNORE INTO service ( subject, method, resource, restricted ) VALUES
( 'country', 'GET', 0, 0 ),
( 'country', 'GET', 1, 0 ),
( 'notation', 'DELETE', 1, 1 ),
( 'notation', 'PATCH', 1, 1 ),
( 'notation', 'POST', 0, 1 ),
( 'transcription_event_type', 'DELETE', 1, 1 ),
( 'transcription_event_type', 'GET', 0, 1 ),
( 'transcription_event_type', 'GET', 1, 1 ),
( 'transcription_event_type', 'PATCH', 1, 1 ),
( 'transcription_event_type', 'POST', 0, 1 );
