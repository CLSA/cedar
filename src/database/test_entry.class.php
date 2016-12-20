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

  /**
   * TODO: document
   */
  public function open_activity()
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // only open activity for typists
    if( 'typist' == $db_role->name && 'assigned' == $this->state )
    {
      // check to see if the activity record already exists
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'user_id', '=', $db_user->id );
      $modifier->where( 'end_datetime', '=', NULL );
      if( 0 == $this->get_test_entry_activity_count( $modifier ) )
      {
        $db_test_entry_activity = lib::create( 'database\test_entry_activity' );
        $db_test_entry_activity->test_entry_id = $this->id;
        $db_test_entry_activity->user_id = $db_user->id;
        $db_test_entry_activity->start_datetime = util::get_datetime_object();
        $db_test_entry_activity->save();
      }
    }
  }

  /**
   * TODO: document
   */
  public function close_activity()
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // only close activity for typists
    if( 'typist' == $db_role->name )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'test_entry_id', '=', $this->id );
      $modifier->where( 'user_id', '=', $db_user->id );
      $modifier->where( 'end_datetime', '=', NULL );

      static::db()->execute( sprintf(
        'UPDATE test_entry_activity'."\n".
        'SET end_datetime = UTC_TIMESTAMP() %s',
        $modifier->get_sql()
      ) );
    }
  }
}
