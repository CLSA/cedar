<?php
/**
 * aft_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * aft_data: record
 */
class aft_data extends base_rank_data
{
  /**
   * Replace all uses of a word with another
   * 
   * This is used when correcting spelling errors
   * @param database\word $db_old_word
   * @param database\word $db_new_word
   * @access public
   * @static
   */
  public static function substitute_word( $db_old_word, $db_new_word )
  {
    $sql = sprintf(
      'UPDATE aft_data SET word_id = %s WHERE word_id = %s',
      static::db()->format_string( $db_new_word->id ),
      static::db()->format_string( $db_old_word->id )
    );

    static::db()->execute( $sql );
  }
}
