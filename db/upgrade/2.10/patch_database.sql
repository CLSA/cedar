-- Patch to upgrade database to version 2.10

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE import_rey_word.sql

SOURCE update_version_number.sql

COMMIT;
