<?php
/**
 * assignment_new.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: assignment new
 *
 * Create a new assignment.
 */
class assignment_new extends \cenozo\ui\push\base_new
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'assignment', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    $assignment_class_name = lib::get_class_name( 'database\assignment' );

    $session = lib::create( 'business\session' );

    // block with a semaphore
    $session->acquire_semaphore();

    $db_participant = $assignment_class_name::get_next_available_participant();

    // throw a notice if no participant was found
    if( is_null( $db_participant ) )
    {
      $session->release_semaphore();
      throw lib::create( 'exception\notice',
        'There are no participants available for which you have access to.', __METHOD__ );
    }

    $columns = array();
    $columns['user_id'] = $session->get_user()->id;
    $columns['participant_id'] = $db_participant->id;
    $columns['site_id'] = $session->get_site()->id;

    $this->arguments['columns'] = $columns;

    parent::prepare();
  }

  /**
   * Finishes the operation with any post-execution instructions that may be necessary.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function finish()
  {
    parent::finish();

    $db_assignment = $this->get_record();
    $db_assignment->initialize();

    $session = lib::create( 'business\session' );
    $session->release_semaphore();
  }
}
