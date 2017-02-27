-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE access.sql
SOURCE service.sql
SOURCE role_has_service.sql
SOURCE setting.sql
SOURCE writelog.sql

SOURCE dictionary.sql
SOURCE word.sql
SOURCE transcription.sql
SOURCE transcription_has_language.sql
SOURCE test_type.sql
SOURCE test_type_has_cohort.sql
SOURCE filename_format.sql
SOURCE sound_file.sql
SOURCE test_entry.sql
SOURCE test_entry_has_language.sql
SOURCE test_entry_activity.sql
SOURCE test_entry_note.sql
SOURCE aft_data.sql
SOURCE fas_data.sql
SOURCE mat_data.sql
SOURCE premat_data.sql
SOURCE rey_data_variant.sql
SOURCE rey_data.sql
SOURCE rey_data_has_word.sql
SOURCE user_has_cohort.sql
SOURCE user_has_language.sql

SOURCE participant_sound_file_total.sql
SOURCE update_participant_sound_file_total.sql
SOURCE update_transcription_has_language.sql

SOURCE import_cedar.sql

SOURCE update_version_number.sql

COMMIT;
