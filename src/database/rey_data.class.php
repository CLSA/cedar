<?php
/**
 * rey_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * rey_data: record
 */
class rey_data extends base_data
{
  /**
   * Override parent method
   */
  public static function initialize( $db_test_entry )
  {
    // create a rey_data record for the test entry
    $db_rey_data = new static();
    $db_rey_data->test_entry_id = $db_test_entry->id;
    $db_rey_data->save();
  }
}
