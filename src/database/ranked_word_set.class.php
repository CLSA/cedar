<?php
/**
 * ranked_word_set.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * ranked_word_set: record
 */
class ranked_word_set extends \cenozo\database\has_rank
{
  /**
   * Get a word from this ranked word set by language.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @var database\language $db_language the language (default English)
   * @access public
   */
  public function get_word( $db_language )
  {
    if( is_null( $db_language ) )
      throw lib::create( 'exception\notice',
        'A language must be specified to retrieve a word from a ranked word set',  __METHOD__ );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'language_id', '=', $db_language->id );
    $modifier->where( 'ranked_word_set_id', '=', $this->id );
    $sql = sprintf(
      'SELECT word_id FROM ranked_word_set_has_language '.
      '%s',
      $modifier->get_sql() );
    $id = static::db()->get_one( $sql );

    return is_null( $id ) ? $id : lib::create( 'database\word', $id );
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'test';
}
