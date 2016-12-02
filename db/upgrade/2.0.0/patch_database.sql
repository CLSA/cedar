-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE access.sql
SOURCE service.sql
SOURCE role_has_service.sql
SOURCE setting.sql
SOURCE writelog.sql

SOURCE sound_file_type.sql
SOURCE sound_file.sql
SOURCE transcription.sql
SOURCE user_has_cohort.sql
SOURCE user_has_language.sql

SOURCE participant_sound_file_total.sql
SOURCE update_participant_sound_file_total.sql

SOURCE import_cedar.sql

SOURCE update_version_number.sql

COMMIT;

