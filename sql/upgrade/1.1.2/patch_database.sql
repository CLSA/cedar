-- Patch to upgrade database to version 1.1.2

SET AUTOCOMMIT=0;

-- after all SOURCES, update service version
SOURCE update_version_number.sql;

COMMIT;
