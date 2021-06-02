DROP PROCEDURE IF EXISTS patch_role_has_service;
DELIMITER //
CREATE PROCEDURE patch_role_has_service()
  BEGIN

    SELECT "Removing access to consent services" AS "";

    DELETE FROM role_has_service WHERE service_id IN ( SELECT id FROM service WHERE subject = 'consent' );

  END //
DELIMITER ;

CALL patch_role_has_service();
DROP PROCEDURE IF EXISTS patch_role_has_service;
