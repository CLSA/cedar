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
  public function open_action() { $this->add_action( 'open' ); }

  /**
   * TODO: document
   */
  public function close_action() { $this->add_action( 'close' ); }

  /**
   * TODO: document
   */
  private function add_action( $action )
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // only add actions for typists
    if( 'typist' == $db_role->name && !$this->submitted )
    {
      $add_action = true;

      // check to see if the (most recent) action already exists
      $action_mod = lib::create( 'database\modifier' );
      $action_mod->order_desc( 'datetime' );
      $action_mod->where( 'user_id', '=', $db_user->id );
      $action_mod->limit( 1 );
      $action_sel = lib::create( 'database\select' );
      $action_sel->add_column( 'action' );
      $action_list = $this->get_test_entry_action_list( $action_sel, $action_mod );
      if( 0 < count( $action_list ) )
      {
        $db_test_entry_action = current( $action_list );
        if( $action == $db_test_entry_action['action'] ) $add_action = false;
      }

      if( $add_action )
      {
        $db_test_entry_action = lib::create( 'database\test_entry_action' );
        $db_test_entry_action->test_entry_id = $this->id;
        $db_test_entry_action->user_id = $db_user->id;
        $db_test_entry_action->action = $action;
        $db_test_entry_action->datetime = util::get_datetime_object();
        $db_test_entry_action->save();
      }
    }
  }
}
