<?php
/**
 * assignment.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * assignment: record
 */
class assignment extends \cenozo\database\record
{
  /**
   * Get the number of deferred test_entry records for this assignment.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return integer
   * @access public
   */
  public function get_deferred_count()
  {
    if( is_null( $this->id ) )
      throw lib::create( 'exception\runtime',
        'Tried to get deferred count for an assignment with no id', __METHOD__ );

    return static::db()->get_one(
      sprintf( 'SELECT deferred FROM test_entry_total_deferred WHERE assignment_id=%s',
               static::db()->format_string( $this->id ) ) );
  }

  /**
   * Are there any deferred test_entry records for this assignment?
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return boolean
   * @access public
   */
  public function has_deferrals()
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'assignment_id', '=', $this->id);
    $modifier->where( 'IFNULL(deferred,"NULL")', 'IN', $test_entry_class_name::$deferred_states );

    $sql = sprintf( 'SELECT COUNT(*) FROM test_entry %s', $modifier->get_sql() );
    return 0 < intval( static::db()->get_one( $sql ) );
  }

  /**
   * Are there any deferred(pending) test_entry records for this assignment?
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return boolean
   * @access public
   */
  public function has_pending_deferrals()
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'assignment_id', '=', $this->id);
    $modifier->where( 'IFNULL(deferred,"NULL")', '=', 'pending' );

    $sql = sprintf( 'SELECT COUNT(*) FROM test_entry %s', $modifier->get_sql() );
    return 0 < intval( static::db()->get_one( $sql ) );
  }

  /**
   * Are there any deferred(requested) test_entry records for this assignment?
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return boolean
   * @access public
   */
  public function has_requested_deferrals()
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'assignment_id', '=', $this->id);
    $modifier->where( 'IFNULL(deferred,"NULL")', '=', 'requested' );

    $sql = sprintf( 'SELECT COUNT(*) FROM test_entry %s', $modifier->get_sql() );
    return 0 < intval( static::db()->get_one( $sql ) );
  }

  /**
   * Get the status of deferrals as a string for this assignment
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_deferred_string()
  {
    $str = 'No';
    $has_pending = $this->has_pending_deferrals();
    $has_requested = $this->has_requested_deferrals();
    if( $has_pending || $has_requested )
    {
      $states = array();
      if( $has_requested )
        $states[]='requested';
      if( $has_pending )
        $states[]='pending';
      $str = 'Yes (' . implode( ',', $states ) . ')';
    }
    return $str;
  }

  /**
   * Get the number of completed test_entry records for this assignment.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return integer
   * @access public
   */
  public function get_completed_count()
  {
    return static::db()->get_one(
      sprintf( 'SELECT completed FROM test_entry_total_completed WHERE assignment_id = %s',
               static::db()->format_string( $this->id ) ) );
  }

  /**
   * Get the deferred and complete counts for this assignment.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return integer
   * @access public
   */
  public function get_all_counts()
  {
    return static::db()->get_row( sprintf(
      'SELECT deferred, completed FROM assignment_total WHERE assignment_id = %s',
      static::db()->format_string( $this->id ) ) );
  }

  /**
   * Get the next available participant id to create an assignment for.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @return string (NULL if none available)
   * @access public
   */
  public static function get_next_available_participant()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $recording_class_name = lib::get_class_name( 'database\recording' );
    $region_site_class_name = lib::get_class_name( 'database\region_site' );

    $session = lib::create( 'business\session' );
    $db_service = $session->get_service();
    $db_user = $session->get_user();
    $db_site = $session->get_site();

    // update the recordings
    $recording_class_name = lib::get_class_name( 'database\recording' );
    $recording_class_name::update_recording_list();

    // get the user's languages, defaulting to the service's language if they have none
    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'user_has_language.user_id', '=', $db_user->id );
    $sql = sprintf( 'SELECT language_id FROM user_has_language %s', $language_mod->get_sql() );
    $user_languages = static::db()->get_col( $sql );
    if( 0 == count( $user_languages ) ) $user_languages[] = $db_service->language_id;

    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'participant.active', '=', true );
    $participant_mod->where( 'user_has_cohort.user_id', '=', $db_user->id );
    $participant_mod->where( 'service.id', '=', $db_service->id );
    $participant_mod->where( 'participant_site.site_id', '=', $db_site->id );
    $participant_mod->where( 'IFNULL( participant.language_id, service.language_id )', 'IN', $user_languages );
    $participant_mod->where( 'participant_recording.total', '>', 0 );
    $participant_mod->where( 'assignment.id', '=', NULL ); // has never been assigned
    $participant_mod->order_desc( 'event.datetime' );
    $participant_mod->limit( 1 );

    $sql = sprintf(
      'SELECT DISTINCT participant.id '.
      'FROM service CROSS JOIN participant '.
      // participants belonging to the current site
      'JOIN participant_site ON participant_site.participant_id = participant.id '.
        'AND participant_site.service_id = service.id '.
      // participants whose cohort the user has access to
      'JOIN cohort ON participant.cohort_id = cohort.id '.
      'JOIN user_has_cohort ON cohort.id = user_has_cohort.cohort_id '.
      // who have completed the (cohort-based) event
      'JOIN event ON participant.id = event.participant_id '.
      'JOIN cohort_event_type ON participant.cohort_id = cohort_event_type.cohort_id '.
        'AND event.event_type_id = cohort_event_type.event_type_id '.
      // who have at least one recording
      'JOIN ( '.
        'SELECT participant_id, COUNT(*) total FROM recording GROUP BY participant_id '.
      ') AS participant_recording ON participant.id = participant_recording.participant_id '.
      // who have not yet been assigned
      'LEFT JOIN assignment ON assignment.participant_id = participant.id %s',
      $participant_mod->get_sql() );

    $participant_id = static::db()->get_one( $sql );

    return is_null( $participant_id ) ? NULL : lib::create( 'database\participant', $participant_id );
  }

  /**
   * Returns whether all tests constituting the assignment of $id are completed.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  integer id An assignment id
   * @param  boolean submitted Search based on test submitted status
   * @return boolean
   * @access public
   */
  public static function all_tests_complete( $id, $submitted = false )
  {
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'assignment.id', '=', $id );
    $modifier->where( 'IFNULL(deferred,"NULL")', 'NOT IN',
      $test_entry_class_name::$deferred_states );
    if( $submitted )
      $modifier->where( 'completed', '=', 'submitted' );
    else
      $modifier->where( 'completed', '!=', 'incomplete' );

    $sql = sprintf(
      'SELECT '.
      '( '.
        '( '.
          'SELECT COUNT(*) FROM test_entry '.
          'JOIN assignment ON assignment.id = test_entry.assignment_id '.
          'WHERE assignment.id = %s '.
        ') - '.
        '( '.
          'SELECT COUNT(*) FROM test_entry '.
          'JOIN assignment ON assignment.id = test_entry.assignment_id %s'.
        ') '.
      ')',
      static::db()->format_string( $id ),
      $modifier->get_sql() );

    return 0 === intval( static::db()->get_one( $sql ) );
  }

  /**
   * Returns whether all tests constituting the assignment of $id are submitted.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param  integer id An assignment id
   * @return boolean
   * @access public
   */
  public static function all_tests_submitted( $id )
  {
    return static::all_tests_complete( $id, true );
  }

  /**
   * Returns a list of users that the assignment can be reassigned to.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @return associative array  id => name
   * @access public
   */
  public function get_reassign_user()
  {
    $user_class_name = lib::get_class_name( 'database\user' );
    $role_class_name = lib::get_class_name( 'database\role' );
    $region_site_name = lib::get_class_name( 'database\region_site' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $language_class_name = lib::get_class_name( 'database\language' );

    $db_role = $role_class_name::get_unique_record( 'name', 'typist' );

    $session = lib::create( 'business\session' );
    $db_service = $session->get_service();
    $db_site = $session->get_site();

    // get all the languages employed by tests within the current assignment
    $test_language_mod = lib::create( 'database\modifier' );
    $test_language_mod->where( 'test_entry_has_language.test_entry_id', '=', 'test_entry.id', false );
    $test_language_mod->where( 'test_entry.assignment_id', '=', $this->id );
    $test_language_mod->group( 'id' );
    $test_language_mod->order( 'id' );
    $test_languages = array();
    foreach( $language_class_name::select( $test_language_mod ) as $db_language )
      $test_languages[] = $db_language->id;

    $user_mod = lib::create( 'database\modifier' );
    $user_mod->where( 'assignment.participant_id', '=', $this->participant_id );

    // get all typists at this site that can process the current record's participant
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'access.role_id', '=', $db_role->id );
    $modifier->where( 'access.site_id', '=', $db_site->id );
    $modifier->where( 'user_has_cohort.cohort_id', '=', $this->get_participant()->get_cohort()->id );
    $modifier->where( 'user.active', '=', true );
    $modifier->where( 'user.id', 'NOT IN', $user_class_name::select( $user_mod, false, true, true ) );
    $modifier->order( 'user.name' );

    $num_languages = count( $test_languages );
    $user_list = array();
    foreach( $user_class_name::select( $modifier ) as $db_user )
    {
      // for each user, get their languages
      $language_mod = lib::create( 'database\modifier' );
      $language_mod->where( 'user_has_language.user_id', '=', $db_user->id );
      $language_mod->order( 'id' );

      $user_languages = array();
      foreach( $language_class_name::select( $language_mod ) as $db_language )
        $user_languages[] = $db_language->id;
      if( $num_languages == count( array_intersect( $user_languages, $test_languages ) ) )
          $user_list[$db_user->id] = $db_user->name;
    }

    return $user_list;
  }

  /**
   * Initialize an assignment.  All existing test_entry records are deleted
   * and new test_entry records are created.
   * Only assigments that have never been finished can be initialized.
   * This method is typically called during creation of a db_assignment.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access public
   */
  public function initialize()
  {
    $test_class_name = lib::get_class_name( 'database\test' );

    $db_participant = $this->get_participant();

    if( !is_null( $this->end_datetime ) )
      throw lib::create( 'exception\notice',
        'The assignment for participant UID ' . $db_participant->uid .
        'is closed and cannot be initialized', __METHOD__ );

    $modifier = NULL;
    if( 'tracking' == $db_participant->get_cohort()->name )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'name', 'NOT LIKE', 'FAS%' );
    }

    // create test_entry record(s)
    foreach( $test_class_name::select( $modifier ) as $db_test )
    {
      $db_test_entry = lib::create( 'database\test_entry' );
      $db_test_entry->test_id = $db_test->id;
      $db_test_entry->assignment_id = $this->id;
      $db_test_entry->save();
      $use_default = true;
      if( $use_default )
      {
        $db_language = $db_test_entry->get_default_participant_language();
        $db_test_entry->add_language( array( $db_language->id ) );
      }
      // create daughter entry record(s)
      $db_test_entry->initialize( false );
    }
  }
}

$assignment_mod = lib::create( 'database\modifier' );
$assignment_mod->where( 'assignment.participant_id', '=', 'participant.id', false );
$assignment_mod->where( 'participant.cohort_id', '=', 'cohort.id', false );
assignment::customize_join( 'cohort', $assignment_mod );
