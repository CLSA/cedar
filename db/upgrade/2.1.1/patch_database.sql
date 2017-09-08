-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE role_has_service.sql
SOURCE update_word_test_entry_total.sql
SOURCE word_test_entry_total.sql
SOURCE update_word_test_type_total.sql
SOURCE word_test_type_total.sql
SOURCE test_entry_has_word.sql
SOURCE word.sql

SOURCE compound.sql

SOURCE update_version_number.sql

SELECT "TO COMPLETE THE INSTALLATION: you must now run the 'load_word_associations.php' and 'correct_non_compound_words.php' scripts" AS "";

COMMIT;
