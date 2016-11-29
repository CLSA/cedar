-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE access.sql

SOURCE activity.sql
SOURCE writelog.sql
SOURCE service.sql
SOURCE role_has_operation.sql
SOURCE role_has_service.sql
SOURCE operation.sql
SOURCE site.sql
SOURCE setting_value.sql
SOURCE setting.sql
SOURCE system_message.sql
SOURCE away_time.sql
SOURCE user_time.sql
SOURCE report_type.sql
SOURCE report_restriction.sql
SOURCE application_type_has_report_type.sql
SOURCE role_has_report_type.sql
SOURCE overview.sql
SOURCE application_type_has_overview.sql
SOURCE role_has_overview.sql

SOURCE table_character_sets.sql
SOURCE column_character_sets.sql

SOURCE update_version_number.sql

COMMIT;

