<?php
/**
 * word_correct.class.php
 *
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\widget;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * widget word correct
 */
class word_correct extends \cenozo\ui\widger
{
  /**
   * Constructor
   *
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'word', 'correct', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   *
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $this->set_heading( 'Correct Misspelled Word' );
  }

  /**
   * Finish setting the variables in a widget.
   *
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $db_word = $this->get_record();
  }
}
