<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\rey_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    // reset the test when changing its language
    if( array_key_exists( 'language_id', $this->get_file_as_array() ) )
      $this->get_leaf_record()->get_test_entry()->reset();
  }
}
