<?php
/**
 * word.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * word: record
 */
class word extends \cenozo\database\record
{
  /**
   * Check whether the word contains disallowed characters
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param boolean $alpha_numeric Validate the candidate as being either letter or a number
   * @return boolean True if a valid candidate
   * @access protected
   */
  public static function is_valid_word( $word_candidate, $alpha_numeric = false )
  {
    if( $alpha_numeric )
      return ( preg_match( '/^(0|[1-9][0-9]*)$/', $word_candidate ) ||
               preg_match( '/^\pL$/', $word_candidate ) );
    else
    {
      $word_list = explode( ' ', $word_candidate );
      foreach( $word_list as $word )
      {
        if( !preg_match( "/^[\pL`'-]+$/ui", $word ) ) return false;
      }
      return true;
    }
  }

  /**
   * Get the test_entry daughter table usage count for this word.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param string the name of the word count view to query
   * @return integer
   * @access public
   */
  public function get_usage_count()
  {
    $id = static::db()->format_string( $this->dictionary_id );

    $sql = sprintf(
      'SELECT tt.name FROM test_type tt '.
      'JOIN test t on t.test_type_id=tt.id '.
      'WHERE t.id IN ( '.
      'SELECT id FROM test '.
      'WHERE dictionary_id=%s '.
      'OR variant_dictionary_id=%s '.
      'OR intrusion_dictionary_id=%s '.
      'OR mispelled_dictionary_id=%s )',
      $id, $id, $id, $id );

    $type_name = static::db()->get_one( $sql );

    if( 'confirmation' == $type_name ) return 1;

    $sql = sprintf(
      'SELECT COUNT(*) FROM test_entry_%s '.
      'WHERE word_id=%s',
      $type_name,
      static::db()->format_string( $this->id ) );

    return static::db()->get_one( $sql );
  }

  /**
   * Is this word in use by any test_entry daughter records?
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function has_usage()
  {
    $id = static::db()->format_string( $this->dictionary_id );

    $sql = sprintf(
      'SELECT tt.name FROM test_type tt '.
      'JOIN test t on t.test_type_id=tt.id '.
      'WHERE t.id IN ( '.
      'SELECT id FROM test '.
      'WHERE dictionary_id=%s '.
      'OR variant_dictionary_id=%s '.
      'OR intrusion_dictionary_id=%s '.
      'OR mispelled_dictionary_id=%s )',
      $id, $id, $id, $id );

    $type_name = static::db()->get_one( $sql );

    if( 'confirmation' == $type_name ) return true;

    $sql = sprintf(
      'SELECT COUNT(*) FROM test_entry_%s '.
      'WHERE word_id=%s',
      $type_name,
      static::db()->format_string( $this->id ) );

    return 0 !== intval( static::db()->get_one( $sql ) );
  }
}
