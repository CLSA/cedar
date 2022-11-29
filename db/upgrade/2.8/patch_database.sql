-- Patch to upgrade database to version 2.8

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE role_has_service.sql
SOURCE sound_file.sql
SOURCE filename_format.sql
SOURCE transcription_event_type.sql

SOURCE update_version_number.sql

COMMIT;
