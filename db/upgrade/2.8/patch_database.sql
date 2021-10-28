-- Patch to upgrade database to version 2.8

SET AUTOCOMMIT=0;

SOURCE service.sql

SOURCE update_version_number.sql

COMMIT;
