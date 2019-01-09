SELECT "Removing write access to report_restriction services" AS "";

DELETE FROM service WHERE subject = "report_restriction" and method != "GET";

SELECT "Adding PATCH access to sound_file so that they can be marked as identifying" AS "";

INSERT INTO service SET
method = "PATCH",
subject = "sound_file",
resource = 1,
restricted = 0;
