<?php
/**
 * test_entry_submit.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: test_entry submit
 *
 * Submit a test entry
 */
class test_entry_submit extends \cenozo\ui\push\base_record
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry', 'submit', $args );
  }

  /**
   * Validate the operation.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $db_test_entry = $this->get_record();

    if( 'incomplete' == $db_test_entry->completed )
      throw lib::create( 'exception\notice',
        'Tried to submit an incomplete test.', __METHOD__ );
  }

  /**
   * Finishes the operation with any post-execution instructions that may be necessary.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @access protected
   */
  protected function finish()
  {
    parent::finish();

    $assignment_manager = lib::create( 'business\assignment_manager' );
    $db_test_entry = $this->get_record();

    if( !$assignment_manager::submit_test_entry( $db_test_entry ) )
      throw lib::create( 'exception\notice',
        'Failed to submit test.', __METHOD__ );
  }
}
