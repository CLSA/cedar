<?php
/**
 * dictionary.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * dictionary: record
 */
class dictionary extends \cenozo\database\record
{
  /**
   * Returns a list of words.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param database\modifier query modifier (default NULL)
   * @return array
   * @static
   * @access public
   */
  public static function get_associative_word_list( $modifier = NULL )
  {
    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'language', 'word.language_id', 'language.id' );

    return static::db()->get_all(
      sprintf( 'SELECT word.id, word, language.code FROM word %s', $modifier->get_sql() ) );
  }

  /**
   * Get the test that links to this dictionary.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @return $db_test or NULL if no test
   * @access public
   */
  public function get_owner_test()
  {
    $test_class_name = lib::get_class_name( 'database\test' );

    if( is_null( $this->id ) )
      throw lib::create( 'exception\runtime',
        'Tried to find an owner test for a dictionary with no id', __METHOD__ );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'dictionary_id', '=', $this->id );
    $modifier->or_where( 'intrusion_dictionary_id', '=', $this->id );
    $modifier->or_where( 'variant_dictionary_id', '=', $this->id );
    $modifier->or_where( 'mispelled_dictionary_id', '=', $this->id );
    $modifier->limit( 1 );
    $db_test = current( $test_class_name::select( $modifier ) );
    return false !== $db_test ? $db_test : NULL;
  }

  /**
   * Get the test_entry daughter table word usage count for this dictionary.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return integer
   * @access public
   */
  public function get_usage_count()
  {
    $db_test = $this->get_owner_test();
    $usage_count = 0;
    if( !is_null( $db_test ) )
    {
      $sql = sprintf(
        'SELECT( IFNULL((SELECT SUM(total) FROM %s_word_total WHERE dictionary_id=%s), 0))' ,
        $db_test->get_test_type()->name,
        static::db()->format_string( $this->id ) );

      $usage_count = static::db()->get_one( $sql );
    }
    return $usage_count;
  }

  /**
   * Transfer words from this dictionary record to another or delete those words having no
   * usage and if no destination is specified.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @arg array $id_list array of word ids to transfer
   * @arg database\record $db_dictionary the dictionary to send the words to (NULL => delete)
   * @throws exception\runtime
   * @access public
   */
  public function transfer_word( $id_list, $db_dictionary = NULL )
  {
    $sql = '';
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'id', 'IN', $id_list );
    $modifier->where( 'dictionary_id', '=', $this->id );
    if( is_null( $db_dictionary ) )
    {
      $sql = sprintf(
        'DELETE FROM word %s', $modifier->get_sql() );
    }
    else
    {
      $sql = sprintf(
        'UPDATE word SET dictionary_id=%s %s',
        static::db()->format_string( $db_dictionary->id ),
        $modifier->get_sql() );
    }

    static::db()->execute( $sql );
  }
}
