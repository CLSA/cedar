<?php
/**
 * test_type.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_type: record
 */
class test_type extends \cenozo\database\record
{
  /**
   * TODO: document
   */
  public function get_data_table_name()
  {
    return sprintf( '%s_data', strtolower( str_replace( ' ', '_', $this->name ) ) );
  }
}
