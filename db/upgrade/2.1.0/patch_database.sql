-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE access.sql
SOURCE service.sql
SOURCE role_has_service.sql
SOURCE setting.sql
SOURCE writelog.sql

SOURCE special_letter.sql
SOURCE word.sql
SOURCE homophone.sql
SOURCE transcription.sql
SOURCE transcription_has_language.sql
SOURCE transcription_has_user.sql
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
SOURCE word_test_entry_total.sql
SOURCE update_participant_sound_file_total.sql
SOURCE update_word_test_entry_total.sql
SOURCE update_transcription_has_language.sql
SOURCE update_transcription_has_user.sql
SOURCE update_test_entry_has_word.sql

SOURCE import_cedar.sql

-- must be doen after importing cedar1
SOURCE test_entry_has_word.sql
SOURCE post_aft_data.sql
SOURCE post_fas_data.sql
SOURCE post_rey_data_has_word.sql

SOURCE table_character_sets.sql
SOURCE column_character_sets.sql

SOURCE update_version_number.sql

SELECT "TO COMPLETE THE INSTALLATION: you must now run the 'load_word_associations.php' script" AS "";

COMMIT;
