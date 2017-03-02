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
   * Override parent method
   */
  public function save()
  {
    $new_record = is_null( $this->id );
    parent::save();
    if( $new_record ) $this->reset();
  }

  /**
   * Resets the test-entry by initializing the data associated with it (deleting any existing data)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function reset()
  {
    // initialize the test entry's data
    $data_class_name = lib::get_class_name( sprintf( 'database\%s', $this->get_data_table_name() ) );
    $data_class_name::initialize( $this );
  }

  /**
   * Override parent method
   */
  public static function get_unique_record( $column, $value )
  {
    $test_type_class_name = lib::get_class_name( 'database\test_type' );

    // convert uid column to a transcription_id
    if( is_array( $column ) && in_array( 'uid', $column ) )
    {
      $index = array_search( 'uid', $column );
      if( false !== $index )
      {
        $transcription_class_name = lib::get_class_name( 'database\transcription' );
        $db_transcription = $transcription_class_name::get_unique_record( 'uid', $value[$index] );
        $column[$index] = 'transcription_id';
        $value[$index] = is_null( $db_transcription ) ? 0 : $db_transcription->id;
      }
    }

    // add (uid,test_type_rank) as artificial unique record type
    if( is_array( $column ) && in_array( 'test_type_rank', $column ) )
    {
      $index = array_search( 'test_type_rank', $column );
      if( false !== $index ) {
        $db_test_type = $test_type_class_name::get_unique_record( 'rank', $value[$index] );
        if( !is_null( $db_test_type ) )
        {
          $column[$index] = 'test_type_id';
          $value[$index] = $db_test_type->id;
        }
      }
    }

    return parent::get_unique_record( $column, $value );
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

    return $db_test_type->data_type.'_data';
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
