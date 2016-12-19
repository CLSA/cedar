<?php
/**
 * activity.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * activity: record
 */
class activity extends \cenozo\database\activity
{
  /**
   * Closes any record whose user has had no activity for longer than the activity timeout
   * 
   * If a user is provided then this method will only close the user's activity (whether timed
   * out or not).
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\user $db_user Which user to close all activity
   * @return Returns the number of rows closed
   * @access public
   * @static
   */
  public static function close_lapsed( $db_user = NULL )
  {
    $test_entry_activity_class_name = lib::get_class_name( 'database\test_entry_activity' );
    $test_entry_activity_class_name::close_lapsed( $db_user );
    return parent::close_lapsed( $db_user );
  }
}
