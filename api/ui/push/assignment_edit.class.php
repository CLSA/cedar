<?php
/**
 * assignment_edit.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: assignment edit
 *
 * Edit a assignment.
 */
class assignment_edit extends \cenozo\ui\push\base_edit
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
   * Validate the operation.  If validation fails this method will throw a notice exception.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @throws exception\runtime
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $columns = $this->get_argument( 'columns' );
    if( array_key_exists( 'user_id', $columns ) )
    {
      $user_id = $columns['user_id'];
      if( empty( $user_id ) )
        throw lib::create( 'exception\notice',
          'Invalid (empty) user selection', __METHOD__ );

      $db_assignment = $this->get_record();
      if( $user_id == $db_assignment->get_user()->id )
        throw lib::create( 'exception\runtime',
          'Invalid (primary) user for reassigning', __METHOD__ );
    }
  }

  /**
   * This method executes the operation's purpose.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $assignment_manager = lib::create( 'business\assignment_manager' );
    $assignment_manager->reassign( $this->get_record() );
  }
}
