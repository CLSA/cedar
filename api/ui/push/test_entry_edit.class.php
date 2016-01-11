<?php
/**
 * test_entry_edit.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: test_entry edit
 *
 * Edit a test entry.
 */
class test_entry_edit extends \cenozo\ui\push\base_edit
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry', $args );
  }

  /**
   * Validate the operation.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  public function validate()
  {
    parent::validate();

    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );
    $columns = $this->get_argument( 'columns' );

    if( array_key_exists( 'participant_status', $columns ) &&
       'refused' == $columns['participant_status'] )
    {
      $db_test_entry = $this->get_record();
      if( in_array( $db_test_entry->audio_status, $test_entry_class_name::$audio_complete_states ) )
      {
        throw lib::create( 'exception\notice',
          'The requested participant status is inconsistent with the current audio status.',
          __METHOD__ );
      }
    }
    if( array_key_exists( 'audio_status', $columns ) &&
        in_array( $columns['audio_status'], $test_entry_class_name::$audio_complete_states ) )
    {
      $db_test_entry = $this->get_record();
      if( 'refused' == $db_test_entry->participant_status )
      {
        throw lib::create( 'exception\notice',
          'The requested audio status is inconsistent with the current participant status.',
          __METHOD__ );
      }
    }
  }

  /**
   * This method executes the operation's purpose.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  public function execute()
  {
    parent::execute();

    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $assignment_manager = lib::create( 'business\assignment_manager' );
    $db_test_entry = $this->get_record();

    $columns = $this->get_argument( 'columns' );

    if( ( array_key_exists( 'participant_status', $columns ) &&
          'refused' == $columns['participant_status'] ) ||
        ( array_key_exists( 'audio_status', $columns ) &&
          in_array( $columns['audio_status'], $test_entry_class_name::$audio_complete_states ) ) )
    {
      $db_test_entry->initialize( false );
    }

    // if changing deferred from requested to pending, do not complete the entry
    if( !( array_key_exists( 'deferred', $columns ) && 
           'pending' == $columns['deferred'] ) )
      $assignment_manager::complete_test_entry( $db_test_entry );
  }
}
