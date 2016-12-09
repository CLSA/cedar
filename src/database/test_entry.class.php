<?php
/**
 * test_entry.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry: record
 */
class test_entry extends \cenozo\database\record
{
  /**
   * TODO: document
   */
  public function get_data()
  {
    // no promary key means no data
    if( is_null( $this->id ) ) return NULL;

    $test_data_table_name = sprintf( 'database\%s', $this->get_data_table_name() );
    $test_data_class_name = lib::get_class_name( $test_data_table_name );
    $db_test_data = $test_data_class_name::get_unique_record( 'test_entry_id', $this->id );
    if( is_null( $db_test_data ) )
    { // the data doesn't exist yet, so create it
      $db_test_data = lib::create( $test_data_table_name );
      $db_test_data->test_entry_id = $this->id;
      $db_test_data->save();
    }

    return $db_test_data;
  }

  /**
   * TODO: document
   */
  public function get_data_table_name()
  {
    $db_test_type = $this->get_test_type();

    if( is_null( $db_test_type ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to get data table-name of test entry that has no test type set.',
        __METHOD__
      );
    }

    return $db_test_type->get_data_table_name();
  }
}
