<?php
/**
 * word.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Extend parent method
   */
  public function __set( $column_name, $value )
  {
    // check that there are no letter conflicts
    if( ( 'word' == $column_name && !is_null( $this->language_id ) ) ||
        ( 'language_id' == $column_name && !is_null( $this->word ) ) )
    {
      $language_id = 'language_id' == $column_name ? $value : $this->language_id;
      $word = 'word' == $column_name ? $value : $this->word;

      $test = 'a-z';
      $special_letter_class_name = lib::get_class_name( 'database\special_letter' );
      $special_letter_sel = lib::create( 'database\select' );
      $special_letter_sel->from( 'special_letter' );
      $special_letter_sel->add_column( 'GROUP_CONCAT( letter SEPARATOR "" )', 'letters', false );
      $special_letter_mod = lib::create( 'database\modifier' );
      $special_letter_mod->group( 'language_id' );
      $special_letter_mod->where( 'language_id', '=', $language_id );
      $special_letter_list = $special_letter_class_name::select( $special_letter_sel, $special_letter_mod );
      if( 0 < count( $special_letter_list ) )
        $test .= current( $special_letter_list )['letters'];

      if( !preg_match( sprintf( "/^[%s][-' %s]*[%s]$/", $test, $test, $test ), $word ) )
        throw lib::create( 'exception\argument', $column_name, $value, __METHOD__ );
    }

    parent::__set( $column_name, $value );
  }

  /**
   * Returns the qualified value for the fas column based on the test type
   * 
   * This is necessary since the f-test has only f-words primary, a-test a-words and s-test s-words
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\test_type $db_test_type
   * @return string
   * @access public
   */
  public function get_fas( $db_test_type )
  {
    if( is_null( $db_test_type ) || 'fas' != $db_test_type->data_type )
      throw lib::create( 'exception\argument', 'db_test_type', $db_test_type, __METHOD__ );

    return 'primary' == $this->fas ? (
      strtolower( substr( $this->word, 0, 1 ) ) == strtolower( substr( $db_test_type->name, 0, 1 ) ) ?
        'primary' : 'intrusion'
      ) : $this->fas;
  }
}
