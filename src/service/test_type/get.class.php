<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_type;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Extends parent class
 */
class get extends \cenozo\service\get
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    if( $this->get_argument( 'rescore', false ) )
    {
      $db_test_type = $this->get_leaf_record();
      $db_test_type->rescore();
    }
  }
}
