-- Patch to upgrade database to version 2.4

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE sound_file.sql

SOURCE update_version_number.sql

COMMIT;
