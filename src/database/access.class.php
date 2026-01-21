<?php
/**
 * access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * access: record
 */
class access extends \cenozo\database\access
{
  /** 
   * Extends the parent method
   */
  public function is_modification_allowed()
  {
    // do not allow access to a higher tier or all-site (if the user doesn't have all-site access)
    $db_role = lib::create( 'business\session' )->get_role();
    $db_access_role = $this->get_role();
    return $db_access_role->tier <= $db_role->tier;
  }
}
