<?php
/**
 * productivity_report.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\widget;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * widget productivity report
 */
class productivity_report extends \cenozo\ui\widget\base_report
{
  /**
   * Constructor
   *
   * Defines all variables which need to be set for the associated template.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'productivity', $args );
    $this->use_cache = true;
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
    parent::prepare();

    $this->add_restriction( 'site' );
    $this->add_restriction( 'dates' );
    $this->add_parameter( 'round_times', 'boolean', 'Round Times' );

    $this->set_variable( 'description', 'This report needs to be rewritten.' );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $this->set_parameter( 'round_times', true, true );
  }
}
