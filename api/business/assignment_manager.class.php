<?php
/**
 * assignment_manager.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\business;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Manages assignments.
 */
class assignment_manager extends \cenozo\singleton
{
  /**
   * Reset a test_entry.  All existing test_entry daughter records are deleted
   * and new ones are created. Only test_entrys belonging to assignments that
   * have never been finished can be reset.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @param  database\test_entry $db_test_entry
   * @access public
   */
  public static function reset_test_entry( $db_test_entry )
  {
    $db_assignment = $db_test_entry->get_assignment();

    if( !is_null( $db_assignment->end_datetime ) )
      throw lib::create( 'exception\notice',
        'The assignment for participant UID ' . $db_assignment->get_participant()->uid .
        'is closed and cannot have any tests reset.', __METHOD__ );

    $db_test_entry->initialize();
  }

  /**
   * Reassign an assigment.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  database\assignment $db_assignment
   * @access public
   */
  public static function reassign( $db_assignment )
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );
    $util_class_name = lib::get_class_name( 'util' );

    // delete the test_entry records
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'assignment_id', '=', $db_assignment->id );
    foreach( $test_entry_class_name::select( $modifier ) as $db_test_entry )
    {
      $db_test_entry->delete();
    }

    // initialize the assignment
    $db_assignment->initialize();

    $db_assignment->end_datetime = NULL;
    $now_date_obj = $util_class_name::get_datetime_object();
    $db_assignment->start_datetime = $now_date_obj->format( 'Y-m-d H:i:s' );
    $db_assignment->save();
  }

  /**
   * Purge an assigment of its test_entry records.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  database\assignment $db_assignment
   * @access public
   */
  public static function purge_assignment( $db_assignment )
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    // delete test_entry and daughter entry records
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'assignment_id', '=', $db_assignment->id );
    foreach( $test_entry_class_name::select( $modifier ) as $db_test_entry )
    {
      $db_test_entry->delete();
    }
  }

  /**
   * Update an assigment's end_datetime based on their test_entry
   * complete and deferred status.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  database\assignment $db_assignment
   * @access public
   */
  public static function complete_assignment( $db_assignment )
  {
    $assignment_class_name = lib::get_class_name( 'database\assignment' );
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    if( $assignment_class_name::all_tests_submitted( $db_assignment->id ) )
    {
      // both assignments are now complete: set their end datetimes
      $end_datetime = util::get_datetime_object()->format( "Y-m-d H:i:s" );
      $db_assignment->end_datetime = $end_datetime;
      $db_assignment->save();
    }
    else
    {
      if( !is_null( $db_assignment->end_datetime ) )
      {
        $db_assignment->end_datetime = NULL;
        $db_assignment->save();
      }
    }
  }

  /**
   * Update test_entry complete state.  This method is
   * typically called whenever a daughter table entry is edited.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  database\test_entry $db_test_entry
   * @access public
   */
  public static function complete_test_entry( $db_test_entry )
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $db_test_entry->completed = $db_test_entry->is_completed() ? 'complete' : 'incomplete';
    if( in_array( $db_test_entry->deferred, $test_entry_class_name::$deferred_states ) )
    {
      if( $db_test_entry->completed && 'pending' == $db_test_entry->deferred )
        $db_test_entry->deferred = 'resolved';
    }
    else if( 'resolved' == $db_test_entry->deferred )
    {
      if( 'incomplete' == $db_test_entry->completed )
        $db_test_entry->deferred = NULL;
    }

    $db_test_entry->save();
  }

  /**
   * Submit a completed test_entry.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  database\test_entry $db_test_entry
   * @return bool success status
   * @access public
   */
  public static function submit_test_entry( $db_test_entry )
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );
    $assignment_class_name = lib::get_class_name( 'database\assignment' );
    $db_assignment = NULL;
    $ret_val = false;

    if( 'incomplete' != $db_test_entry->completed &&
        !in_array( $db_test_entry->deferred, $test_entry_class_name::$deferred_states ) )
    {
      $db_assignment = $db_test_entry->get_assignment();
      $ret_val = true;
    }

    if( $ret_val )
    {
      $db_test_entry->completed = 'submitted';
      $db_test_entry->save();
      static::complete_assignment( $db_assignment );
    }

    return $ret_val;
  }
}
