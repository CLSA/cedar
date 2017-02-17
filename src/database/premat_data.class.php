<?php
/**
 * premat_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * premat_data: record
 */
class premat_data extends base_data
{
  /**
   * Override parent method
   */
  public static function initialize( $db_test_entry )
  {
    // create a premat_data record for the test entry
    $db_premat_data = new static();
    $db_premat_data->test_entry_id = $db_test_entry->id;
    $db_premat_data->save();
  }
}
