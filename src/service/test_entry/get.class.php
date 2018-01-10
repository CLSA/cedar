<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_entry;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all get (single-resource) services
 */
class get extends \cenozo\service\get
{
  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    // make a note that the test entry has been opened (this will only happen for typists)
    $this->get_leaf_record()->open_activity();
  }
}
