<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\rey_data\word;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all query (collection-based get) services
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // add the word type as a column
    $this->select->add_column( 'IF( word.misspelled IS NULL, "variant", "intrusion" )', 'word_type', false );
  }
}
