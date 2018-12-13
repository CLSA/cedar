-- Patch to upgrade database to version 2.3

SET AUTOCOMMIT=0;

SOURCE report_type.sql
SOURCE application_type_has_report_type.sql
SOURCE role_has_report_type.sql

SOURCE update_version_number.sql

COMMIT;
