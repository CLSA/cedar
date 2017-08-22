-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE role_has_service.sql

SOURCE compound.sql

SOURCE update_version_number.sql

SELECT "TO COMPLETE THE INSTALLATION: you must now run the 'load_word_associations.php' script" AS "";

COMMIT;
