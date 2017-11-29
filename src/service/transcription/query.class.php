<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\transcription;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    if( $this->get_argument( 'rescore', false ) )
    {
      // we can rescore all transcriptions by doing the same for all test-types
      $test_type_class_name = lib::get_class_name( 'database\test_type' );
      $test_type_class_name::rescore_all();
    }
  }
}
