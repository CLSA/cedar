SELECT "Adding new services" AS "";

INSERT IGNORE INTO service ( subject, method, resource, restricted ) VALUES

( 'compound', 'DELETE', 1, 1 ),
( 'compound', 'GET', 0, 1 ),
( 'compound', 'POST', 0, 1 );
