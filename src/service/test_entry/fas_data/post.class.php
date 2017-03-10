<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\test_entry\fas_data;
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
    $db_word = $record->get_word();
    $this->set_data( util::json_encode( array (
      'id' => $record->id,
      'word' => $db_word->word,
      'code' => $db_word->get_language()->code,
      'word_type' => $record->get_word_type()
    ) ) );
  }
}
