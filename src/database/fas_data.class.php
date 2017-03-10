<?php
/**
 * fas_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * fas_data: record
 */
class fas_data extends base_rank_data
{
  /**
   * Returns the type of entry this fas_data is characterized by
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string (primary, variant or intrusion)
   * @access public
   */
  public function get_word_type()
  {
    $db_word = $this->get_word();
    return is_null( $db_word->fas_valid ) ? 'variant' : ( $db_word->fas_valid ? 'primary' : 'intrusion' );
  }
}
