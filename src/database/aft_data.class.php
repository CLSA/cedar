<?php
/**
 * aft_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * aft_data: record
 */
class aft_data extends base_rank_data
{
  /**
   * Returns the type of entry this aft_data is characterized by
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string (primary, variant or intrusion)
   * @access public
   */
  public function get_word_type()
  {
    $db_word = $this->get_word();
    return is_null( $db_word->aft_valid ) ? 'variant' : ( $db_word->aft_valid ? 'primary' : 'intrusion' );
  }
}
