<?php
/**
 * test_entry_new_language.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: test_entry new_language
 */
class test_entry_new_language extends \cenozo\ui\push\base_record
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @language public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry', 'new_language', $args );
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

    // alpha_numeric and confirmation type tests cannot have more than 1
    // langauge
    $test_type_name = $db_test_entry->get_test()->get_test_type()->name;
    if( in_array( $test_type_name, array( 'alpha_numeric', 'confirmation' ) ) )
      throw lib::create( 'exception\notice',
        'This test type cannot have its language setting modified.',
        __METHOD__ );

    // disallow new language if the assignment is closed
    $db_assignment = $db_test_entry->get_assignment();
    if( !is_null( $db_assignment ) && !is_null( $db_assignment->end_datetime ) )
      throw lib::create( 'exception\notice',
        'This test is part of a closed assignment and cannot have its language setting modified.',
        __METHOD__ );
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

    $db_test_entry = $this->get_record();
    $db_test_entry->add_language( $this->get_argument( 'id_list' ) );
  }
}
