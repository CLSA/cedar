<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\test_entry\mat_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    // replace the data with the full record
    $record = $this->get_leaf_record();
    $db_test_type = $record->get_test_entry()->get_test_type();
    $this->set_data( array(
      'id' => $record->id,
      'rank' => $record->rank,
      'word' => $record->value
    ) );
  }
}
