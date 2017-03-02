<?php
/**
 * base_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * base_data: record
 */
abstract class base_data extends \cenozo\database\record
{
  /**
   * Initializes new data for the given test entry
   * 
   * Note, this should only ever be called once, immediately after the test entry is created (saved)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\test_entry $db_test_entry
   * @access public
   * @static
   */
  public static function initialize( $db_test_entry )
  {
    if( is_null( $db_test_entry->id ) )
      throw lib::create( 'exception\runtime',
        'Tried to initialize data for test-entry record that has no primary id.',
        __METHOD__ );

    // delete any existing data record associated with the test_entry
    static::db()->execute( sprintf(
      'DELETE FROM %s WHERE test_entry_id = %s',
      static::get_table_name(),
      static::db()->format_string( $db_test_entry->id )
    ) );
  }
}
